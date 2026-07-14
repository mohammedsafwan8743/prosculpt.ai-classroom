/* =============================================
   SHARED TYPES — Classroom Management System
   ============================================= */

/** User roles in the system */
export type UserRole = "student" | "college" | "trainer" | "admin";

/** Base user from Supabase auth + users table */
export interface User {
  id: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Classroom status through the approval workflow */
export type ClassroomStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "completed"
  | "disabled";

/** Session status */
export type SessionStatus = "scheduled" | "live" | "ended";

/** Student enrollment status */
export type EnrollmentStatus = "active" | "removed" | "left";

/** Recording status */
export type RecordingStatus = "processing" | "ready" | "failed";

/** Notification types */
export type NotificationType =
  | "class_approved"
  | "class_rejected"
  | "trainer_assigned"
  | "class_started"
  | "class_ended"
  | "recording_ready"
  | "attendance_published"
  | "student_joined"
  | "general";

/* ── Profile Types ── */

export interface StudentProfile {
  id: string;
  user_id: string;
  name: string;
  college: string;
  department: string;
  batch: string;
  semester: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollegeProfile {
  id: string;
  user_id: string;
  name: string;
  code: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainerProfile {
  id: string;
  user_id: string;
  name: string;
  specialization: string;
  bio: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

/* ── Classroom ── */

export interface ClassroomSchedule {
  day: string;
  start_time: string;
  end_time: string;
}

export interface ClassroomSettings {
  recording_enabled: boolean;
  allow_student_chat: boolean;
  allow_screen_share: boolean;
  visibility: "public" | "private";
}

export interface Classroom {
  id: string;
  name: string;
  department: string;
  course: string;
  batch: string;
  semester: string;
  description: string;
  max_students: number;
  status: ClassroomStatus;
  college_id: string;
  trainer_id: string | null;
  invite_code: string | null;
  settings: ClassroomSettings;
  schedule: ClassroomSchedule[];
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  class_sessions?: ClassSession[];
}

/* ── Sessions ── */

export interface ClassSession {
  id: string;
  classroom_id: string;
  status: SessionStatus;
  started_at: string | null;
  ended_at: string | null;
  recording_url: string | null;
  livekit_room_name: string | null;
  created_at: string;
}

/* ── Attendance ── */

export interface Attendance {
  id: string;
  session_id: string;
  student_id: string;
  joined_at: string;
  left_at: string | null;
  duration_minutes: number;
  created_at: string;
}

/* ── Recording ── */

export interface Recording {
  id: string;
  session_id: string;
  classroom_id: string;
  url: string;
  duration_seconds: number;
  size_bytes: number;
  status: RecordingStatus;
  created_at: string;
}

/* ── Notification ── */

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
}

/* ── File / Material ── */

export interface FileUpload {
  id: string;
  classroom_id: string;
  uploaded_by: string;
  name: string;
  url: string;
  type: string;
  size_bytes: number;
  created_at: string;
}

/* ── API Response Wrappers ── */

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/* ── Navigation ── */

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
}
