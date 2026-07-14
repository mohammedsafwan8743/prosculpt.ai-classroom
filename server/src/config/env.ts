import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Only load .env files in local development.
// On Vercel, environment variables are injected automatically via the dashboard.
if (!process.env.VERCEL) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
  dotenv.config({ path: path.resolve(__dirname, "../../../.env.local"), override: true });
}

/**
 * Validated environment configuration.
 * Fails fast at startup if required variables are missing.
 */
const envSchema = z.object({
  PORT: z.string().default("3001"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  // Supabase
  VITE_SUPABASE_URL: z.string().min(1, "VITE_SUPABASE_URL is required"),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, "VITE_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  // LiveKit
  LIVEKIT_API_KEY: z.string().default(""),
  LIVEKIT_API_SECRET: z.string().default(""),
  VITE_LIVEKIT_WS_URL: z.string().default(""),

  // JWT
  JWT_SECRET: z.string().default("dev-secret-change-me"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    console.warn("⚠️  Server will start but some features may not work. Fill in .env variables.");

    // Return defaults for development
    return {
      PORT: process.env.PORT ?? "3001",
      NODE_ENV: (process.env.NODE_ENV ?? "development") as "development" | "production" | "test",
      CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? "",
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY ?? "",
      LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET ?? "",
      VITE_LIVEKIT_WS_URL: process.env.VITE_LIVEKIT_WS_URL ?? "",
      JWT_SECRET: process.env.JWT_SECRET ?? "dev-secret-change-me",
    };
  }

  return parsed.data;
}

export const env = loadEnv();
