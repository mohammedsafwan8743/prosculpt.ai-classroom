import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface AppSidebarProps {
  items: SidebarItem[];
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ items, collapsed, onToggle }: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r transition-all duration-300 ease-in-out",
        collapsed ? "w-[var(--sidebar-collapsed-width)]" : "w-[var(--sidebar-width)]"
      )}
      style={{
        backgroundColor: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
      }}
    >
      {/* ── Logo Area ── */}
      <div className="flex h-16 items-center justify-between border-b px-4" style={{ borderColor: "var(--sidebar-border)" }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 animate-fade-in">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-hero-gradient">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-base font-bold text-foreground">
              Prosculpt<span className="text-ai-cyan">.ai</span>
            </span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-hero-gradient">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* ── Navigation Items ── */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 no-scrollbar">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href.endsWith("dashboard")}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-[var(--sidebar-item-active)] text-[var(--sidebar-text-active)] shadow-sm"
                  : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-hover)]"
              )
            }
          >
            <item.icon
              className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                "group-[.active]:text-primary"
              )}
            />
            {!collapsed && (
              <span className="truncate">{item.label}</span>
            )}
            {!collapsed && item.badge !== undefined && (
              <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom Actions ── */}
      <div className="border-t p-3 space-y-1" style={{ borderColor: "var(--sidebar-border)" }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-hover)]",
            collapsed && "justify-center px-0"
          )}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-5 w-5 shrink-0 text-yellow-500" />
          ) : (
            <Moon className="h-5 w-5 shrink-0 text-slate-500" />
          )}
          {!collapsed && (
            <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          )}
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            "text-error/80 hover:bg-error/5 hover:text-error",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* ── User Info ── */}
      {user && (
        <div
          className={cn(
            "border-t p-3",
            collapsed ? "flex justify-center" : "flex items-center gap-3"
          )}
          style={{ borderColor: "var(--sidebar-border)" }}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {user.email?.charAt(0).toUpperCase() ?? "U"}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user.email}
              </p>
              <p className="text-xs capitalize text-muted-foreground">
                {user.role}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Collapse Toggle ── */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border bg-card shadow-sm transition-all hover:bg-muted"
        style={{ borderColor: "var(--sidebar-border)" }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
    </aside>
  );
}
