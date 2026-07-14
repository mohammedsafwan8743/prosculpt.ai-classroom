import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

/**
 * Dashboard statistics card with icon, value, label, and optional trend indicator.
 */
export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "ps-card flex items-start gap-4 p-5 animate-fade-in",
        className
      )}
    >
      {/* Icon container */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-bold text-foreground">
          {value}
        </p>
        {trend && (
          <div
            className={cn(
              "mt-1 inline-flex items-center gap-1 text-xs font-medium",
              trend.positive ? "text-success" : "text-error"
            )}
          >
            {trend.positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}
          </div>
        )}
      </div>
    </div>
  );
}
