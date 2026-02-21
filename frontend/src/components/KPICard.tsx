import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "primary" | "accent";
  className?: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, variant = "default", className }: KPICardProps) {
  return (
    <div className={cn(
      "kpi-card rounded-lg border border-border p-5 animate-fade-in",
      variant === "primary" && "border-primary/20 animate-pulse-glow",
      variant === "accent" && "border-accent/20",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className={cn(
            "text-2xl font-bold tracking-tight",
            variant === "primary" && "text-gradient-primary",
            variant === "accent" && "text-accent",
          )}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          variant === "primary" ? "bg-primary/10 text-primary" :
          variant === "accent" ? "bg-accent/10 text-accent" :
          "bg-muted text-muted-foreground"
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={cn("font-semibold", trend.value >= 0 ? "text-success" : "text-destructive")}>
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
