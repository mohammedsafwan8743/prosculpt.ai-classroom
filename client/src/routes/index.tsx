import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRedirect } from "./RoleRedirect";

/* ── Lazy-loaded pages ── */

// Auth
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const UnauthorizedPage = lazy(() => import("@/pages/auth/UnauthorizedPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

// Student
const StudentLayout = lazy(() => import("@/modules/classroom/student/StudentLayout"));
const StudentDashboard = lazy(() => import("@/modules/classroom/student/StudentDashboard"));
const MyClassrooms = lazy(() => import("@/modules/classroom/student/MyClassrooms"));
const JoinClassroom = lazy(() => import("@/modules/classroom/student/JoinClassroom"));
const ClassroomDetail = lazy(() => import("@/modules/classroom/student/ClassroomDetail"));
const StudentProfile = lazy(() => import("@/modules/classroom/student/StudentProfile"));
const StudentSettings = lazy(() => import("@/modules/classroom/student/StudentSettings"));

// College
const CollegeLayout = lazy(() => import("@/modules/classroom/college/CollegeLayout"));
const CollegeDashboard = lazy(() => import("@/modules/classroom/college/CollegeDashboard"));
const CollegeClassrooms = lazy(() => import("@/modules/classroom/college/CollegeClassrooms"));
const CreateClassroom = lazy(() => import("@/modules/classroom/college/CreateClassroom"));
const CollegeProfile = lazy(() => import("@/modules/classroom/college/CollegeProfile"));
const CollegeSettings = lazy(() => import("@/modules/classroom/college/CollegeSettings"));

// Admin
const AdminLayout = lazy(() => import("@/modules/classroom/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/modules/classroom/admin/AdminDashboard"));
const AdminClassrooms = lazy(() => import("@/modules/classroom/admin/AdminClassrooms"));
const AdminProfile = lazy(() => import("@/modules/classroom/admin/AdminProfile"));
const AdminSettings = lazy(() => import("@/modules/classroom/admin/AdminSettings"));

// Trainer
const TrainerLayout = lazy(() => import("@/modules/classroom/trainer/TrainerLayout"));
const TrainerDashboard = lazy(() => import("@/modules/classroom/trainer/TrainerDashboard"));
const TrainerClassroomDetail = lazy(() => import("@/modules/classroom/trainer/TrainerClassroomDetail"));

// Live Room
const LiveClassroom = lazy(() => import("@/pages/LiveClassroom"));

/* ── Page Loading Fallback ── */
function PageLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground font-sans animate-pulse">
          Loading page…
        </p>
      </div>
    </div>
  );
}

/* ── Router Definition ── */

const router = createBrowserRouter([
  /* ── Public Routes ── */
  {
    path: "/login",
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "/unauthorized",
    element: (
      <Suspense fallback={<PageLoader />}>
        <UnauthorizedPage />
      </Suspense>
    ),
  },

  /* ── Root redirect ── */
  {
    path: "/",
    element: <RoleRedirect />,
  },

  /* ── Student Portal ── */
  {
    element: <ProtectedRoute allowedRoles={["student"]} />,
    children: [
      {
        path: "/student",
        element: (
          <Suspense fallback={<PageLoader />}>
            <StudentLayout />
          </Suspense>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          {
            path: "dashboard",
            element: (
              <Suspense fallback={<PageLoader />}>
                <StudentDashboard />
              </Suspense>
            ),
          },
          {
            path: "classrooms",
            element: (
              <Suspense fallback={<PageLoader />}>
                <MyClassrooms />
              </Suspense>
            ),
          },
          {
            path: "classrooms/:id",
            element: (
              <Suspense fallback={<PageLoader />}>
                <ClassroomDetail />
              </Suspense>
            ),
          },
          {
            path: "join",
            element: (
              <Suspense fallback={<PageLoader />}>
                <JoinClassroom />
              </Suspense>
            ),
          },
          {
            path: "profile",
            element: (
              <Suspense fallback={<PageLoader />}>
                <StudentProfile />
              </Suspense>
            ),
          },
          {
            path: "settings",
            element: (
              <Suspense fallback={<PageLoader />}>
                <StudentSettings />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },

  /* ── College Portal (Phase 3) ── */
  {
    element: <ProtectedRoute allowedRoles={["college"]} />,
    children: [
      {
        path: "/college",
        element: (
          <Suspense fallback={<PageLoader />}>
            <CollegeLayout />
          </Suspense>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          {
            path: "dashboard",
            element: (
              <Suspense fallback={<PageLoader />}>
                <CollegeDashboard />
              </Suspense>
            ),
          },
          {
            path: "classrooms",
            element: (
              <Suspense fallback={<PageLoader />}>
                <CollegeClassrooms />
              </Suspense>
            ),
          },
          {
            path: "classrooms/new",
            element: (
              <Suspense fallback={<PageLoader />}>
                <CreateClassroom />
              </Suspense>
            ),
          },
          {
            path: "profile",
            element: (
              <Suspense fallback={<PageLoader />}>
                <CollegeProfile />
              </Suspense>
            ),
          },
          {
            path: "settings",
            element: (
              <Suspense fallback={<PageLoader />}>
                <CollegeSettings />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },

  /* ── Trainer Portal (Phase 4) ── */
  {
    element: <ProtectedRoute allowedRoles={["trainer"]} />,
    children: [
      {
        path: "/trainer",
        element: (
          <Suspense fallback={<PageLoader />}>
            <TrainerLayout />
          </Suspense>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          {
            path: "dashboard",
            element: (
              <Suspense fallback={<PageLoader />}>
                <TrainerDashboard />
              </Suspense>
            ),
          },
          {
            path: "classrooms/:id",
            element: (
              <Suspense fallback={<PageLoader />}>
                <TrainerClassroomDetail />
              </Suspense>
            ),
          },
          {
            path: "profile",
            element: (
              <div className="flex h-[50vh] items-center justify-center text-muted-foreground text-sm">
                Profile Settings — Coming Soon
              </div>
            ),
          },
          {
            path: "settings",
            element: (
              <div className="flex h-[50vh] items-center justify-center text-muted-foreground text-sm">
                Portal Settings — Coming Soon
              </div>
            ),
          },
        ],
      },
    ],
  },

  /* ── Live Classroom Video Call ── */
  {
    element: <ProtectedRoute allowedRoles={["trainer", "student", "college"]} />,
    children: [
      {
        path: "/live/:classroomId",
        element: (
          <Suspense fallback={<PageLoader />}>
            <LiveClassroom />
          </Suspense>
        ),
      },
    ],
  },

  /* ── Admin Portal (Phase 5) ── */
  {
    element: <ProtectedRoute allowedRoles={["admin"]} />,
    children: [
      {
        path: "/admin",
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminLayout />
          </Suspense>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          {
            path: "dashboard",
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminDashboard />
              </Suspense>
            ),
          },
          {
            path: "classrooms",
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminClassrooms />
              </Suspense>
            ),
          },
          {
            path: "profile",
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminProfile />
              </Suspense>
            ),
          },
          {
            path: "settings",
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminSettings />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },

  /* ── 404 ── */
  {
    path: "*",
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);

/**
 * App router — wraps the entire route tree with lazy-loaded pages.
 * Each role group is protected and will be expanded in subsequent phases.
 */
export function AppRouter() {
  return <RouterProvider router={router} />;
}
