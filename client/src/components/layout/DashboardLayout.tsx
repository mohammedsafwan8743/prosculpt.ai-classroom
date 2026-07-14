import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar, type SidebarItem } from "./AppSidebar";
import { Navbar } from "./Navbar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  sidebarItems: SidebarItem[];
}

/**
 * Main dashboard layout shell.
 * Provides the sidebar + navbar chrome around child routes via <Outlet />.
 */
export function DashboardLayout({ sidebarItems }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <AppSidebar
        items={sidebarItems}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />

      {/* Main content area */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          collapsed
            ? "ml-[var(--sidebar-collapsed-width)]"
            : "ml-[var(--sidebar-width)]"
        )}
      >
        {/* Top navbar */}
        <Navbar />

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
