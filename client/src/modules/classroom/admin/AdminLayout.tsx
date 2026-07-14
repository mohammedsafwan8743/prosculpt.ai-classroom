import {
  LayoutDashboard,
  BookOpen,
  User,
  Settings,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { SidebarItem } from "@/components/layout/AppSidebar";

/** Admin sidebar navigation items */
const ADMIN_NAV: SidebarItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Classrooms", href: "/admin/classrooms", icon: BookOpen },
  { label: "Profile", href: "/admin/profile", icon: User },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

/**
 * Admin portal layout — wraps all admin routes with the sidebar and navbar.
 */
export default function AdminLayout() {
  return <DashboardLayout sidebarItems={ADMIN_NAV} />;
}
