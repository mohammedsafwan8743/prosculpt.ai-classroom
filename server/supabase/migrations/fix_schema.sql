-- =============================================
-- SQL FIX FOR EXISTENT SUPABASE TABLES
-- Run this in your Supabase SQL Editor to alter the existing tables
-- and add the missing columns required for the Classroom Portal.
-- =============================================

-- 1. Alter 'users' table to add missing columns if not present
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Create 'college_profiles' table (which was missing)
CREATE TABLE IF NOT EXISTS public.college_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Alter 'classrooms' table to add missing columns required by the app
ALTER TABLE public.classrooms 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS course TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS batch TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"recording_enabled": true, "allow_student_chat": true, "allow_screen_share": true, "visibility": "private"}'::jsonb,
ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- 4. Enable RLS on college_profiles if not already done
ALTER TABLE public.college_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create basic policies for college_profiles
DROP POLICY IF EXISTS "College can read own profile" ON public.college_profiles;
CREATE POLICY "College can read own profile"
  ON public.college_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "College can update own profile" ON public.college_profiles;
CREATE POLICY "College can update own profile"
  ON public.college_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Add missing name columns to student_profiles and trainer_profiles
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.trainer_profiles ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';

UPDATE public.student_profiles 
SET name = COALESCE(full_name, CONCAT(first_name, ' ', last_name), name) 
WHERE name = '';

-- 7. Update handle_new_user trigger function to populate full_name as well
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  chosen_role TEXT;
  profile_name TEXT;
  full_name_val TEXT;
BEGIN
  chosen_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  profile_name := split_part(new.email, '@', 1);
  full_name_val := coalesce(new.raw_user_meta_data->>'full_name', profile_name);

  -- Insert into public.users
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, chosen_role)
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    role = EXCLUDED.role;
    
  -- Initialize empty corresponding sub-profile based on role
  IF chosen_role = 'student' THEN
    INSERT INTO public.student_profiles (user_id, name, full_name)
    VALUES (new.id, profile_name, full_name_val)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF chosen_role = 'college' THEN
    INSERT INTO public.college_profiles (user_id, name)
    VALUES (new.id, profile_name)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF chosen_role = 'trainer' THEN
    INSERT INTO public.trainer_profiles (user_id, name, full_name)
    VALUES (new.id, profile_name, full_name_val)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

-- 8. Drop NOT NULL constraint from legacy column to support new joins
ALTER TABLE public.classroom_students ALTER COLUMN student_user_id DROP NOT NULL;
