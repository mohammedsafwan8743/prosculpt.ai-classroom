import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Signing in as college...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "staging.college@prosculpt.ai",
    password: "Password123!", // standard password from codebase or test-connection.ts
  });

  if (authError) {
    console.error("Login failed:", authError.message);
    return;
  }

  const token = authData.session.access_token;
  console.log("Logged in successfully! Token obtained.");

  try {
    const res = await axios.get("http://localhost:3001/api/classrooms", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("API response status:", res.status);
    console.log("Data count:", res.data?.data?.length);
  } catch (err) {
    console.error("API call failed!");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

test();
