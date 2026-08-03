import type {
  Branch,
  CargoItem,
  Customer,
  Driver,
  FleetAlert,
  Invoice,
  MaintenanceRecord,
  Notification,
  Order,
  TelemetryRecord,
  Trip,
  TripIncident,
  User,
  Vehicle,
  VehicleType,
} from "./types";

const now = Date.now();
const iso = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();

export const users: User[] = [
  {
    id: 1,
    username: "admin",
    email: "admin@smartfm.com",
    phone_number: "+84 901 220 011",
    role: "admin",
    name: "Linh Tran",
    created_at: iso(60 * 24 * 400),
  },
  {
    id: 2,
    username: "driver01",
    email: "staff@smartfm.com",
    phone_number: "+84 903 771 654",
    role: "staff",
    name: "Minh Pham",
    created_at: iso(60 * 24 * 320),
  },
  {
    id: 3,
    username: "acmelogistics",
    email: "customer@smartfm.com",
    phone_number: "+84 908 442 190",
    role: "customer",
    name: "Acme Industrial",
    created_at: iso(60 * 24 * 210),
  },
];

export const branches: Branch[] = [
  { id: 1, branch_code: "HCM-01", branch_name: "Saigon Central Hub", location_city: "Ho Chi Minh City", address: "12 Nguyen Van Linh, District 7" },
  { id: 2, branch_code: "HAN-01", branch_name: "Hanoi North Hub", location_city: "Hanoi", address: "88 Pham Van Dong, Bac Tu Liem" },
  { id: 3, branch_code: "DAD-01", branch_name: "Da Nang Coastal Depot", location_city: "Da Nang", address: "45 Nguyen Tat Thanh, Hai Chau" },
  { id: 4, branch_code: "CTO-01", branch_name: "Can Tho Delta Yard", location_city: "Can Tho", address: "7 Tran Hung Dao, Ninh Kieu" },
];

export const vehicleTypes: VehicleType[] = [
  { id: 1, type_name: "Light Van", max_payload_kg: 1200, volumetric_limit_m3: 8, base_fuel_rate: 0.09 },
  { id: 2, type_name: "Box Truck 5T", max_payload_kg: 5000, volumetric_limit_m3: 26, base_fuel_rate: 0.18 },
  { id: 3, type_name: "Container Head", max_payload_kg: 24000, volumetric_limit_m3: 67, base_fuel_rate: 0.31 },
  { id: 4, type_name: "Refrigerated 3T", max_payload_kg: 3000, volumetric_limit_m3: 18, base_fuel_rate: 0.24 },
];

export const drivers: Driver[] = [
  { id: 1, user_id: 2, name: "Minh Pham", branch_id: 1, license_number: "FC-882140", active_service_hours: 5.5, status: "On Trip", phone: "+84 903 771 654" },
  { id: 2, user_id: 12, name: "Hoang Le", branch_id: 1, license_number: "FC-771002", active_service_hours: 2.0, status: "Available", phone: "+84 902 118 776" },
  { id: 3, user_id: 13, name: "Duc Nguyen", branch_id: 2, license_number: "FC-990233", active_service_hours: 7.5, status: "On Trip", phone: "+84 905 664 201" },
  { id: 4, user_id: 14, name: "Tuan Vo", branch_id: 3, license_number: "FC-334871", active_service_hours: 0, status: "Available", phone: "+84 907 550 118" },
  { id: 5, user_id: 15, name: "Bao Tran", branch_id: 2, license_number: "FC-556219", active_service_hours: 9.0, status: "Off Duty", phone: "+84 909 223 887" },
  { id: 6, user_id: 16, name: "Khanh Do", branch_id: 4, license_number: "FC-118440", active_service_hours: 3.2, status: "Available", phone: "+84 906 771 330" },
];

