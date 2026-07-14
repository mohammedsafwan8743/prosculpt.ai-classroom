import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

type Role = "student" | "college" | "trainer" | "admin";

/**
 * Role-based access control middleware factory.
 * Checks the user's role from the `users` table against the allowed roles.
 *
 * Usage: `router.get("/admin-only", authMiddleware, rbac("admin"), handler)`
 */
export function rbac(...allowedRoles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !data) {
      res.status(403).json({ error: "User profile not found" });
      return;
    }

    if (!allowedRoles.includes(data.role as Role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    // Attach role to request
    (req as any).user.role = data.role;

    next();
  };
}
