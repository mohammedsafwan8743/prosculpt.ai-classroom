import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  User,
  Settings,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { SidebarItem } from "@/components/layout/AppSidebar";

/** College sidebar navigation items */
const COLLEGE_NAV: SidebarItem[] = [
  { label: "Dashboard", href: "/college/dashboard", icon: LayoutDashboard },
  { label: "Classrooms", href: "/college/classrooms", icon: BookOpen },
  { label: "Request Class", href: "/college/classrooms/new", icon: PlusCircle },
  { label: "Profile", href: "/college/profile", icon: User },
  { label: "Settings", href: "/college/settings", icon: Settings },
];

/**
 * College portal layout — wraps all college routes with the sidebar and navbar.
 */
export default function CollegeLayout() {
  return <DashboardLayout sidebarItems={COLLEGE_NAV} />;
}