export const vehicles: Vehicle[] = [
  { id: 1, license_plate: "51C-238.11", vehicle_type_id: 2, branch_id: 1, assigned_driver_id: 1, status: "On Trip", lat: 10.803, lng: 106.703, speed_kmh: 68, odometer_km: 148_220 },
  { id: 2, license_plate: "51C-771.04", vehicle_type_id: 1, branch_id: 1, assigned_driver_id: 2, status: "Available", lat: 10.732, lng: 106.72, speed_kmh: 0, odometer_km: 62_140 },
  { id: 3, license_plate: "29H-118.22", vehicle_type_id: 3, branch_id: 2, assigned_driver_id: 3, status: "On Trip", lat: 21.028, lng: 105.804, speed_kmh: 91, odometer_km: 311_890 },
  { id: 4, license_plate: "43A-990.77", vehicle_type_id: 4, branch_id: 3, assigned_driver_id: 4, status: "Available", lat: 16.054, lng: 108.202, speed_kmh: 0, odometer_km: 88_410 },
  { id: 5, license_plate: "29H-554.30", vehicle_type_id: 2, branch_id: 2, assigned_driver_id: null, status: "Maintenance", lat: 21.041, lng: 105.782, speed_kmh: 0, odometer_km: 204_775 },
  { id: 6, license_plate: "65B-220.19", vehicle_type_id: 1, branch_id: 4, assigned_driver_id: 6, status: "On Trip", lat: 10.045, lng: 105.746, speed_kmh: 54, odometer_km: 41_320 },
  { id: 7, license_plate: "51C-604.88", vehicle_type_id: 3, branch_id: 1, assigned_driver_id: null, status: "Available", lat: 10.762, lng: 106.66, speed_kmh: 0, odometer_km: 176_004 },
  { id: 8, license_plate: "43A-330.12", vehicle_type_id: 2, branch_id: 3, assigned_driver_id: null, status: "Offline", lat: 16.071, lng: 108.224, speed_kmh: 0, odometer_km: 133_902 },
];

export const customers: Customer[] = [
  { id: 1, user_id: 3, company_name: "Acme Industrial", tax_code: "0312445678", billing_address: "220 Le Loi, District 1, HCMC", credit_limit: 250_000_000 },
  { id: 2, user_id: 17, company_name: "Nova Retail Group", tax_code: "0108771223", billing_address: "5 Ba Trieu, Hoan Kiem, Hanoi", credit_limit: 400_000_000 },
];

export const orders: Order[] = [
  { id: 1, code: "ORD-24801", customer_id: 1, origin_branch_id: 1, pickup_address: "Saigon Central Hub, District 7", destination_address: "Bien Hoa Industrial Park, Dong Nai", total_weight_kg: 3200, total_volume_m3: 14.5, total_amount: 8_450_000, status: "In Transit", created_at: iso(320) },
  { id: 2, code: "ORD-24802", customer_id: 1, origin_branch_id: 1, pickup_address: "Saigon Central Hub, District 7", destination_address: "Long An Distribution Center", total_weight_kg: 850, total_volume_m3: 5.2, total_amount: 2_310_000, status: "Pending", created_at: iso(95) },
  { id: 3, code: "ORD-24803", customer_id: 2, origin_branch_id: 2, pickup_address: "Hanoi North Hub", destination_address: "Bac Ninh Electronics Zone", total_weight_kg: 18_400, total_volume_m3: 52, total_amount: 21_900_000, status: "In Transit", created_at: iso(410) },
  { id: 4, code: "ORD-24804", customer_id: 1, origin_branch_id: 3, pickup_address: "Da Nang Coastal Depot", destination_address: "Hue Cold Storage", total_weight_kg: 2100, total_volume_m3: 11, total_amount: 6_120_000, status: "Delivered", created_at: iso(2880) },
  { id: 5, code: "ORD-24805", customer_id: 2, origin_branch_id: 4, pickup_address: "Can Tho Delta Yard", destination_address: "Soc Trang Wholesale Market", total_weight_kg: 640, total_volume_m3: 4.1, total_amount: 1_780_000, status: "Assigned", created_at: iso(150) },
  { id: 6, code: "ORD-24806", customer_id: 1, origin_branch_id: 1, pickup_address: "Saigon Central Hub, District 7", destination_address: "Vung Tau Port Terminal", total_weight_kg: 5400, total_volume_m3: 22, total_amount: 11_240_000, status: "Delivered", created_at: iso(5760) },
];

