import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
      "Authentication and data fetching will not work until these are configured in .env"
  );
}

/**
 * Supabase client singleton for the browser.
 * Reads credentials from VITE_ environment variables.
 */
export const supabase = createClient(
  supabaseUrl ?? "",
  supabaseAnonKey ?? ""
);
