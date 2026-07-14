import { PageHeader } from "@/components/ui/PageHeader";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Monitor, Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

/**
 * Admin Settings page — theme preferences and notification settings.
 */
export default function AdminSettings() {
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Settings"
        description="Manage your administrator account preferences."
      />

      <div className="mx-auto max-w-2xl space-y-6">
        {/* ── Theme ── */}
        <div className="ps-card p-6">
          <h3 className="mb-4 font-display text-base font-semibold text-foreground">
            Appearance
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Choose your preferred color theme.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                  theme === option.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                <option.icon className="h-6 w-6" />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Notifications ── */}
        <div className="ps-card p-6">
          <h3 className="mb-4 font-display text-base font-semibold text-foreground">
            Notifications
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {notificationsEnabled ? (
                <Bell className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  In-app Notifications
                </p>
                <p className="text-xs text-muted-foreground">
                  Receive alerts for security logs, new coordinator registrations, and system updates.
                </p>
              </div>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                notificationsEnabled ? "bg-primary" : "bg-muted-foreground/30"
              )}
            >
              <span
                className={cn(
                  "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                  notificationsEnabled && "translate-x-5"
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
