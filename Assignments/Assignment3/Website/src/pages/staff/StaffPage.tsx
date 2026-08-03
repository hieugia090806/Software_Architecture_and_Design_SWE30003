import { useState } from "react";
import { AlertOctagon, CheckCircle2, ClipboardCheck, Gauge, MapPin, Navigation, Truck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { GpsMap } from "@/components/GpsMap";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, seed, useDb } from "@/services/db";
import { useTelemetryFeed } from "@/hooks/useTelemetryFeed";
import { clock, num, timeAgo, vnd } from "@/lib/format";

const nav = [
  { label: "Driver Workspace", icon: Navigation, value: "workspace" },
  { label: "Task Checklist", icon: ClipboardCheck, value: "checklist" },
  { label: "Incident Log", icon: AlertOctagon, value: "incidents" },
];

const DRIVER_ID = 1; // Minh Pham — the signed-in staff account

export function StaffPage() {
  const [tab, setTab] = useState("workspace");
  useTelemetryFeed();

  const trips = useDb((s) => s.trips).filter((t) => t.driver_id === DRIVER_ID);
  const vehicles = useDb((s) => s.vehicles);
  const orders = useDb((s) => s.orders);
  const incidents = useDb((s) => s.incidents);
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  const activeTrip = trips.find((t) => t.status === "In Transit" || t.status === "Scheduled") ?? trips[0];
  const vehicle = vehicles.find((v) => v.id === activeTrip?.vehicle_id);
  const order = orders.find((o) => o.id === activeTrip?.order_id);
  const doneCount = activeTrip?.checklist.filter((c) => c.done).length ?? 0;
  const total = activeTrip?.checklist.length ?? 0;
  const myIncidents = incidents.filter((i) => trips.some((t) => t.id === i.trip_id));

  return (
    <AppShell
      title="Driver Execution Workspace"
      subtitle={activeTrip ? `${activeTrip.code} · ${order?.code ?? ""}` : "No trip assigned"}
      nav={nav}
      active={tab}
      onNavigate={setTab}
      headerRight={
        <Button size="sm" variant="destructive" onClick={() => setEmergencyOpen(true)}>
          <AlertOctagon className="size-4" /> Emergency: Log Incident
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Trip" value={activeTrip?.code ?? "—"} icon={Navigation} tone="accent" hint={activeTrip?.status} />
        <StatCard label="Assigned Unit" value={vehicle?.license_plate ?? "—"} icon={Truck} hint={vehicle?.status} />
        <StatCard label="Current Speed" value={`${num(vehicle?.speed_kmh ?? 0)} km/h`} icon={Gauge} hint="Live telemetry" />
        <StatCard label="Checklist" value={`${doneCount}/${total}`} icon={ClipboardCheck} tone={doneCount === total ? "accent" : "warning"} hint="Tasks completed" />
      </div>

      {tab === "workspace" ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div className="panel p-4">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="size-4 text-accent" />
              <h3 className="text-sm font-semibold">Your Route</h3>
            </div>
            <GpsMap vehicles={vehicle ? [vehicle] : []} hubs={[]} height="24rem" />
            {order ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-surface-2/50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pickup</p>
                  <p className="mt-1 text-sm">{order.pickup_address}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-2/50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Delivery</p>
                  <p className="mt-1 text-sm">{order.destination_address}</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="panel p-4">
              <h3 className="text-sm font-semibold">Trip Controls</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Status changes cascade to the order, vehicle and dispatcher board.
              </p>
              <div className="mt-4 grid gap-2">
                <Button
                  disabled={!activeTrip || activeTrip.status !== "Scheduled"}
                  onClick={() => {
                    db.updateTripStatus(activeTrip!.id, "In Transit");
                    toast.success("Trip started — order set to In Transit");
                  }}
                >
                  Start Trip
                </Button>
                <Button
                  variant="outline"
                  disabled={!activeTrip || activeTrip.status !== "In Transit"}
                  onClick={() => {
                    if (doneCount < total) {
                      toast.error("Complete every checklist task before closing the trip");
                      setTab("checklist");
                      return;
                    }
                    db.updateTripStatus(activeTrip!.id, "Completed");
                    toast.success("Trip completed — order marked Delivered");
                  }}
                >
                  <CheckCircle2 className="size-4" /> Complete Delivery
                </Button>
              </div>
            </div>

            <div className="panel p-4">
              <h3 className="text-sm font-semibold">Trip Manifest</h3>
              <dl className="mt-3 space-y-2 text-xs">
                {[
                  ["Order", order?.code ?? "—"],
                  ["Cargo weight", order ? `${num(order.total_weight_kg)} kg` : "—"],
                  ["Cargo volume", order ? `${order.total_volume_m3} m³` : "—"],
                  ["Distance", activeTrip ? `${activeTrip.distance_km} km` : "—"],
                  ["Fuel budget", activeTrip ? vnd(activeTrip.calculated_fuel_cost) : "—"],
                  ["Started", clock(activeTrip?.started_at ?? null)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cargo items</p>
                {seed.cargoItems
                  .filter((c) => c.order_id === order?.id)
                  .map((c) => (
                    <div key={c.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs">
                      <span className="flex-1">{c.item_name}</span>
                      {c.is_fragile ? (
                        <Badge variant="outline" className="border-warning/50 text-[10px] text-warning">Fragile</Badge>
                      ) : null}
                      <span className="tabular-nums text-muted-foreground">{num(c.weight_kg)} kg</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "checklist" ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="panel p-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="size-4 text-accent" />
              <h3 className="flex-1 text-sm font-semibold">Task Checklist — {activeTrip?.code ?? "no trip"}</h3>
              <span className="text-xs text-muted-foreground">{doneCount}/{total}</span>
            </div>
            <Progress value={total ? (doneCount / total) * 100 : 0} className="mt-3" />
            <div className="mt-4 space-y-2">
              {activeTrip?.checklist.map((c) => (
                <label
                  key={c.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                    c.done ? "border-accent/40 bg-accent/8 text-muted-foreground line-through" : "border-border bg-surface-2/40"
                  }`}
                >
                  <Checkbox
                    checked={c.done}
                    onCheckedChange={() => {
                      db.toggleChecklistItem(activeTrip.id, c.id);
                      toast.success(c.done ? "Task reopened" : `Completed: ${c.label}`);
                    }}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>

          <div className="panel p-4">
            <h3 className="text-sm font-semibold">My Trips</h3>
            <div className="mt-3 space-y-2">
              {trips.map((t) => (
                <div key={t.id} className="rounded-lg border border-border bg-surface-2/40 p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{t.code}</span>
                    <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                    <span className="ml-auto text-[11px] text-muted-foreground">{t.distance_km} km</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {orders.find((o) => o.id === t.order_id)?.destination_address}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "incidents" ? (
        <div className="mt-4 panel">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <AlertOctagon className="size-4 text-destructive" />
            <h3 className="flex-1 text-sm font-semibold">My Incident Reports</h3>
            <Button size="sm" variant="destructive" onClick={() => setEmergencyOpen(true)}>
              Log Incident
            </Button>
          </div>
          {myIncidents.length === 0 ? (
            <p className="p-8 text-center text-xs text-muted-foreground">No incidents reported on your trips.</p>
          ) : (
            <div className="divide-y divide-border">
              {myIncidents.map((i) => (
                <div key={i.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{i.incident_type}</p>
                    {i.has_damage ? (
                      <Badge variant="outline" className="border-destructive/50 text-[10px] text-destructive">Damage</Badge>
                    ) : null}
                    <span className="ml-auto text-[11px] text-muted-foreground">{timeAgo(i.reported_at)}</span>
                  </div>
                  {i.damage_description ? <p className="mt-1 text-xs text-muted-foreground">{i.damage_description}</p> : null}
                  <p className="mt-1 text-xs"><span className="text-muted-foreground">Action: </span>{i.action_taken}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <EmergencyDialog open={emergencyOpen} onOpenChange={setEmergencyOpen} tripId={activeTrip?.id ?? null} />
    </AppShell>
  );
}

function EmergencyDialog({
  open,
  onOpenChange,
  tripId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tripId: number | null;
}) {
  const [type, setType] = useState("Breakdown");
  const [hasDamage, setHasDamage] = useState(false);
  const [damage, setDamage] = useState("");
  const [action, setAction] = useState("");
  const [location, setLocation] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Emergency Incident Report</DialogTitle>
          <DialogDescription>
            Dispatch is notified immediately and a fleet alert is raised.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Incident type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Breakdown", "Minor collision", "Cargo damage", "Traffic delay", "Medical", "Theft / security"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Location note</Label>
            <Input className="mt-1.5" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="QL1A km 32, near Bien Hoa" />
          </div>
          <label className="flex items-center gap-2 text-xs">
            <Checkbox checked={hasDamage} onCheckedChange={(v) => setHasDamage(Boolean(v))} />
            Damage occurred
          </label>
          {hasDamage ? (
            <div>
              <Label className="text-xs">Damage description</Label>
              <Textarea className="mt-1.5" value={damage} onChange={(e) => setDamage(e.target.value)} />
            </div>
          ) : null}
          <div>
            <Label className="text-xs">Immediate action taken</Label>
            <Textarea className="mt-1.5" value={action} onChange={(e) => setAction(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!tripId) {
                toast.error("No active trip to attach this report to");
                return;
              }
              db.logIncident({
                trip_id: tripId,
                incident_type: type,
                has_damage: hasDamage,
                damage_description: [location.trim(), damage.trim()].filter(Boolean).join(" — "),
                action_taken: action.trim() || "Awaiting dispatcher instruction",
              });
              db.pushAlert({
                vehicle_id: 1,
                trip_id: tripId,
                alert_type: "Harsh Braking",
                severity: "critical",
                description: `Driver reported: ${type}${location ? ` at ${location}` : ""}`,
              });
              toast.success("Incident sent to dispatch");
              setDamage("");
              setAction("");
              setLocation("");
              setHasDamage(false);
              onOpenChange(false);
            }}
          >
            Send Emergency Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
