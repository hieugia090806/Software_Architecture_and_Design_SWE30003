import { useMemo, useState } from "react";
import { Calculator, Check, Download, FileText, Package, Plus, Receipt, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { GpsMap } from "@/components/GpsMap";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
import { day, num, vnd } from "@/lib/format";
import type { OrderStatus } from "@/services/types";

const nav = [
  { label: "Live Order Tracking", icon: Truck, value: "tracking" },
  { label: "Freight Estimator", icon: Calculator, value: "estimator" },
  { label: "Invoices", icon: Receipt, value: "invoices" },
];

const CUSTOMER_ID = 1;

const STEPS: OrderStatus[] = ["Pending", "Assigned", "In Transit", "Delivered"];

export function CustomerPage() {
  const [tab, setTab] = useState("tracking");
  useTelemetryFeed();

  const orders = useDb((s) => s.orders).filter((o) => o.customer_id === CUSTOMER_ID);
  const trips = useDb((s) => s.trips);
  const vehicles = useDb((s) => s.vehicles);
  const invoices = useDb((s) => s.invoices);
  const cargoItems = useDb((s) => s.cargoItems);

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(orders[0]?.id ?? null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const order = orders.find((o) => o.id === selectedOrderId) ?? orders[0];
  const trip = trips.find((t) => t.order_id === order?.id);
  const vehicle = vehicles.find((v) => v.id === trip?.vehicle_id);
  const myInvoices = invoices.filter((i) => orders.some((o) => o.id === i.order_id));

  return (
    <AppShell
      title="Customer Portal"
      subtitle="Acme Industrial · shipment tracking, quotes and billing"
      nav={nav}
      active={tab}
      onNavigate={setTab}
      headerRight={
        <Button size="sm" onClick={() => setBookingOpen(true)}>
          <Plus className="size-4" /> New Shipment
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Shipments" value={String(orders.filter((o) => o.status === "In Transit" || o.status === "Assigned").length)} icon={Truck} tone="accent" />
        <StatCard label="Delivered" value={String(orders.filter((o) => o.status === "Delivered").length)} icon={Check} />
        <StatCard label="Outstanding Invoices" value={String(myInvoices.filter((i) => i.payment_status !== "Paid").length)} icon={Receipt} tone="warning" />
        <StatCard label="Total Freight Spend" value={vnd(orders.reduce((s, o) => s + o.total_amount, 0))} icon={FileText} />
      </div>

      {tab === "tracking" ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.5fr]">
          <div className="panel">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">My Orders</h3>
            </div>
            <div className="max-h-[32rem] divide-y divide-border overflow-y-auto">
              {orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOrderId(o.id)}
                  className={`block w-full px-4 py-3 text-left transition-colors ${
                    order?.id === o.id ? "bg-secondary/70" : "hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{o.code}</span>
                    <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
                    <span className="ml-auto text-[11px] text-muted-foreground">{day(o.created_at)}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{o.destination_address}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {order ? (
              <>
                <div className="panel p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">{order.code}</h3>
                    <Badge variant="outline" className="border-accent/40 text-[10px] text-accent">{order.status}</Badge>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {trip ? `${trip.code} · ${trip.distance_km} km` : "Awaiting allocation"}
                    </span>
                  </div>

                  {/* Stepper timeline */}
                  <ol className="mt-6 flex items-center">
                    {STEPS.map((step, idx) => {
                      const currentIdx = STEPS.indexOf(order.status === "Cancelled" ? "Pending" : order.status);
                      const reached = idx <= currentIdx;
                      return (
                        <li key={step} className="flex flex-1 items-center last:flex-none">
                          <div className="flex flex-col items-center gap-2">
                            <span
                              className={`flex size-8 items-center justify-center rounded-full border text-[11px] font-semibold ${
                                reached
                                  ? "border-accent bg-accent text-accent-foreground"
                                  : "border-border bg-surface-2 text-muted-foreground"
                              }`}
                            >
                              {reached ? <Check className="size-4" /> : idx + 1}
                            </span>
                            <span className={`whitespace-nowrap text-[11px] ${reached ? "" : "text-muted-foreground"}`}>
                              {step}
                            </span>
                          </div>
                          {idx < STEPS.length - 1 ? (
                            <span className={`mx-2 h-0.5 flex-1 ${idx < currentIdx ? "bg-accent" : "bg-border"}`} />
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                </div>

                <div className="panel p-4">
                  <h3 className="mb-3 text-sm font-semibold">Live Vehicle Position</h3>
                  <GpsMap vehicles={vehicle ? [vehicle] : []} height="20rem" />
                  {!vehicle ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      A vehicle will appear here once dispatch allocates this order.
                    </p>
                  ) : null}
                </div>

                <div className="panel p-4">
                  <h3 className="text-sm font-semibold">Shipment Detail</h3>
                  <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                    {[
                      ["Pickup", order.pickup_address],
                      ["Delivery", order.destination_address],
                      ["Weight", `${num(order.total_weight_kg)} kg`],
                      ["Volume", `${order.total_volume_m3} m³`],
                      ["Freight cost", vnd(order.total_amount)],
                      ["Booked", day(order.created_at)],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-lg border border-border bg-surface-2/40 px-3 py-2">
                        <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</dt>
                        <dd className="mt-0.5">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-3 space-y-1.5">
                    {cargoItems
                      .filter((c) => c.order_id === order.id)
                      .map((c) => (
                        <div key={c.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs">
                          <Package className="size-3.5 text-muted-foreground" />
                          <span className="flex-1">{c.item_name}</span>
                          {c.is_fragile ? (
                            <Badge variant="outline" className="border-warning/50 text-[10px] text-warning">Fragile</Badge>
                          ) : null}
                          <span className="tabular-nums text-muted-foreground">{num(c.weight_kg)} kg</span>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "estimator" ? <FreightEstimator onBook={() => setBookingOpen(true)} /> : null}

      {tab === "invoices" ? (
        <div className="mt-4 panel">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Invoices</h3>
          </div>
          <div className="divide-y divide-border">
            {myInvoices.map((i) => {
              const inv = orders.find((o) => o.id === i.order_id);
              return (
                <div key={i.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      INV-{String(i.id).padStart(4, "0")} · {inv?.code}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Base {vnd(i.base_tariff)} + distance {vnd(i.distance_surcharge)} × surge {i.surge_multiplier} · issued {day(i.issued_at)}
                    </p>
                  </div>
                  <p className="tabular-nums text-sm font-semibold">{vnd(i.total_amount)}</p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${i.payment_status === "Paid" ? "border-accent/50 text-accent" : "border-warning/50 text-warning"}`}
                  >
                    {i.payment_status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const body = [
                        `SmartFM Invoice INV-${String(i.id).padStart(4, "0")}`,
                        `Order: ${inv?.code}`,
                        `Destination: ${inv?.destination_address}`,
                        `Base tariff: ${vnd(i.base_tariff)}`,
                        `Distance surcharge: ${vnd(i.distance_surcharge)}`,
                        `Surge multiplier: ${i.surge_multiplier}`,
                        `Total: ${vnd(i.total_amount)}`,
                        `Status: ${i.payment_status}`,
                      ].join("\n");
                      const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `INV-${String(i.id).padStart(4, "0")}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success("Invoice downloaded");
                    }}
                  >
                    <Download className="size-4" /> Download
                  </Button>
                  {i.payment_status !== "Paid" ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        db.markInvoicePaid(i.id);
                        toast.success("Payment recorded");
                      }}
                    >
                      Pay now
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    </AppShell>
  );
}

/* ---------------------------- freight estimator --------------------------- */

function FreightEstimator({ onBook }: { onBook: () => void }) {
  const [weight, setWeight] = useState(1200);
  const [volume, setVolume] = useState(6);
  const [distance, setDistance] = useState(80);
  const [typeId, setTypeId] = useState("2");
  const [fragile, setFragile] = useState(false);
  const [express, setExpress] = useState(false);

  const quote = useMemo(() => {
    const type = seed.vehicleTypes.find((t) => t.id === Number(typeId))!;
    const baseTariff = 850_000 + weight * 380 + volume * 42_000;
    const distanceSurcharge = distance * type.base_fuel_rate * 128_000;
    const surge = 1 + (express ? 0.25 : 0) + (fragile ? 0.08 : 0);
    const total = (baseTariff + distanceSurcharge) * surge;
    const overCapacity = weight > type.max_payload_kg || volume > type.volumetric_limit_m3;
    return { type, baseTariff, distanceSurcharge, surge, total, overCapacity };
  }, [weight, volume, distance, typeId, fragile, express]);

  return (
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <div className="panel p-5">
        <h3 className="text-sm font-semibold">Dynamic Freight Estimator</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Pricing recalculates live from weight, volume, distance and vehicle class.
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <div className="flex justify-between text-xs">
              <Label>Cargo weight</Label>
              <span className="tabular-nums text-accent">{num(weight)} kg</span>
            </div>
            <Slider className="mt-3" min={50} max={24000} step={50} value={[weight]} onValueChange={([v]) => setWeight(v ?? 50)} />
          </div>
          <div>
            <div className="flex justify-between text-xs">
              <Label>Cargo volume</Label>
              <span className="tabular-nums text-accent">{volume} m³</span>
            </div>
            <Slider className="mt-3" min={1} max={67} step={1} value={[volume]} onValueChange={([v]) => setVolume(v ?? 1)} />
          </div>
          <div>
            <div className="flex justify-between text-xs">
              <Label>Route distance</Label>
              <span className="tabular-nums text-accent">{distance} km</span>
            </div>
            <Slider className="mt-3" min={5} max={1800} step={5} value={[distance]} onValueChange={([v]) => setDistance(v ?? 5)} />
          </div>
          <div>
            <Label className="text-xs">Vehicle class</Label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {seed.vehicleTypes.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.type_name} · {num(t.max_payload_kg)} kg / {t.volumetric_limit_m3} m³
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-5 text-xs">
            <label className="flex items-center gap-2">
              <Checkbox checked={fragile} onCheckedChange={(v) => setFragile(Boolean(v))} /> Fragile handling (+8%)
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={express} onCheckedChange={(v) => setExpress(Boolean(v))} /> Express priority (+25%)
            </label>
          </div>
        </div>
      </div>

      <div className="panel flex flex-col p-5">
        <h3 className="text-sm font-semibold">Quote</h3>
        <p className="mt-1 text-xs text-muted-foreground">{quote.type.type_name}</p>
        <p className="mt-6 text-4xl font-bold tabular-nums text-accent">{vnd(quote.total)}</p>
        <dl className="mt-6 space-y-2 text-xs">
          {[
            ["Base tariff", vnd(quote.baseTariff)],
            ["Distance surcharge", vnd(quote.distanceSurcharge)],
            ["Surge multiplier", `× ${quote.surge.toFixed(2)}`],
            ["Payload headroom", `${num(Math.max(0, quote.type.max_payload_kg - weight))} kg`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="tabular-nums font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {quote.overCapacity ? (
          <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Exceeds {quote.type.type_name} limits — select a larger vehicle class.
          </p>
        ) : null}
        <Button className="mt-auto pt-0" disabled={quote.overCapacity} onClick={onBook}>
          Book this shipment
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------- booking ---------------------------------- */

interface DraftItem {
  item_name: string;
  weight_kg: number;
  volume_m3: number;
  is_fragile: boolean;
}

function BookingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [branchId, setBranchId] = useState("1");
  const [destination, setDestination] = useState("");
  const [items, setItems] = useState<DraftItem[]>([
    { item_name: "", weight_kg: 500, volume_m3: 3, is_fragile: false },
  ]);

  const weight = items.reduce((s, i) => s + i.weight_kg, 0);
  const volume = items.reduce((s, i) => s + i.volume_m3, 0);
  const estimate = 850_000 + weight * 380 + volume * 42_000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book New Shipment</DialogTitle>
          <DialogDescription>Creates a pending order for dispatch allocation.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Origin hub</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {seed.branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.branch_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Delivery address</Label>
            <Input className="mt-1.5" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Warehouse 4, Binh Duong" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <Label className="flex-1 text-xs">Cargo items</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setItems((s) => [...s, { item_name: "", weight_kg: 100, volume_m3: 1, is_fragile: false }])}
              >
                <Plus className="size-4" /> Add
              </Button>
            </div>
            {items.map((it, idx) => (
              <div key={idx} className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Item description"
                    value={it.item_name}
                    onChange={(e) =>
                      setItems((s) => s.map((x, i) => (i === idx ? { ...x, item_name: e.target.value } : x)))
                    }
                  />
                  {items.length > 1 ? (
                    <Button size="icon" variant="ghost" onClick={() => setItems((s) => s.filter((_, i) => i !== idx))}>
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={it.weight_kg}
                    onChange={(e) =>
                      setItems((s) => s.map((x, i) => (i === idx ? { ...x, weight_kg: Number(e.target.value) } : x)))
                    }
                    placeholder="kg"
                  />
                  <Input
                    type="number"
                    value={it.volume_m3}
                    onChange={(e) =>
                      setItems((s) => s.map((x, i) => (i === idx ? { ...x, volume_m3: Number(e.target.value) } : x)))
                    }
                    placeholder="m³"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={it.is_fragile}
                    onCheckedChange={(v) =>
                      setItems((s) => s.map((x, i) => (i === idx ? { ...x, is_fragile: Boolean(v) } : x)))
                    }
                  />
                  Fragile
                </label>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-accent/30 bg-accent/8 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Estimated freight: </span>
            <span className="font-semibold text-accent">{vnd(estimate)}</span>
            <span className="text-muted-foreground"> · {num(weight)} kg / {volume.toFixed(1)} m³</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (!destination.trim()) {
                toast.error("Delivery address is required");
                return;
              }
              if (items.some((i) => !i.item_name.trim() || i.weight_kg <= 0 || i.volume_m3 <= 0)) {
                toast.error("Every cargo item needs a name, weight > 0 and volume > 0");
                return;
              }
              const branch = seed.branches.find((b) => b.id === Number(branchId))!;
              const order = db.createOrder({
                customer_id: CUSTOMER_ID,
                origin_branch_id: branch.id,
                pickup_address: `${branch.branch_name}, ${branch.location_city}`,
                destination_address: destination.trim(),
                items,
                total_amount: Math.round(estimate),
              });
              toast.success(`${order.code} created`, { description: "Awaiting dispatcher allocation" });
              setDestination("");
              setItems([{ item_name: "", weight_kg: 500, volume_m3: 3, is_fragile: false }]);
              onOpenChange(false);
            }}
          >
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
