import { Router } from "express";
import type { Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth.js";

const router = Router();

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile.
 */
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { supabaseAdmin } = await import("../../lib/supabase.js");

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", req.user!.id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }

    res.json({ data });
  } catch (err: any) {
    console.error("[GET /auth/me] Unhandled error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * GET /api/auth/trainers
 * Returns a list of all trainer profiles in the system.
 */
router.get("/trainers", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { supabaseAdmin } = await import("../../lib/supabase.js");

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("role", "trainer");

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data });
  } catch (err: any) {
    console.error("[GET /auth/trainers] Unhandled error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
