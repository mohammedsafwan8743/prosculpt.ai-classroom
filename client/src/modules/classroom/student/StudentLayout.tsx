import {
  LayoutDashboard,
  BookOpen,
  UserPlus,
  User,
  Settings,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { SidebarItem } from "@/components/layout/AppSidebar";

/** Student sidebar navigation items */
const STUDENT_NAV: SidebarItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "My Classrooms", href: "/student/classrooms", icon: BookOpen },
  { label: "Join Classroom", href: "/student/join", icon: UserPlus },
  { label: "Profile", href: "/student/profile", icon: User },
  { label: "Settings", href: "/student/settings", icon: Settings },
];

/**
 * Student portal layout — wraps all student routes with the sidebar and navbar.
 */
export default function StudentLayout() {
  return <DashboardLayout sidebarItems={STUDENT_NAV} />;
}
