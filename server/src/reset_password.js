import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
  const { data, error } = await supabase.auth.admin.updateUserById(
    "22b8b387-5f79-4ef3-95ca-cb3f2e13aa80",
    { password: "Password123!" }
  );

  if (error) {
    console.error("Password reset failed:", error);
  } else {
    console.log("Password reset successfully for user 22b8b387-5f79-4ef3-95ca-cb3f2e13aa80");
  }
}

reset();
