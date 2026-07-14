import { cn } from "@/lib/utils";

type StatusVariant =
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "completed"
  | "disabled"
  | "live"
  | "scheduled"
  | "ended"
  | "processing"
  | "ready"
  | "failed";

const VARIANT_STYLES: Record<StatusVariant, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-error/10 text-error border-error/20",
  active: "bg-success/10 text-success border-success/20",
  completed: "bg-info/10 text-info border-info/20",
  disabled: "bg-muted text-muted-foreground border-muted-foreground/20",
  live: "bg-error/10 text-error border-error/20",
  scheduled: "bg-info/10 text-info border-info/20",
  ended: "bg-muted text-muted-foreground border-muted-foreground/20",
  processing: "bg-warning/10 text-warning border-warning/20",
  ready: "bg-success/10 text-success border-success/20",
  failed: "bg-error/10 text-error border-error/20",
};

interface StatusChipProps {
  status: StatusVariant;
  /** Override the display text. Defaults to capitalized status name. */
  label?: string;
  /** Show a pulsing dot (used for "live" status). */
  showDot?: boolean;
  className?: string;
}

/**
 * Configurable status badge chip with color-coded variants.
 */
export function StatusChip({
  status,
  label,
  showDot,
  className,
}: StatusChipProps) {
  const displayLabel =
    label ?? status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold font-display",
        VARIANT_STYLES[status],
        className
      )}
    >
      {(showDot || status === "live") && <span className="live-dot" />}
      {displayLabel}
    </span>
  );
}
