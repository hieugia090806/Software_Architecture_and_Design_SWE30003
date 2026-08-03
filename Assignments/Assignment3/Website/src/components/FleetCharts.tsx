import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDb } from "@/services/db";
import type { Vehicle } from "@/services/types";

const axis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

const tooltipStyle = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.5rem",
  fontSize: "12px",
  color: "var(--color-popover-foreground)",
};

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="panel p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mb-3 text-[11px] text-muted-foreground">{subtitle}</p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const buckets = [
  { label: "0–20", min: 0, max: 20 },
  { label: "20–40", min: 20, max: 40 },
  { label: "40–60", min: 40, max: 60 },
  { label: "60–80", min: 60, max: 80 },
  { label: "80–100", min: 80, max: 100 },
  { label: "100+", min: 100, max: Infinity },
];

const statusFill: Record<Vehicle["status"], string> = {
  "On Trip": "var(--color-chart-1)",
  Available: "var(--color-chart-4)",
  Maintenance: "var(--color-chart-3)",
  Offline: "var(--color-chart-5)",
};

export function SpeedDistributionChart() {
  const telemetry = useDb((s) => s.telemetry);
  const data = buckets.map((b) => ({
    label: b.label,
    readings: telemetry.filter((t) => t.calculated_velocity >= b.min && t.calculated_velocity < b.max).length,
  }));

  return (
    <Panel title="Speed Distribution" subtitle="Telemetry readings grouped by velocity band (km/h)">
      <BarChart data={data}>
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={28} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-secondary)" }} />
        <Bar dataKey="readings" radius={[6, 6, 0, 0]} fill="var(--color-chart-2)" />
      </BarChart>
    </Panel>
  );
}

export function FleetStatusChart() {
  const vehicles = useDb((s) => s.vehicles);
  const statuses: Vehicle["status"][] = ["On Trip", "Available", "Maintenance", "Offline"];
  const data = statuses
    .map((s) => ({ name: s, value: vehicles.filter((v) => v.status === s).length }))
    .filter((d) => d.value > 0);

  return (
    <Panel title="Fleet Status Breakdown" subtitle="Live composition of registered units">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
          {data.map((d) => (
            <Cell key={d.name} fill={statusFill[d.name as Vehicle["status"]]} stroke="var(--color-background)" />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </Panel>
  );
}

export function VelocityTrendChart() {
  const telemetry = useDb((s) => s.telemetry);
  const data = [...telemetry]
    .slice(0, 24)
    .reverse()
    .map((t, i) => ({ i, speed: t.calculated_velocity }));

  return (
    <Panel title="Fleet Velocity Trend" subtitle="Rolling average speed across the last 24 pings">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="velFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis dataKey="i" {...axis} tick={false} />
        <YAxis {...axis} width={28} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="speed" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#velFill)" />
      </AreaChart>
    </Panel>
  );
}
