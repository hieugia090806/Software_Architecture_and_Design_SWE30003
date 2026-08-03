import { AlertTriangle, Bell, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db, useDb } from "@/services/db";
import { timeAgo } from "@/lib/format";
import type { FleetAlert } from "@/services/types";

const severityStyles: Record<FleetAlert["severity"], string> = {
  critical: "border-destructive/50 text-destructive",
  warning: "border-warning/50 text-warning",
  info: "border-border text-muted-foreground",
};

type Filter = "all" | FleetAlert["severity"] | "unacked";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unacked", label: "Unreviewed" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
];

export function AlertStream({ compact = false }: { compact?: boolean }) {
  const alerts = useDb((s) => s.alerts);
  const vehicles = useDb((s) => s.vehicles);
  const [filter, setFilter] = useState<Filter>("all");

  const visible = alerts.filter((a) =>
    filter === "all" ? true : filter === "unacked" ? !a.acknowledged : a.severity === filter,
  );

  return (
    <div className="panel flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Bell className="size-4 text-accent" />
        <h3 className="flex-1 text-sm font-semibold">Live Alert Stream</h3>
        <Badge variant="outline" className="border-destructive/40 text-destructive">
          {alerts.filter((a) => !a.acknowledged).length} open
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-border px-4 py-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-md px-2.5 py-1 text-[11px] transition-colors ${
              filter === f.value
                ? "bg-secondary font-semibold text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={`flex-1 space-y-2 overflow-y-auto p-3 ${compact ? "max-h-80" : "max-h-[26rem]"}`}>
        {visible.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-muted-foreground">
            No alerts match this filter.
          </p>
        ) : null}
        {visible.map((a) => {
          const vehicle = vehicles.find((v) => v.id === a.vehicle_id);
          return (
            <div
              key={a.id}
              className={`rounded-lg border bg-surface-2/50 p-3 ${severityStyles[a.severity]} ${
                a.acknowledged ? "opacity-55" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">
                    {a.alert_type} · {vehicle?.license_plate ?? "Unknown unit"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{a.description}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(a.created_at)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {!a.acknowledged ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      title="Mark reviewed"
                      onClick={() => {
                        db.acknowledgeAlert(a.id);
                        toast.success(`${a.alert_type} alert reviewed`);
                      }}
                    >
                      <Check className="size-3.5" />
                    </Button>
                  ) : null}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    title="Dismiss"
                    onClick={() => {
                      db.dismissAlert(a.id);
                      toast("Alert dismissed");
                    }}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
