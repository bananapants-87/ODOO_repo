import { cn } from "@/lib/utils";

type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
  info: "bg-info/15 text-info border-info/30",
  neutral: "bg-muted text-muted-foreground border-border",
};

const statusToVariant: Record<string, StatusVariant> = {
  Available: "success", "On Duty": "success", Completed: "success",
  "On Trip": "info", Dispatched: "info", "In Progress": "info",
  "In Shop": "warning", Scheduled: "warning", Draft: "warning", "Off Duty": "neutral",
  Retired: "neutral", Cancelled: "neutral",
  Suspended: "danger",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ status, className, dot = true }: StatusBadgeProps) {
  const variant = statusToVariant[status] ?? "neutral";
  return (
    <span className={cn("status-pill border", variantStyles[variant], className)}>
      {dot && (
        <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", {
          "bg-success": variant === "success",
          "bg-warning": variant === "warning",
          "bg-destructive": variant === "danger",
          "bg-info": variant === "info",
          "bg-muted-foreground": variant === "neutral",
        })} />
      )}
      {status}
    </span>
  );
}
