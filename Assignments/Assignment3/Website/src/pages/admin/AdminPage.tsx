import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Gauge,
  MapPin,
  Plus,
  Radio,
  Route as RouteIcon,
  Truck,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { AlertStream } from "@/components/AlertStream";
import { GpsMap } from "@/components/GpsMap";
import { StatCard } from "@/components/StatCard";
import {
  FleetStatusChart,
  SpeedDistributionChart,
  VelocityTrendChart,
} from "@/components/FleetCharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db, seed, useDb } from "@/services/db";
import { useTelemetryFeed } from "@/hooks/useTelemetryFeed";
import { num, timeAgo, vnd } from "@/lib/format";
import type { VehicleStatus } from "@/services/types";

const nav = [
  { label: "Fleet Telemetry", icon: Radio, value: "telemetry" },
  { label: "Trip Allocation", icon: RouteIcon, value: "dispatch" },
  { label: "Vehicle Registry", icon: Truck, value: "vehicles" },
  { label: "Incident Logs", icon: ClipboardList, value: "incidents" },
];

const hubs = seed.branches.map((b) => ({
  name: b.branch_code,
  lat: b.location_city === "Hanoi" ? 21.03 : b.location_city === "Da Nang" ? 16.06 : b.location_city === "Can Tho" ? 10.04 : 10.78,
  lng: b.location_city === "Hanoi" ? 105.8 : b.location_city === "Da Nang" ? 108.21 : b.location_city === "Can Tho" ? 105.75 : 106.7,
}));

