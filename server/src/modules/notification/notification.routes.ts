import { Router } from "express";
import type { Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth.js";

const router = Router();

/**
 * GET /api/notifications
 * Fetch notifications for the authenticated user.
 */
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { supabaseAdmin } = await import("../../lib/supabase.js");
    const userId = req.user!.id;

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data });
  } catch (err: any) {
    console.error("[GET /notifications] Unhandled error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read.
 */
router.patch("/:id/read", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { supabaseAdmin } = await import("../../lib/supabase.js");
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", req.user!.id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ message: "Notification marked as read" });
  } catch (err: any) {
    console.error("[PATCH /notifications/:id/read] Unhandled error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
