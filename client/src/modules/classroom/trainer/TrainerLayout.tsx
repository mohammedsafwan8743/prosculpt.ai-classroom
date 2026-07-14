import {
  LayoutDashboard,
  User,
  Settings,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { SidebarItem } from "@/components/layout/AppSidebar";

/** Trainer sidebar navigation items */
const TRAINER_NAV: SidebarItem[] = [
  { label: "Dashboard", href: "/trainer/dashboard", icon: LayoutDashboard },
  { label: "Profile", href: "/trainer/profile", icon: User },
  { label: "Settings", href: "/trainer/settings", icon: Settings },
];

/**
 * Trainer portal layout — wraps all trainer routes with the sidebar and navbar.
 */
export default function TrainerLayout() {
  return <DashboardLayout sidebarItems={TRAINER_NAV} />;
}
