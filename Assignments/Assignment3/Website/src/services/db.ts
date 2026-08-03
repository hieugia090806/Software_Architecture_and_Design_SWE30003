import { useSyncExternalStore } from "react";
import * as seed from "./mockData";
import type {
  CargoItem,
  Driver,
  FleetAlert,
  Invoice,
  MaintenanceRecord,
  Notification,
  Order,
  OrderStatus,
  TelemetryRecord,
  Trip,
  TripIncident,
  Vehicle,
  VehicleStatus,
} from "./types";

/**
 * In-memory reactive data layer standing in for the SmartFM Postgres schema.
 * Every mutation here maps 1:1 to a table write in the dbdiagram design, so
 * swapping this module for Supabase queries later touches nothing else.
 */
export interface DbState {
  vehicles: Vehicle[];
  drivers: Driver[];
  orders: Order[];
  cargoItems: CargoItem[];
  trips: Trip[];
  telemetry: TelemetryRecord[];
  alerts: FleetAlert[];
  incidents: TripIncident[];
  maintenance: MaintenanceRecord[];
  invoices: Invoice[];
  notifications: Notification[];
}

let state: DbState = {
  vehicles: [...seed.vehicles],
  drivers: [...seed.drivers],
  orders: [...seed.orders],
  cargoItems: [...seed.cargoItems],
  trips: [...seed.trips],
  telemetry: [...seed.telemetry],
  alerts: [...seed.alerts],
  incidents: [...seed.incidents],
  maintenance: [...seed.maintenance],
  invoices: [...seed.invoices],
  notifications: [...seed.notifications],
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const set = (patch: Partial<DbState>) => {
  state = { ...state, ...patch };
  emit();
};

const nextId = (rows: { id: number }[]) =>
  rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;

export function useDb<T>(selector: (s: DbState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export const getState = () => state;

/* ------------------------------ mutations ------------------------------ */

export const db = {
  registerVehicle(input: {
    license_plate: string;
    vehicle_type_id: number;
    branch_id: number;
    status: VehicleStatus;
  }) {
    const base = state.vehicles[0]!;
    const vehicle: Vehicle = {
      id: nextId(state.vehicles),
      license_plate: input.license_plate,
      vehicle_type_id: input.vehicle_type_id,
      branch_id: input.branch_id,
      assigned_driver_id: null,
      status: input.status,
      lat: base.lat + (Math.random() - 0.5) * 0.2,
      lng: base.lng + (Math.random() - 0.5) * 0.2,
      speed_kmh: 0,
      odometer_km: 0,
    };
    set({ vehicles: [...state.vehicles, vehicle] });
    return vehicle;
  },

  setVehicleStatus(id: number, status: VehicleStatus) {
    set({
      vehicles: state.vehicles.map((v) =>
        v.id === id ? { ...v, status, speed_kmh: status === "On Trip" ? v.speed_kmh : 0 } : v,
      ),
    });
  },

  /** Dispatcher.allocateTrip + assignDriverAndVehicle */
  dispatchTrip(input: { order_id: number; vehicle_id: number; driver_id: number }) {
    const order = state.orders.find((o) => o.id === input.order_id);
    const vehicle = state.vehicles.find((v) => v.id === input.vehicle_id);
    if (!order || !vehicle) throw new Error("Order or vehicle not found");

    const type = seed.vehicleTypes.find((t) => t.id === vehicle.vehicle_type_id)!;
    if (type.max_payload_kg < order.total_weight_kg) {
      throw new Error(
        `${vehicle.license_plate} max payload ${type.max_payload_kg}kg < required ${order.total_weight_kg}kg`,
      );
    }

    const distance = Math.round((30 + Math.random() * 90) * 10) / 10;
    const trip: Trip = {
      id: nextId(state.trips),
      code: `TRP-${9000 + nextId(state.trips)}`,
      order_id: order.id,
      dispatcher_id: 1,
      vehicle_id: vehicle.id,
      driver_id: input.driver_id,
      distance_km: distance,
      calculated_fuel_cost: Math.round(distance * type.base_fuel_rate * 120_000),
      status: "Scheduled",
      started_at: null,
      completed_at: null,
      checklist: [
        { id: "c1", label: "Pre-trip vehicle inspection", done: false },
        { id: "c2", label: "Cargo loaded & secured", done: false },
        { id: "c3", label: "Documents verified (BOL)", done: false },
        { id: "c4", label: "Arrived at delivery point", done: false },
        { id: "c5", label: "Proof of delivery captured", done: false },
      ],
    };

    set({
      trips: [trip, ...state.trips],
      orders: state.orders.map((o) => (o.id === order.id ? { ...o, status: "Assigned" as OrderStatus } : o)),
      vehicles: state.vehicles.map((v) =>
        v.id === vehicle.id ? { ...v, status: "On Trip" as VehicleStatus, assigned_driver_id: input.driver_id } : v,
      ),
      drivers: state.drivers.map((d) => (d.id === input.driver_id ? { ...d, status: "On Trip" } : d)),
    });
    return trip;
  },

  updateTripStatus(tripId: number, status: Trip["status"]) {
    const trip = state.trips.find((t) => t.id === tripId);
    if (!trip) return;
    const orderStatus: OrderStatus =
      status === "In Transit" ? "In Transit" : status === "Completed" ? "Delivered" : "Assigned";

    set({
      trips: state.trips.map((t) =>
        t.id === tripId
          ? {
              ...t,
              status,
              started_at: status === "In Transit" ? new Date().toISOString() : t.started_at,
              completed_at: status === "Completed" ? new Date().toISOString() : t.completed_at,
            }
          : t,
      ),
      orders: state.orders.map((o) => (o.id === trip.order_id ? { ...o, status: orderStatus } : o)),
      vehicles: state.vehicles.map((v) =>
        v.id === trip.vehicle_id
          ? { ...v, status: status === "Completed" ? "Available" : "On Trip", speed_kmh: status === "Completed" ? 0 : v.speed_kmh }
          : v,
      ),
      drivers: state.drivers.map((d) =>
        d.id === trip.driver_id ? { ...d, status: status === "Completed" ? "Available" : "On Trip" } : d,
      ),
    });
  },

  toggleChecklistItem(tripId: number, itemId: string) {
    set({
      trips: state.trips.map((t) =>
        t.id === tripId
          ? { ...t, checklist: t.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)) }
          : t,
      ),
    });
  },

  logIncident(input: {
    trip_id: number;
    incident_type: string;
    has_damage: boolean;
    damage_description: string;
    action_taken: string;
  }) {
    const incident: TripIncident = {
      id: nextId(state.incidents),
      reported_at: new Date().toISOString(),
      ...input,
    };
    set({ incidents: [incident, ...state.incidents] });
    return incident;
  },

  acknowledgeAlert(id: number) {
    set({ alerts: state.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)) });
  },

  dismissAlert(id: number) {
    set({ alerts: state.alerts.filter((a) => a.id !== id) });
  },

  pushAlert(alert: Omit<FleetAlert, "id" | "created_at" | "acknowledged">) {
    const row: FleetAlert = {
      ...alert,
      id: nextId(state.alerts),
      created_at: new Date().toISOString(),
      acknowledged: false,
    };
    set({ alerts: [row, ...state.alerts].slice(0, 40) });
    return row;
  },

  createOrder(input: {
    customer_id: number;
    origin_branch_id: number;
    pickup_address: string;
    destination_address: string;
    items: { item_name: string; weight_kg: number; volume_m3: number; is_fragile: boolean }[];
    total_amount: number;
  }) {
    const id = nextId(state.orders);
    const order: Order = {
      id,
      code: `ORD-${24800 + id}`,
      customer_id: input.customer_id,
      origin_branch_id: input.origin_branch_id,
      pickup_address: input.pickup_address,
      destination_address: input.destination_address,
      total_weight_kg: input.items.reduce((s, i) => s + i.weight_kg, 0),
      total_volume_m3: Math.round(input.items.reduce((s, i) => s + i.volume_m3, 0) * 10) / 10,
      total_amount: input.total_amount,
      status: "Pending",
      created_at: new Date().toISOString(),
    };
    let cargoId = nextId(state.cargoItems);
    const items: CargoItem[] = input.items.map((i) => ({ id: cargoId++, order_id: id, ...i }));
    set({ orders: [order, ...state.orders], cargoItems: [...state.cargoItems, ...items] });
    return order;
  },

  scheduleMaintenance(input: { vehicle_id: number; servicing_type: string; cost: number; description: string }) {
    const record: MaintenanceRecord = {
      id: nextId(state.maintenance),
      started_at: new Date().toISOString(),
      completed_at: null,
      ...input,
    };
    set({ maintenance: [record, ...state.maintenance] });
    db.setVehicleStatus(input.vehicle_id, "Maintenance");
    return record;
  },

  markInvoicePaid(id: number) {
    set({ invoices: state.invoices.map((i) => (i.id === id ? { ...i, payment_status: "Paid" } : i)) });
  },

  /** Simulated telemetry tick: moves live vehicles and may raise alerts. */
  tickTelemetry() {
    const moving = state.vehicles.filter((v) => v.status === "On Trip");
    if (!moving.length) return;

    const updated = state.vehicles.map((v) => {
      if (v.status !== "On Trip") return v;
      const speed = Math.max(18, Math.min(104, Math.round(v.speed_kmh + (Math.random() - 0.45) * 16)));
      return {
        ...v,
        speed_kmh: speed,
        lat: v.lat + (Math.random() - 0.5) * 0.006,
        lng: v.lng + (Math.random() - 0.5) * 0.006,
        odometer_km: v.odometer_km + speed / 600,
      };
    });

    let telemetryId = nextId(state.telemetry);
    const newRecords: TelemetryRecord[] = updated
      .filter((v) => v.status === "On Trip")
      .map((v) => ({
        id: telemetryId++,
        trip_id: state.trips.find((t) => t.vehicle_id === v.id && t.status === "In Transit")?.id ?? null,
        vehicle_id: v.id,
        latitude: v.lat,
        longitude: v.lng,
        calculated_velocity: v.speed_kmh,
        recorded_at: new Date().toISOString(),
      }));

    set({
      vehicles: updated,
      telemetry: [...newRecords, ...state.telemetry].slice(0, 300),
    });

    const speeder = updated.find((v) => v.status === "On Trip" && v.speed_kmh > 95);
    if (speeder && Math.random() > 0.55) {
      db.pushAlert({
        vehicle_id: speeder.id,
        trip_id: null,
        alert_type: "Overspeed",
        severity: "critical",
        description: `${speeder.speed_kmh} km/h recorded — exceeds 95 km/h fleet ceiling`,
      });
    }
  },
};

export { seed };
