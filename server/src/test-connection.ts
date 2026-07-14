import { createClient } from "@supabase/supabase-js";
import { env } from "./config/env.js";

async function run() {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  const email = `test.signup.debug.${Date.now()}@prosculpt.ai`;
  const password = "Password123!";
  const role = "student";
  
  console.log("Testing signup with email:", email);
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${env.VITE_SUPABASE_URL}`, // redirect to supabase URL for testing
        data: {
          role,
        },
      },
    });
    
    if (error) {
      console.log("Signup returned AuthError:");
      console.log("Message:", error.message);
      console.log("Status:", error.status);
      console.log("Name:", error.name);
      console.log(error);
    } else {
      console.log("Signup succeeded! User data:");
      console.log(data.user);
    }
  } catch (err: any) {
    console.error("Unexpected throw during signup:", err);
  }
}

run();