export const cargoItems: CargoItem[] = [
  { id: 1, order_id: 1, item_name: "Steel fittings (palletized)", weight_kg: 2400, volume_m3: 9.5, is_fragile: false },
  { id: 2, order_id: 1, item_name: "Hydraulic valves", weight_kg: 800, volume_m3: 5.0, is_fragile: true },
  { id: 3, order_id: 2, item_name: "Packaging film rolls", weight_kg: 850, volume_m3: 5.2, is_fragile: false },
  { id: 4, order_id: 3, item_name: "PCB assemblies", weight_kg: 18_400, volume_m3: 52, is_fragile: true },
  { id: 5, order_id: 5, item_name: "Rice sacks 50kg", weight_kg: 640, volume_m3: 4.1, is_fragile: false },
];

export const trips: Trip[] = [
  {
    id: 1,
    code: "TRP-9001",
    order_id: 1,
    dispatcher_id: 1,
    vehicle_id: 1,
    driver_id: 1,
    distance_km: 42.6,
    calculated_fuel_cost: 640_000,
    status: "In Transit",
    started_at: iso(180),
    completed_at: null,
    checklist: [
      { id: "c1", label: "Pre-trip vehicle inspection", done: true },
      { id: "c2", label: "Cargo loaded & secured", done: true },
      { id: "c3", label: "Documents verified (BOL)", done: true },
      { id: "c4", label: "Arrived at delivery point", done: false },
      { id: "c5", label: "Proof of delivery captured", done: false },
    ],
  },
  {
    id: 2,
    code: "TRP-9002",
    order_id: 3,
    dispatcher_id: 1,
    vehicle_id: 3,
    driver_id: 3,
    distance_km: 38.2,
    calculated_fuel_cost: 880_000,
    status: "In Transit",
    started_at: iso(240),
    completed_at: null,
    checklist: [
      { id: "c1", label: "Pre-trip vehicle inspection", done: true },
      { id: "c2", label: "Cargo loaded & secured", done: true },
      { id: "c3", label: "Documents verified (BOL)", done: false },
      { id: "c4", label: "Arrived at delivery point", done: false },
      { id: "c5", label: "Proof of delivery captured", done: false },
    ],
  },
  {
    id: 3,
    code: "TRP-9003",
    order_id: 5,
    dispatcher_id: 1,
    vehicle_id: 6,
    driver_id: 6,
    distance_km: 61.4,
    calculated_fuel_cost: 410_000,
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
  },
  {
    id: 4,
    code: "TRP-8990",
    order_id: 4,
    dispatcher_id: 1,
    vehicle_id: 4,
    driver_id: 4,
    distance_km: 104.9,
    calculated_fuel_cost: 1_240_000,
    status: "Completed",
    started_at: iso(2800),
    completed_at: iso(2600),
    checklist: [
      { id: "c1", label: "Pre-trip vehicle inspection", done: true },
      { id: "c2", label: "Cargo loaded & secured", done: true },
      { id: "c3", label: "Documents verified (BOL)", done: true },
      { id: "c4", label: "Arrived at delivery point", done: true },
      { id: "c5", label: "Proof of delivery captured", done: true },
    ],
  },
];

