-- Step 4 Demo Execution Seed Data

-- 1. Insert Users (Admin, Dispatcher, Driver)
INSERT INTO users (id, username, password_hash, role) VALUES
(1, 'admin_user', '$2b$10$e83/hash_admin', 'ADMIN'),
(2, 'dispatcher_john', '$2b$10$e83/hash_dispatcher', 'DISPATCHER'),
(3, 'driver_alex', '$2b$10$e83/hash_driver1', 'DRIVER'),
(4, 'driver_bob', '$2b$10$e83/hash_driver2', 'DRIVER');

-- 2. Insert Branches
INSERT INTO branches (id, branch_code, branch_name, location_city) VALUES
(1, 'HCM-HUB', 'Ho Chi Minh Central Hub', 'Ho Chi Minh City'),
(2, 'DAN-HUB', 'Da Nang Regional Station', 'Da Nang');

-- 3. Insert Vehicle Types
INSERT INTO vehicle_types (id, type_name, max_payload_kg, volumetric_limit_m3, base_fuel_rate) VALUES
(1, '10-Ton Truck', 10000.00, 30.00, 12.50),
(2, '5-Ton Van', 5000.00, 15.00, 8.00);

-- 4. Insert Drivers
INSERT INTO drivers (id, user_id, branch_id, license_number, active_service_hours, status) VALUES
(1, 3, 1, 'LIC-HCM-88219', 120, 'AVAILABLE'),
(2, 4, 1, 'LIC-HCM-99401', 85, 'AVAILABLE');

-- 5. Insert Vehicles
INSERT INTO vehicles (id, license_plate, branch_id, vehicle_type_id, assigned_driver_id, status) VALUES
(1, '51D-998.23', 1, 1, 1, 'AVAILABLE'),
(2, '51D-112.44', 1, 2, 2, 'AVAILABLE');

-- 6. Insert Customers
INSERT INTO customers (id, company_name, billing_address, contact_email) VALUES
(1, 'Global Freight Logistics Ltd.', '123 Harbor Ave, District 4, Ho Chi Minh City', 'billing@globalfreight.com');

-- 7. Insert Orders (Setup Step 2)
INSERT INTO orders (id, customer_id, origin_branch_id, destination_address, cargo_weight_kg, cargo_volume_m3, status) VALUES
(1, 1, 1, '45 Industrial Zone 2, Bien Hoa, Dong Nai', 8500.00, 24.50, 'PENDING');

-- 8. Insert Trip (Dispatch Step 3 - lock_version starts at 1)
INSERT INTO trips (id, order_id, coordinator_id, vehicle_id, vehicle_type_id, driver_id, branch_id, rescue_trip_id, status, distance_km, calculated_fuel_cost, lock_version, started_at) VALUES
(1, 1, 2, 1, 1, 1, 1, NULL, 'IN_TRANSIT', 120.00, 1500.00, 1, CURRENT_TIMESTAMP);

-- Update Vehicle & Order Status for Active Dispatch
UPDATE vehicles SET status = 'EN_ROUTE' WHERE id = 1;
UPDATE orders SET status = 'IN_TRANSIT' WHERE id = 1;

-- 9. Insert Telemetry Streams (Step 4)
INSERT INTO tracking_telemetry (trip_id, latitude, longitude, calculated_velocity, recorded_at) VALUES
(1, 10.776889, 106.700806, 45.50, NOW() - INTERVAL 10 MINUTE),
(1, 10.823099, 106.801000, 52.00, NOW() - INTERVAL 5 MINUTE),
(1, 10.890000, 106.900000, 48.00, NOW());

-- 10. Insert Incident & Alert (Step 5 - Incident Handling Showcase)
INSERT INTO trip_incidents (id, trip_id, incident_type, has_damage, damage_description, action_taken, reported_at) VALUES
(1, 1, 'ENGINE_FAILURE', TRUE, 'Engine overheated due to coolant leak', 'Cargo standby for rescue dispatch', CURRENT_TIMESTAMP);

INSERT INTO alerts (id, vehicle_id, trip_id, alert_type, description, created_at) VALUES
(1, 1, 1, 'CRITICAL_INCIDENT', 'Engine overheat reported during Trip #1', CURRENT_TIMESTAMP);

-- 11. Complete Trip (Step 6)
UPDATE trips SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP WHERE id = 1;
UPDATE vehicles SET status = 'AVAILABLE' WHERE id = 1;
UPDATE orders SET status = 'DELIVERED' WHERE id = 1;

-- 12. Insert Invoices & Payment Transactions (Step 7)
-- Formula: (base_tariff [500000] + distance_surcharge [1200000]) * surge_multiplier [1.10] = 1870000.00
INSERT INTO invoices (id, order_id, base_tariff, distance_surcharge, surge_multiplier, total_amount, payment_status, issued_at) VALUES
(1, 1, 500000.00, 1200000.00, 1.10, 1870000.00, 'PAID', CURRENT_TIMESTAMP);

INSERT INTO payment_transactions (id, invoice_id, transaction_reference, amount_paid, transaction_status, processed_at) VALUES
(1, 1, 'TXN-SIM-2026-0801-9921', 1870000.00, 'SIMULATED_SUCCESS', CURRENT_TIMESTAMP);