import { createClient } from "@supabase/supabase-js";
import { env } from "./config/env";

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: npx tsx src/add_trainer.ts <email> <password>");
    process.exit(1);
  }

  console.log(`Creating trainer account: ${email}...`);

  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "trainer"
    }
  });

  if (error) {
    console.error("Error creating trainer user:", error.message);
    process.exit(1);
  }

  console.log("Trainer user created successfully in auth.users!");
  console.log("User ID:", data.user?.id);
  console.log("Email:", data.user?.email);

  // Check if public.users row has been created by the trigger
  const { data: publicUser, error: publicUserError } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user?.id)
    .single();

  if (publicUserError) {
    console.warn("Could not fetch user from public.users table (trigger might have failed or delayed):", publicUserError.message);
  } else {
    console.log("Trigger successfully synchronized user to public.users table!");
    console.log("Public User Record:", publicUser);
  }

  // Check if trainer_profiles row has been created by the trigger
  const { data: trainerProfile, error: trainerProfileError } = await supabase
    .from("trainer_profiles")
    .select("*")
    .eq("user_id", data.user?.id)
    .single();

  if (trainerProfileError) {
    console.warn("Could not fetch trainer profile from trainer_profiles table (trigger might have failed or delayed):", trainerProfileError.message);
  } else {
    console.log("Trigger successfully created trainer profile!");
    console.log("Trainer Profile Record:", trainerProfile);
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
