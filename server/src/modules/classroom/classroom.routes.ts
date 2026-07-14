import { Router } from "express";
import type { Request, Response } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { rbac } from "../../middleware/rbac.js";
import crypto from "crypto";

const router = Router();

/** Generate a short, human-friendly invite code like PSA-7K9M */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 to avoid confusion
  let code = "";
  const bytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `PSA-${code}`;
}

/**
 * GET /api/classrooms
 * List classrooms accessible to the authenticated user.
 */
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { supabaseAdmin } = await import("../../lib/supabase.js");
    const userId = req.user!.id;

    // Fetch user role to determine query scope
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    let query = supabaseAdmin.from("classrooms").select("*, class_sessions(id, status, livekit_room_name)");

    switch (user.role) {
      case "student":
        // Fetch classrooms the student is enrolled in
        query = supabaseAdmin
          .from("classroom_students")
          .select("classrooms(*, class_sessions(id, status, livekit_room_name))")
          .eq("student_id", userId)
          .eq("status", "active");
        break;
      case "college":
        query = query.eq("college_id", userId);
        break;
      case "trainer":
        query = query.eq("trainer_id", userId);
        break;
      case "admin":
        // Admin sees all classrooms
        break;
      default:
        res.status(403).json({ error: "Unknown role" });
        return;
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Flatten student data: [{classrooms: {...}}] → [{...}]
    let result = data;
    if (user.role === "student" && Array.isArray(data)) {
      result = data
        .map((row: any) => row.classrooms)
        .filter(Boolean);
    }

    res.json({ data: result });
  } catch (err: any) {
    console.error("[GET /classrooms] Unhandled error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * POST /api/classrooms
 * Create a new classroom (College role only).
 */
router.post(
  "/",
  authMiddleware,
  rbac("college"),
  async (req: Request, res: Response) => {
    try {
      const { supabaseAdmin } = await import("../../lib/supabase.js");

      const {
        name,
        department,
        course,
        batch,
        semester,
        description,
        max_students,
        preferred_trainer,
        start_date,
        end_date,
        schedule,
        settings,
      } = req.body;

      const { data, error } = await supabaseAdmin.from("classrooms").insert({
        name,
        title: name, // legacy NOT NULL constraint support
        department,
        course,
        batch,
        semester,
        description,
        max_students,
        preferred_trainer,
        start_date,
        end_date,
        schedule,
        settings,
        college_id: req.user!.id,
        status: "pending",
      }).select().single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(201).json({ data });
    } catch (err: any) {
      console.error("[POST /classrooms] Unhandled error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }
);

/**
 * PATCH /api/classrooms/:id/approve
 * Approve a pending classroom (Admin only).
 */
router.patch(
  "/:id/approve",
  authMiddleware,
  rbac("admin"),
  async (req: Request, res: Response) => {
    try {
      const { supabaseAdmin } = await import("../../lib/supabase.js");
      const { id } = req.params;
      const { trainer_id } = req.body;

      // Generate a unique invite code for students to join
      const inviteCode = generateInviteCode();

      const { data, error } = await supabaseAdmin
        .from("classrooms")
        .update({
          status: "active",
          trainer_id: trainer_id ?? null,
          invite_code: inviteCode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("status", "pending")
        .select()
        .single();

      if (error) {
        // If invite code collision, retry once with a new code
        if (error.message?.includes("unique") || error.code === "23505") {
          const retryCode = generateInviteCode();
          const { data: retryData, error: retryError } = await supabaseAdmin
            .from("classrooms")
            .update({
              status: "active",
              trainer_id: trainer_id ?? null,
              invite_code: retryCode,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("status", "pending")
            .select()
            .single();

          if (retryError) {
            res.status(500).json({ error: retryError.message });
            return;
          }
          res.json({ data: retryData, message: "Classroom approved", invite_code: retryCode });
          return;
        }
        res.status(500).json({ error: error.message });
        return;
      }

      if (!data) {
        res.status(404).json({ error: "Classroom not found or not pending" });
        return;
      }

      res.json({ data, message: "Classroom approved", invite_code: inviteCode });
    } catch (err: any) {
      console.error("[PATCH /classrooms/:id/approve] Unhandled error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }
);

/**
 * PATCH /api/classrooms/:id/reject
 * Reject a pending classroom (Admin only).
 */
router.patch(
  "/:id/reject",
  authMiddleware,
  rbac("admin"),
  async (req: Request, res: Response) => {
    try {
      const { supabaseAdmin } = await import("../../lib/supabase.js");
      const { id } = req.params;

      const { data, error } = await supabaseAdmin
        .from("classrooms")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("status", "pending")
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ data, message: "Classroom rejected" });
    } catch (err: any) {
      console.error("[PATCH /classrooms/:id/reject] Unhandled error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }
);

/**
 * POST /api/classrooms/join-by-code
 * Student joins a classroom via invite code (e.g., PSA-7K9M).
 */
router.post(
  "/join-by-code",
  authMiddleware,
  rbac("student"),
  async (req: Request, res: Response) => {
    try {
      const { supabaseAdmin } = await import("../../lib/supabase.js");
      const { code } = req.body;
      const studentId = req.user!.id;

      if (!code || typeof code !== "string") {
        res.status(400).json({ error: "Invite code is required" });
        return;
      }

      // Find classroom by invite code
      const { data: classroom, error: findError } = await supabaseAdmin
        .from("classrooms")
        .select("*")
        .eq("invite_code", code.trim().toUpperCase())
        .single();

      if (findError || !classroom) {
        res.status(404).json({ error: "Invalid invite code. No classroom found with this code." });
        return;
      }

      if (classroom.status !== "active") {
        res.status(400).json({ error: "This classroom is not currently active. Contact your college." });
        return;
      }

      // Check if already enrolled
      const { data: existing } = await supabaseAdmin
        .from("classroom_students")
        .select("id")
        .eq("classroom_id", classroom.id)
        .eq("student_id", studentId)
        .maybeSingle();

      if (existing) {
        res.status(409).json({ error: "You are already enrolled in this classroom." });
        return;
      }

      // Check capacity
      const { count } = await supabaseAdmin
        .from("classroom_students")
        .select("id", { count: "exact", head: true })
        .eq("classroom_id", classroom.id)
        .eq("status", "active");

      if (count !== null && count >= classroom.max_students) {
        res.status(400).json({ error: "This classroom is full. Maximum student capacity reached." });
        return;
      }

      // Enroll the student
      const { data, error } = await supabaseAdmin
        .from("classroom_students")
        .insert({
          classroom_id: classroom.id,
          student_id: studentId,
          status: "active",
        })
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(201).json({
        data,
        classroom: { id: classroom.id, name: classroom.name, course: classroom.course },
        message: "Joined classroom successfully",
      });
    } catch (err: any) {
      console.error("[POST /classrooms/join-by-code] Unhandled error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }
);

/**
 * POST /api/classrooms/:id/join
 * Student joins a classroom by ID (legacy route).
 */
router.post(
  "/:id/join",
  authMiddleware,
  rbac("student"),
  async (req: Request, res: Response) => {
    try {
      const { supabaseAdmin } = await import("../../lib/supabase.js");
      const { id } = req.params;
      const studentId = req.user!.id;

      // Check if already enrolled
      const { data: existing } = await supabaseAdmin
        .from("classroom_students")
        .select("id")
        .eq("classroom_id", id)
        .eq("student_id", studentId)
        .maybeSingle();

      if (existing) {
        res.status(409).json({ error: "Already enrolled in this classroom" });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("classroom_students")
        .insert({
          classroom_id: id,
          student_id: studentId,
          status: "active",
        })
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(201).json({ data, message: "Joined classroom successfully" });
    } catch (err: any) {
      console.error("[POST /classrooms/:id/join] Unhandled error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }
);

/**
 * GET /api/classrooms/:id
 * Get details of a single classroom.
 */
router.get(
  "/:id",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { supabaseAdmin } = await import("../../lib/supabase.js");
      const { id } = req.params;
      const userId = req.user!.id;

      // Fetch user role
      const { data: user } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const { data: classroom, error } = await supabaseAdmin
        .from("classrooms")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !classroom) {
        res.status(404).json({ error: "Classroom not found" });
        return;
      }

      // Role-based authorization check
      let authorized = false;
      if (user.role === "admin") {
        authorized = true;
      } else if (user.role === "college" && classroom.college_id === userId) {
        authorized = true;
      } else if (user.role === "trainer" && classroom.trainer_id === userId) {
        authorized = true;
      } else if (user.role === "student") {
        // Check if enrolled
        const { data: enrollment } = await supabaseAdmin
          .from("classroom_students")
          .select("id")
          .eq("classroom_id", id)
          .eq("student_id", userId)
          .eq("status", "active")
          .maybeSingle();

        if (enrollment) authorized = true;
      }

      if (!authorized) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      res.json({ data: classroom });
    } catch (err: any) {
      console.error("[GET /classrooms/:id] Unhandled error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }
);

/**
 * GET /api/classrooms/:id/active-session
 * Fetch the active class session (if any) for a classroom.
 */
router.get(
  "/:id/active-session",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { supabaseAdmin } = await import("../../lib/supabase.js");
      const { id } = req.params;

      const { data: session, error } = await supabaseAdmin
        .from("class_sessions")
        .select("*")
        .eq("classroom_id", id)
        .eq("status", "live")
        .maybeSingle();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ data: session });
    } catch (err: any) {
      console.error("[GET /classrooms/:id/active-session] Unhandled error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }
);

/**
 * POST /api/classrooms/:id/sessions
 * Start a new class session (Trainer or College).
 */
router.post(
  "/:id/sessions",
  authMiddleware,
  rbac("trainer", "college"),
  async (req: Request, res: Response) => {
    try {
      const { supabaseAdmin } = await import("../../lib/supabase.js");
      const { id } = req.params;
      const userId = req.user!.id;

      // 1. Verify classroom exists
      const { data: classroom, error: clError } = await supabaseAdmin
        .from("classrooms")
        .select("*")
        .eq("id", id)
        .single();

      if (clError || !classroom) {
        res.status(404).json({ error: "Classroom not found" });
        return;
      }

      const isTrainer = req.user!.role === "trainer";
      const isCollege = req.user!.role === "college";

      if (isTrainer && classroom.trainer_id !== userId) {
        res.status(403).json({ error: "You are not the assigned trainer for this classroom" });
        return;
      }

      if (isCollege && classroom.college_id !== userId) {
        res.status(403).json({ error: "You are not authorized to start sessions for this classroom" });
        return;
      }

      // 2. Check if there's already a live session
      const { data: activeSession } = await supabaseAdmin
        .from("class_sessions")
        .select("*")
        .eq("classroom_id", id)
        .eq("status", "live")
        .maybeSingle();

      if (activeSession) {
        res.json({ data: activeSession, message: "Active session already running" });
        return;
      }

      // 3. Create the session
      const roomName = `room-${id}-${Date.now()}`;
      const { data: newSession, error: sError } = await supabaseAdmin
        .from("class_sessions")
        .insert({
          classroom_id: id,
          livekit_room_name: roomName,
          status: "live",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (sError) {
        res.status(500).json({ error: sError.message });
        return;
      }

      res.status(201).json({ data: newSession, message: "Session started successfully" });
    } catch (err: any) {
      console.error("[POST /classrooms/:id/sessions] Unhandled error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }
);

/**
 * POST /api/classrooms/:id/sessions/:sessionId/end
 * End an active class session (Trainer or College).
 */
router.post(
  "/:id/sessions/:sessionId/end",
  authMiddleware,
  rbac("trainer", "college"),
  async (req: Request, res: Response) => {
    try {
      const { supabaseAdmin } = await import("../../lib/supabase.js");
      const { id, sessionId } = req.params;
      const userId = req.user!.id;

      // 1. Verify classroom
      const { data: classroom } = await supabaseAdmin
        .from("classrooms")
        .select("trainer_id, college_id")
        .eq("id", id)
        .single();

      if (!classroom) {
        res.status(404).json({ error: "Classroom not found" });
        return;
      }

      const isTrainer = req.user!.role === "trainer";
      const isCollege = req.user!.role === "college";

      if (isTrainer && classroom.trainer_id !== userId) {
        res.status(403).json({ error: "You are not authorized to manage this classroom" });
        return;
      }

      if (isCollege && classroom.college_id !== userId) {
        res.status(403).json({ error: "You are not authorized to manage this classroom" });
        return;
      }

      // 2. Update the session status to ended
      const { data: updatedSession, error: sError } = await supabaseAdmin
        .from("class_sessions")
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .eq("classroom_id", id)
        .select()
        .single();

      if (sError) {
        res.status(500).json({ error: sError.message });
        return;
      }

      res.json({ data: updatedSession, message: "Session ended successfully" });
    } catch (err: any) {
      console.error("[POST /classrooms/:id/sessions/:sessionId/end] Unhandled error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }
);

/**
 * PATCH /api/classrooms/:id
 * Update a classroom (College or Admin).
 */
router.patch(
  "/:id",
  authMiddleware,
  rbac("college", "admin"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { supabaseAdmin } = await import("../../lib/supabase.js");

      // 1. Fetch current classroom
      const { data: classroom, error: fetchErr } = await supabaseAdmin
        .from("classrooms")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchErr || !classroom) {
        res.status(404).json({ error: "Classroom not found" });
        return;
      }

      // 2. Authorization check
      if (req.user!.role === "college" && classroom.college_id !== req.user!.id) {
        res.status(403).json({ error: "You are not authorized to edit this classroom" });
        return;
      }

      // 3. Prepare update fields
      const updates: any = {};
      const fields = [
        "name",
        "title",
        "department",
        "course",
        "batch",
        "semester",
        "description",
        "max_students",
        "preferred_trainer",
        "start_date",
        "end_date",
        "schedule",
        "settings",
      ];
      
      // If admin, they can also update trainer_id, status, and invite_code
      if (req.user!.role === "admin") {
        fields.push("trainer_id", "status", "invite_code");
      }

      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Maintain title sync
      if (updates.name !== undefined) {
        updates.title = updates.name;
      }

      // 4. Perform update
      const { data: updatedClassroom, error: updateErr } = await supabaseAdmin
        .from("classrooms")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (updateErr) {
        res.status(500).json({ error: updateErr.message });
        return;
      }

      res.json({ data: updatedClassroom, message: "Classroom updated successfully" });
    } catch (err: any) {
      console.error("[PATCH /classrooms/:id] Unhandled error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }
);

/**
 * DELETE /api/classrooms/:id
 * Delete a classroom (College or Admin).
 */
router.delete(
  "/:id",
  authMiddleware,
  rbac("college", "admin"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { supabaseAdmin } = await import("../../lib/supabase.js");

      // 1. Fetch current classroom
      const { data: classroom, error: fetchErr } = await supabaseAdmin
        .from("classrooms")
        .select("college_id")
        .eq("id", id)
        .single();

      if (fetchErr || !classroom) {
        res.status(404).json({ error: "Classroom not found" });
        return;
      }

      // 2. Authorization check
      if (req.user!.role === "college" && classroom.college_id !== req.user!.id) {
        res.status(403).json({ error: "You are not authorized to delete this classroom" });
        return;
      }

      // 3. Delete classroom
      const { error: deleteErr } = await supabaseAdmin
        .from("classrooms")
        .delete()
        .eq("id", id);

      if (deleteErr) {
        res.status(500).json({ error: deleteErr.message });
        return;
      }

      res.json({ message: "Classroom deleted successfully" });
    } catch (err: any) {
      console.error("[DELETE /classrooms/:id] Unhandled error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }
);

export default router;