export const telemetry: TelemetryRecord[] = Array.from({ length: 60 }, (_, i) => {
  const vehicle = vehicles[i % vehicles.length]!;
  return {
    id: i + 1,
    trip_id: null,
    vehicle_id: vehicle.id,
    latitude: vehicle.lat + (Math.sin(i) * 0.01),
    longitude: vehicle.lng + (Math.cos(i) * 0.01),
    calculated_velocity: Math.max(0, Math.round(vehicle.speed_kmh + Math.sin(i * 1.7) * 22)),
    recorded_at: iso(i * 3),
  };
});

export const alerts: FleetAlert[] = [
  { id: 1, vehicle_id: 3, trip_id: 2, alert_type: "Overspeed", severity: "critical", description: "91 km/h in an 80 km/h corridor (QL1A, Bac Ninh)", created_at: iso(4), acknowledged: false },
  { id: 2, vehicle_id: 1, trip_id: 1, alert_type: "Geofence Breach", severity: "warning", description: "Exited Saigon delivery geofence by 1.8 km", created_at: iso(11), acknowledged: false },
  { id: 3, vehicle_id: 6, trip_id: 3, alert_type: "Harsh Braking", severity: "warning", description: "Deceleration 7.2 m/s² detected near Can Tho bridge", created_at: iso(26), acknowledged: false },
  { id: 4, vehicle_id: 2, trip_id: null, alert_type: "Idle Timeout", severity: "info", description: "Engine idling 24 minutes at hub bay 3", created_at: iso(48), acknowledged: true },
  { id: 5, vehicle_id: 5, trip_id: null, alert_type: "Low Fuel", severity: "warning", description: "Fuel level below 12% — unit in maintenance bay", created_at: iso(75), acknowledged: false },
];

export const incidents: TripIncident[] = [
  { id: 1, trip_id: 4, incident_type: "Minor collision", has_damage: true, damage_description: "Rear bumper scuff at loading dock", action_taken: "Reported to branch manager; photos filed", reported_at: iso(2650) },
  { id: 2, trip_id: 1, incident_type: "Traffic delay", has_damage: false, damage_description: "", action_taken: "Rerouted via CT01 expressway", reported_at: iso(120) },
];

export const maintenance: MaintenanceRecord[] = [
  { id: 1, vehicle_id: 5, servicing_type: "Gearbox overhaul", cost: 18_400_000, description: "Clutch plate replacement + fluid flush", started_at: iso(1440), completed_at: null },
  { id: 2, vehicle_id: 8, servicing_type: "Telematics unit swap", cost: 3_200_000, description: "GPS module unresponsive, unit offline", started_at: iso(2880), completed_at: null },
  { id: 3, vehicle_id: 1, servicing_type: "Routine 10k service", cost: 4_100_000, description: "Oil, filters, brake inspection", started_at: iso(20_160), completed_at: iso(20_000) },
];

export const invoices: Invoice[] = [
  { id: 1, order_id: 4, base_tariff: 4_200_000, distance_surcharge: 1_620_000, surge_multiplier: 1.05, total_amount: 6_120_000, payment_status: "Paid", issued_at: iso(2600) },
  { id: 2, order_id: 6, base_tariff: 8_100_000, distance_surcharge: 2_640_000, surge_multiplier: 1.05, total_amount: 11_240_000, payment_status: "Unpaid", issued_at: iso(5600) },
  { id: 3, order_id: 1, base_tariff: 6_050_000, distance_surcharge: 2_100_000, surge_multiplier: 1.04, total_amount: 8_450_000, payment_status: "Unpaid", issued_at: iso(300) },
];

export const notifications: Notification[] = [
  { id: 1, user_id: 3, notification_type: "Email", message: "Order ORD-24801 is in transit — ETA 14:40", is_read: false, sent_at: iso(60) },
  { id: 2, user_id: 3, notification_type: "SMS", message: "Invoice INV-0003 issued for ORD-24801", is_read: false, sent_at: iso(290) },
  { id: 3, user_id: 2, notification_type: "System", message: "Trip TRP-9001 assigned to you", is_read: true, sent_at: iso(185) },
];
