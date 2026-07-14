import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  /** Allowed roles for this route group. If empty, any authenticated user can access. */
  allowedRoles?: UserRole[];
}

/**
 * Route guard that checks authentication and role-based authorization.
 *
 * - Unauthenticated users → /login
 * - Authenticated but wrong role → /unauthorized
 * - Authenticated + correct role → render child routes
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();

  // Still loading auth state — show nothing (the layout will show a loader)
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-sans">Loading…</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but role not allowed
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
