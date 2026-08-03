import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string | undefined;
  icon?: LucideIcon;
  tone?: "default" | "accent" | "warning" | "destructive";
}

const toneMap = {
  default: "text-foreground",
  accent: "text-accent",
  warning: "text-warning",
  destructive: "text-destructive",
} as const;

export function StatCard({ label, value, hint, icon: Icon, tone = "default" }: StatCardProps) {
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        {Icon ? <Icon className={`size-4 ${toneMap[tone]}`} /> : null}
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${toneMap[tone]}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
