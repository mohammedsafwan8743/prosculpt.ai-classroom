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

const TARGET_USER_ID = "22b8b387-5f79-4ef3-95ca-cb3f2e13aa80";

async function check() {
  try {
    // 1. Check user role
    const { data: user, error: uError } = await supabase
      .from("users")
      .select("*")
      .eq("id", TARGET_USER_ID)
      .maybeSingle();

    if (uError) {
      console.error("User query failed:", uError.message);
    } else {
      console.log("User entry:", user);
    }

    // 2. Check college profile
    const { data: profile, error: pError } = await supabase
      .from("college_profiles")
      .select("*")
      .eq("user_id", TARGET_USER_ID)
      .maybeSingle();

    if (pError) {
      console.error("College profile query failed:", pError.message);
    } else {
      console.log("College profile entry:", profile);
    }

    // 3. Check classrooms
    const { data: classrooms, error: cError } = await supabase
      .from("classrooms")
      .select("*")
      .eq("college_id", TARGET_USER_ID);

    if (cError) {
      console.error("Classrooms query failed:", cError.message);
    } else {
      console.log(`Classrooms count for user:`, classrooms?.length, classrooms);
    }
  } catch (err: any) {
    console.error("Unexpected error:", err.message);
  }
}

check();
