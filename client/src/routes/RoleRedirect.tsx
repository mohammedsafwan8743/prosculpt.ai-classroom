import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types";

/**
 * Maps each role to its home dashboard path.
 */
const ROLE_DASHBOARDS: Record<UserRole, string> = {
  student: "/student",
  college: "/college",
  trainer: "/trainer",
  admin: "/admin",
};

/**
 * After login, redirect the user to their role-specific dashboard.
 * If role detection fails, redirect to login.
 */
export function RoleRedirect() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={ROLE_DASHBOARDS[role]} replace />;
}
