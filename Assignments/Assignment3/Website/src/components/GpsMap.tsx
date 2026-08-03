import { useMemo } from "react";
import type { Vehicle } from "@/services/types";
import { num } from "@/lib/format";

const BOUNDS = { minLat: 8.5, maxLat: 23.4, minLng: 102.1, maxLng: 109.6 };

const project = (lat: number, lng: number) => ({
  x: ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100,
  y: (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100,
});

const statusColor: Record<Vehicle["status"], string> = {
  "On Trip": "var(--color-accent)",
  Available: "var(--color-chart-4)",
  Maintenance: "var(--color-warning)",
  Offline: "var(--color-muted-foreground)",
};

interface GpsMapProps {
  vehicles: Vehicle[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  hubs?: { name: string; lat: number; lng: number }[];
  height?: string;
}

export function GpsMap({ vehicles, selectedId, onSelect, hubs = [], height = "26rem" }: GpsMapProps) {
  const points = useMemo(
    () => vehicles.map((v) => ({ v, ...project(v.lat, v.lng) })),
    [vehicles],
  );
  const hubPoints = useMemo(() => hubs.map((h) => ({ h, ...project(h.lat, h.lng) })), [hubs]);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border bg-[oklch(0.16_0.04_259)] grid-backdrop"
      style={{ height }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,oklch(0.76_0.17_163/10%),transparent_65%)]" />

      {hubPoints.map(({ h, x, y }) => (
        <div
          key={h.name}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <div className="size-2 rotate-45 border border-primary/70 bg-primary/30" />
          <span className="absolute left-4 top-[-4px] whitespace-nowrap text-[10px] text-muted-foreground">
            {h.name}
          </span>
        </div>
      ))}

      {points.map(({ v, x, y }) => {
        const selected = selectedId === v.id;
        return (
          <button
            key={v.id}
            onClick={() => onSelect?.(v.id)}
            className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-label={`Vehicle ${v.license_plate}`}
          >
            {v.status === "On Trip" ? (
              <span
                className="absolute inset-0 -m-2 animate-ping rounded-full opacity-40"
                style={{ backgroundColor: statusColor[v.status] }}
              />
            ) : null}
            <span
              className="relative block size-3 rounded-full ring-2 ring-background transition-transform group-hover:scale-150"
              style={{
                backgroundColor: statusColor[v.status],
                transform: selected ? "scale(1.6)" : undefined,
              }}
            />
            <span
              className={`absolute left-4 top-[-9px] whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[10px] font-medium shadow-lg transition-opacity ${
                selected ? "opacity-100" : "pointer-events-none opacity-0 group-hover:opacity-100"
              }`}
            >
              {v.license_plate} · {num(v.speed_kmh)} km/h
            </span>
          </button>
        );
      })}

      <div className="absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-lg border border-border bg-background/80 px-3 py-2 text-[10px] backdrop-blur">
        {(Object.keys(statusColor) as Vehicle["status"][]).map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ backgroundColor: statusColor[s] }} />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