export function AdminPage() {
  const [tab, setTab] = useState("telemetry");
  useTelemetryFeed();

  const vehicles = useDb((s) => s.vehicles);
  const drivers = useDb((s) => s.drivers);
  const orders = useDb((s) => s.orders);
  const trips = useDb((s) => s.trips);
  const alerts = useDb((s) => s.alerts);
  const incidents = useDb((s) => s.incidents);
  const maintenance = useDb((s) => s.maintenance);

  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [plateFilter, setPlateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VehicleStatus>("all");

  const onTrip = vehicles.filter((v) => v.status === "On Trip");
  const avgSpeed = onTrip.length
    ? Math.round(onTrip.reduce((s, v) => s + v.speed_kmh, 0) / onTrip.length)
    : 0;

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          v.license_plate.toLowerCase().includes(plateFilter.toLowerCase()) &&
          (statusFilter === "all" || v.status === statusFilter),
      ),
    [vehicles, plateFilter, statusFilter],
  );

  return (
    <AppShell
      title="Fleet Control Center"
      subtitle="Live telemetry, dispatch and asset governance across 4 hubs"
      nav={nav}
      active={tab}
      onNavigate={setTab}
      headerRight={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setRegisterOpen(true)}>
            <Plus className="size-4" /> Register Vehicle
          </Button>
          <Button size="sm" onClick={() => setDispatchOpen(true)}>
            <RouteIcon className="size-4" /> Dispatch &amp; Assign Trip
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vehicles On Trip" value={`${onTrip.length}/${vehicles.length}`} icon={Truck} tone="accent" hint="Active units transmitting" />
        <StatCard label="Avg Fleet Speed" value={`${avgSpeed} km/h`} icon={Gauge} hint="Rolling telemetry average" />
        <StatCard label="Open Alerts" value={String(alerts.filter((a) => !a.acknowledged).length)} icon={AlertTriangle} tone="destructive" hint="Awaiting review" />
        <StatCard label="Pending Orders" value={String(orders.filter((o) => o.status === "Pending").length)} icon={ClipboardList} tone="warning" hint="Not yet allocated" />
      </div>

      {tab === "telemetry" ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
          <div className="space-y-4">
            <div className="panel p-4">
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="size-4 text-accent" />
                <h3 className="text-sm font-semibold">Live GPS Map</h3>
                <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="size-1.5 animate-pulse rounded-full bg-accent" /> streaming every 3s
                </span>
              </div>
              <GpsMap
                vehicles={vehicles}
                hubs={hubs}
                selectedId={selectedVehicle}
                onSelect={(id) => setSelectedVehicle((cur) => (cur === id ? null : id))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <SpeedDistributionChart />
              <FleetStatusChart />
            </div>
            <VelocityTrendChart />
          </div>
          <AlertStream />
        </div>
      ) : null}

      {tab === "dispatch" ? (
        <div className="mt-4 space-y-4">
          <div className="panel overflow-x-auto">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <ClipboardList className="size-4 text-accent" />
              <h3 className="text-sm font-semibold">Order Queue</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.code}</TableCell>
                    <TableCell className="max-w-[16rem] truncate text-xs">{o.destination_address}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{num(o.total_weight_kg)} kg</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{vnd(o.total_amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={o.status === "Pending" ? "default" : "ghost"}
                        disabled={o.status !== "Pending"}
                        onClick={() => setDispatchOpen(true)}
                      >
                        Allocate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="panel overflow-x-auto">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <RouteIcon className="size-4 text-accent" />
              <h3 className="text-sm font-semibold">Active Trip Assignments</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-right">Distance</TableHead>
                  <TableHead className="text-right">Fuel Cost</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.code}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {orders.find((o) => o.id === t.order_id)?.code}
                    </TableCell>
                    <TableCell className="text-xs">
                      {vehicles.find((v) => v.id === t.vehicle_id)?.license_plate}
                    </TableCell>
                    <TableCell className="text-xs">{drivers.find((d) => d.id === t.driver_id)?.name}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{t.distance_km} km</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{vnd(t.calculated_fuel_cost)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${t.status === "In Transit" ? "border-accent/50 text-accent" : ""}`}
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      {tab === "vehicles" ? (
        <div className="mt-4 space-y-4">
          <div className="panel p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                placeholder="Filter by plate…"
                value={plateFilter}
                onChange={(e) => setPlateFilter(e.target.value)}
                className="max-w-xs"
              />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="On Trip">On Trip</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => setMaintenanceOpen(true)}>
                <Wrench className="size-4" /> Schedule Maintenance
              </Button>
              <Button size="sm" onClick={() => setRegisterOpen(true)}>
                <Plus className="size-4" /> Register New Vehicle
              </Button>
            </div>
          </div>

          <div className="panel overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Hub</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-right">Odometer</TableHead>
                  <TableHead className="text-right">Speed</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-xs">{v.license_plate}</TableCell>
                    <TableCell className="text-xs">
                      {seed.vehicleTypes.find((t) => t.id === v.vehicle_type_id)?.type_name}
                    </TableCell>
                    <TableCell className="text-xs">
                      {seed.branches.find((b) => b.id === v.branch_id)?.branch_code}
                    </TableCell>
                    <TableCell className="text-xs">
                      {drivers.find((d) => d.id === v.assigned_driver_id)?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{num(v.odometer_km)} km</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{num(v.speed_kmh)} km/h</TableCell>
                    <TableCell>
                      <Select value={v.status} onValueChange={(s) => {
                        db.setVehicleStatus(v.id, s as VehicleStatus);
                        toast.success(`${v.license_plate} set to ${s}`);
                      }}>
                        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Available">Available</SelectItem>
                          <SelectItem value="On Trip">On Trip</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Offline">Offline</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="panel overflow-x-auto">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Wrench className="size-4 text-warning" />
              <h3 className="text-sm font-semibold">Maintenance Records</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Opened</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenance.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">
                      {vehicles.find((v) => v.id === m.vehicle_id)?.license_plate}
                    </TableCell>
                    <TableCell className="text-xs">{m.servicing_type}</TableCell>
                    <TableCell className="max-w-[20rem] truncate text-xs text-muted-foreground">{m.description}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{vnd(m.cost)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{timeAgo(m.started_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      {tab === "incidents" ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div className="panel">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <ClipboardList className="size-4 text-accent" />
              <h3 className="flex-1 text-sm font-semibold">Incident Register</h3>
              <Button size="sm" variant="outline" onClick={() => setIncidentOpen(true)}>
                <Plus className="size-4" /> Log Incident
              </Button>
            </div>
            <div className="divide-y divide-border">
              {incidents.map((i) => {
                const trip = trips.find((t) => t.id === i.trip_id);
                return (
                  <div key={i.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{i.incident_type}</p>
                      <Badge variant="outline" className="font-mono text-[10px]">{trip?.code ?? "—"}</Badge>
                      {i.has_damage ? (
                        <Badge variant="outline" className="border-destructive/50 text-[10px] text-destructive">
                          Damage reported
                        </Badge>
                      ) : null}
                      <span className="ml-auto text-[11px] text-muted-foreground">{timeAgo(i.reported_at)}</span>
                    </div>
                    {i.damage_description ? (
                      <p className="mt-1.5 text-xs text-muted-foreground">{i.damage_description}</p>
                    ) : null}
                    <p className="mt-1.5 text-xs">
                      <span className="text-muted-foreground">Action: </span>
                      {i.action_taken}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <AlertStream />
        </div>
      ) : null}

      <DispatchDialog open={dispatchOpen} onOpenChange={setDispatchOpen} />
      <RegisterVehicleDialog open={registerOpen} onOpenChange={setRegisterOpen} />
      <MaintenanceDialog open={maintenanceOpen} onOpenChange={setMaintenanceOpen} />
      <IncidentDialog open={incidentOpen} onOpenChange={setIncidentOpen} />
    </AppShell>
  );
}

/* -------------------------------- dialogs -------------------------------- */

function DispatchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const orders = useDb((s) => s.orders).filter((o) => o.status === "Pending");
  const vehicles = useDb((s) => s.vehicles).filter((v) => v.status === "Available");
  const drivers = useDb((s) => s.drivers).filter((d) => d.status === "Available");

  const [orderId, setOrderId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");

  const submit = () => {
    if (!orderId || !vehicleId || !driverId) {
      toast.error("Select an order, vehicle and driver");
      return;
    }
    try {
      const trip = db.dispatchTrip({
        order_id: Number(orderId),
        vehicle_id: Number(vehicleId),
        driver_id: Number(driverId),
      });
      toast.success(`${trip.code} scheduled`, { description: `Distance ${trip.distance_km} km · fuel ${vnd(trip.calculated_fuel_cost)}` });
      setOrderId("");
      setVehicleId("");
      setDriverId("");
      onOpenChange(false);
    } catch (e) {
      toast.error("Allocation blocked", { description: (e as Error).message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dispatch &amp; Assign Trip</DialogTitle>
          <DialogDescription>
            Capacity and availability are validated before the trip is created.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Pending order</Label>
            <Select value={orderId} onValueChange={setOrderId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select order" /></SelectTrigger>
              <SelectContent>
                {orders.length === 0 ? <SelectItem value="none" disabled>No pending orders</SelectItem> : null}
                {orders.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.code} · {num(o.total_weight_kg)} kg
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Available vehicle</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => {
                  const t = seed.vehicleTypes.find((x) => x.id === v.vehicle_type_id);
                  return (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.license_plate} · {t?.type_name} · {num(t?.max_payload_kg ?? 0)} kg
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Available driver</Label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select driver" /></SelectTrigger>
              <SelectContent>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name} · {d.license_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}><Activity className="size-4" /> Create Trip</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RegisterVehicleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [plate, setPlate] = useState("");
  const [typeId, setTypeId] = useState("2");
  const [branchId, setBranchId] = useState("1");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register New Vehicle</DialogTitle>
          <DialogDescription>Adds a unit to the fleet registry and hub roster.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">License plate</Label>
            <Input className="mt-1.5" placeholder="51C-000.00" value={plate} onChange={(e) => setPlate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Vehicle type</Label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {seed.vehicleTypes.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.type_name} · {num(t.max_payload_kg)} kg
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Home hub</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {seed.branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.branch_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (!plate.trim()) {
                toast.error("License plate is required");
                return;
              }
              db.registerVehicle({
                license_plate: plate.trim(),
                vehicle_type_id: Number(typeId),
                branch_id: Number(branchId),
                status: "Available",
              });
              toast.success(`${plate.trim()} registered`);
              setPlate("");
              onOpenChange(false);
            }}
          >
            Register
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MaintenanceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const vehicles = useDb((s) => s.vehicles);
  const [vehicleId, setVehicleId] = useState("");
  const [service, setService] = useState("");
  const [cost, setCost] = useState("");
  const [description, setDescription] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Maintenance</DialogTitle>
          <DialogDescription>Moves the unit into the maintenance bay immediately.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Vehicle</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>{v.license_plate}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Servicing type</Label>
            <Input className="mt-1.5" value={service} onChange={(e) => setService(e.target.value)} placeholder="Brake system service" />
          </div>
          <div>
            <Label className="text-xs">Estimated cost (₫)</Label>
            <Input className="mt-1.5" type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="5000000" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea className="mt-1.5" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (!vehicleId || !service.trim()) {
                toast.error("Vehicle and servicing type are required");
                return;
              }
              db.scheduleMaintenance({
                vehicle_id: Number(vehicleId),
                servicing_type: service.trim(),
                cost: Number(cost) || 0,
                description: description.trim(),
              });
              toast.success("Maintenance scheduled");
              setService("");
              setCost("");
              setDescription("");
              onOpenChange(false);
            }}
          >
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IncidentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const trips = useDb((s) => s.trips);
  const [tripId, setTripId] = useState("");
  const [type, setType] = useState("");
  const [hasDamage, setHasDamage] = useState(false);
  const [damage, setDamage] = useState("");
  const [action, setAction] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Incident</DialogTitle>
          <DialogDescription>Filed against a trip assignment for audit review.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Trip</Label>
            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select trip" /></SelectTrigger>
              <SelectContent>
                {trips.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Incident type</Label>
            <Input className="mt-1.5" value={type} onChange={(e) => setType(e.target.value)} placeholder="Traffic delay" />
          </div>
          <label className="flex items-center gap-2 text-xs">
            <Checkbox checked={hasDamage} onCheckedChange={(v) => setHasDamage(Boolean(v))} />
            Cargo or vehicle damage occurred
          </label>
          {hasDamage ? (
            <div>
              <Label className="text-xs">Damage description</Label>
              <Textarea className="mt-1.5" value={damage} onChange={(e) => setDamage(e.target.value)} />
            </div>
          ) : null}
          <div>
            <Label className="text-xs">Action taken</Label>
            <Textarea className="mt-1.5" value={action} onChange={(e) => setAction(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (!tripId || !type.trim()) {
                toast.error("Trip and incident type are required");
                return;
              }
              db.logIncident({
                trip_id: Number(tripId),
                incident_type: type.trim(),
                has_damage: hasDamage,
                damage_description: damage.trim(),
                action_taken: action.trim() || "Logged for review",
              });
              toast.success("Incident logged");
              setType("");
              setDamage("");
              setAction("");
              setHasDamage(false);
              onOpenChange(false);
            }}
          >
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
