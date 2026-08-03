// Domain types mirroring the SmartFM dbdiagram schema.

export type Role = "admin" | "staff" | "customer";

export interface User {
  id: number;
  username: string;
  email: string;
  phone_number: string;
  role: Role;
  name: string;
  created_at: string;
}

export interface Branch {
  id: number;
  branch_code: string;
  branch_name: string;
  location_city: string;
  address: string;
}

export interface VehicleType {
  id: number;
  type_name: string;
  max_payload_kg: number;
  volumetric_limit_m3: number;
  base_fuel_rate: number;
}

export type VehicleStatus = "Available" | "On Trip" | "Maintenance" | "Offline";

export interface Vehicle {
  id: number;
  license_plate: string;
  vehicle_type_id: number;
  branch_id: number;
  assigned_driver_id: number | null;
  status: VehicleStatus;
  lat: number;
  lng: number;
  speed_kmh: number;
  odometer_km: number;
}

export type DriverStatus = "Available" | "On Trip" | "Off Duty";

export interface Driver {
  id: number;
  user_id: number;
  name: string;
  branch_id: number;
  license_number: string;
  active_service_hours: number;
  status: DriverStatus;
  phone: string;
}

export interface Customer {
  id: number;
  user_id: number;
  company_name: string;
  tax_code: string;
  billing_address: string;
  credit_limit: number;
}

export type OrderStatus =
  | "Pending"
  | "Assigned"
  | "In Transit"
  | "Delivered"
  | "Cancelled";

export interface Order {
  id: number;
  code: string;
  customer_id: number;
  origin_branch_id: number;
  destination_address: string;
  pickup_address: string;
  total_weight_kg: number;
  total_volume_m3: number;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
}

export interface CargoItem {
  id: number;
  order_id: number;
  item_name: string;
  weight_kg: number;
  volume_m3: number;
  is_fragile: boolean;
}

export type TripStatus = "Scheduled" | "In Transit" | "Completed" | "Cancelled";

export interface Trip {
  id: number;
  code: string;
  order_id: number;
  dispatcher_id: number;
  vehicle_id: number;
  driver_id: number;
  distance_km: number;
  calculated_fuel_cost: number;
  status: TripStatus;
  started_at: string | null;
  completed_at: string | null;
  checklist: { id: string; label: string; done: boolean }[];
}

export interface TelemetryRecord {
  id: number;
  trip_id: number | null;
  vehicle_id: number;
  latitude: number;
  longitude: number;
  calculated_velocity: number;
  recorded_at: string;
}

export type AlertType =
  | "Overspeed"
  | "Geofence Breach"
  | "Harsh Braking"
  | "Idle Timeout"
  | "Low Fuel";

export interface FleetAlert {
  id: number;
  vehicle_id: number;
  trip_id: number | null;
  alert_type: AlertType;
  severity: "critical" | "warning" | "info";
  description: string;
  created_at: string;
  acknowledged: boolean;
}

export interface TripIncident {
  id: number;
  trip_id: number;
  incident_type: string;
  has_damage: boolean;
  damage_description: string;
  action_taken: string;
  reported_at: string;
}

export interface MaintenanceRecord {
  id: number;
  vehicle_id: number;
  servicing_type: string;
  cost: number;
  description: string;
  started_at: string;
  completed_at: string | null;
}

export interface Invoice {
  id: number;
  order_id: number;
  base_tariff: number;
  distance_surcharge: number;
  surge_multiplier: number;
  total_amount: number;
  payment_status: "Unpaid" | "Paid" | "Overdue";
  issued_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  notification_type: "SMS" | "Email" | "System";
  message: string;
  is_read: boolean;
  sent_at: string;
}
