-- =====================================================================
-- 🛠️ PROSCULPT.AI — SCHEMA INTEGRATION & UPGRADE SCRIPT
-- Copy this entire script and run it in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/gnhhnxklvjmetjgeqxcl/sql/new
-- =====================================================================

-- 1. UPGRADE 'classrooms' TABLE
ALTER TABLE public.classrooms 
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS course TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS batch TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS semester TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{"recording_enabled": true, "allow_student_chat": true, "allow_screen_share": true, "visibility": "private"}'::jsonb,
  ADD COLUMN IF NOT EXISTS schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE;

-- Populate 'name' from 'title' if it was null
UPDATE public.classrooms 
  SET name = title 
  WHERE name IS NULL AND title IS NOT NULL;

-- Make sure name is NOT NULL now that it is populated
ALTER TABLE public.classrooms ALTER COLUMN name SET NOT NULL;

-- Drop NOT NULL constraints from legacy columns to allow classroom creation payload to omit them
ALTER TABLE public.classrooms ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.classrooms ALTER COLUMN livekit_room_name DROP NOT NULL;
ALTER TABLE public.classrooms ALTER COLUMN scheduled_start DROP NOT NULL;
ALTER TABLE public.classrooms ALTER COLUMN duration_minutes DROP NOT NULL;

-- Drop legacy status check constraint and create upgraded constraint supporting our new statuses
ALTER TABLE public.classrooms DROP CONSTRAINT IF EXISTS classrooms_status_check;
ALTER TABLE public.classrooms ADD CONSTRAINT classrooms_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'disabled', 'scheduled', 'live', 'ended'));

-- Drop legacy dropdown check constraints if they exist
ALTER TABLE public.classrooms DROP CONSTRAINT IF EXISTS classrooms_department_check;
ALTER TABLE public.classrooms DROP CONSTRAINT IF EXISTS classrooms_batch_check;
ALTER TABLE public.classrooms DROP CONSTRAINT IF EXISTS classrooms_semester_check;

-- Update any invalid/non-conforming legacy values to prevent check constraint violations
UPDATE public.classrooms 
  SET department = 'Computer Science & Engineering' 
  WHERE department NOT IN (
    'Computer Science & Engineering', 'Information Technology', 'Electronics & Communication Engineering', 
    'Electrical & Electronics Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Data Science', 
    'Artificial Intelligence & Machine Learning', 'CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'DS', 'AI-ML', 'Computer Science'
  ) OR department IS NULL;

UPDATE public.classrooms 
  SET batch = '2025' 
  WHERE batch NOT IN ('2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030') 
  OR batch IS NULL;

