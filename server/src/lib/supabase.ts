import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

/**
 * Supabase admin client with service role key.
 * Has full database access — used only server-side.
 */
export const supabaseAdmin = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Supabase client with anon key — used for user-scoped operations.
 */
export const supabaseAnon = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
);