UPDATE public.classrooms 
  SET semester = '1' 
  WHERE semester NOT IN ('1', '2', '3', '4', '5', '6', '7', '8', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII') 
  OR semester IS NULL;

-- Add check constraints enforcing UI dropdown selections at database-level (including common legacy abbreviations/formats)
ALTER TABLE public.classrooms ADD CONSTRAINT classrooms_department_check 
  CHECK (department IN (
    'Computer Science & Engineering', 'Information Technology', 'Electronics & Communication Engineering', 
    'Electrical & Electronics Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Data Science', 
    'Artificial Intelligence & Machine Learning', 'CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'DS', 'AI-ML', 'Computer Science'
  ));

ALTER TABLE public.classrooms ADD CONSTRAINT classrooms_batch_check 
  CHECK (batch IN ('2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'));

ALTER TABLE public.classrooms ADD CONSTRAINT classrooms_semester_check 
  CHECK (semester IN ('1', '2', '3', '4', '5', '6', '7', '8', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'));

-- Drop legacy foreign key constraints pointing to separate tables and recreate them referencing public.users(id)
ALTER TABLE public.classrooms DROP CONSTRAINT IF EXISTS classrooms_college_id_fkey;
ALTER TABLE public.classrooms ADD CONSTRAINT classrooms_college_id_fkey 
  FOREIGN KEY (college_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.classrooms DROP CONSTRAINT IF EXISTS classrooms_trainer_id_fkey;
ALTER TABLE public.classrooms ADD CONSTRAINT classrooms_trainer_id_fkey 
  FOREIGN KEY (trainer_id) REFERENCES public.users(id) ON DELETE SET NULL;


-- 2. UPGRADE 'classroom_students' TABLE
ALTER TABLE public.classroom_students 
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed', 'left')),
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Populate 'student_id' from 'student_user_id' if it was null
UPDATE public.classroom_students 
  SET student_id = student_user_id 
  WHERE student_id IS NULL AND student_user_id IS NOT NULL;

-- Drop NOT NULL constraint from legacy column to support new joins
ALTER TABLE public.classroom_students ALTER COLUMN student_user_id DROP NOT NULL;


-- 3. UPGRADE 'notifications' TABLE
ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT false;

-- Sync fields if they existed under legacy names
UPDATE public.notifications 
  SET message = body 
  WHERE message = '' AND body IS NOT NULL;

UPDATE public.notifications 
  SET read = is_read 
  WHERE read IS FALSE AND is_read IS NOT NULL;


-- 4. CREATE MISSING 'college_profiles' TABLE
CREATE TABLE IF NOT EXISTS public.college_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  departments TEXT[] NOT NULL DEFAULT '{}',
  batches TEXT[] NOT NULL DEFAULT '{}',
  semesters TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Upgrade existing college_profiles table in case it was created without arrays
ALTER TABLE public.college_profiles
  ADD COLUMN IF NOT EXISTS departments TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS batches TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS semesters TEXT[] NOT NULL DEFAULT '{}';

-- Pre-populate empty/unconfigured college profiles with standard default lists
UPDATE public.college_profiles
  SET 
    departments = '{"Computer Science & Engineering", "Information Technology", "Electronics & Communication Engineering"}'::text[],
    batches = '{"2024", "2025", "2026", "2027", "2028", "2029"}'::text[],
    semesters = '{"1", "2", "3", "4", "5", "6", "7", "8"}'::text[]
  WHERE departments = '{}'::text[] OR departments IS NULL;


-- 5. CREATE MISSING 'class_sessions' TABLE
CREATE TABLE IF NOT EXISTS public.class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  livekit_room_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist if the table was created without them in a previous run
ALTER TABLE public.class_sessions
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;


-- 6. CREATE MISSING 'attendance' TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  present BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);


-- 7. CREATE MISSING 'recordings' TABLE
CREATE TABLE IF NOT EXISTS public.recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  egress_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  recording_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 8. CREATE MISSING 'files' TABLE
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 8.5. SCHEMA ALTERS FOR PROFILE NAMES
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.trainer_profiles ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';

UPDATE public.student_profiles 
SET name = COALESCE(full_name, CONCAT(first_name, ' ', last_name), name) 
WHERE name = '';

-- 9. USER SIGNUP & REGISTRATION TRIGGER (RLS BYPASS FOR CLIENT SIGNUP)
-- Automatically synchronizes Supabase auth.users to public.users and creates sub-profiles
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


-- 10. RE-ENABLE RLS AND CREATE GENERIC ACCESS POLICIES
ALTER TABLE public.college_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- college_profiles policies
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.college_profiles;
CREATE POLICY "Enable read for authenticated users" ON public.college_profiles 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable update for own college profile" ON public.college_profiles;
CREATE POLICY "Enable update for own college profile" ON public.college_profiles 
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- student_profiles policies (allow colleges/trainers to query students for counts/lists)
DROP POLICY IF EXISTS "Enable read access for all authenticated users on student_profiles" ON public.student_profiles;
CREATE POLICY "Enable read access for all authenticated users on student_profiles" 
  ON public.student_profiles 
  FOR SELECT TO authenticated USING (true);

-- class_sessions policies
DROP POLICY IF EXISTS "Enable read for class_sessions" ON public.class_sessions;
CREATE POLICY "Enable read for class_sessions" ON public.class_sessions 
  FOR SELECT TO authenticated USING (true);

-- attendance policies
DROP POLICY IF EXISTS "Enable read for attendance" ON public.attendance;
CREATE POLICY "Enable read for attendance" ON public.attendance 
  FOR SELECT TO authenticated USING (true);

-- recordings policies
DROP POLICY IF EXISTS "Enable read for recordings" ON public.recordings;
CREATE POLICY "Enable read for recordings" ON public.recordings 
  FOR SELECT TO authenticated USING (true);

-- files policies
DROP POLICY IF EXISTS "Enable read for files" ON public.files;
CREATE POLICY "Enable read for files" ON public.files 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for files" ON public.files;
CREATE POLICY "Enable insert for files" ON public.files 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploader_id);


-- 11. TRIGGER POSTGREST TO RELOAD SCHEMA CACHE IMMEDIATELY
NOTIFY pgrst, 'reload schema';
