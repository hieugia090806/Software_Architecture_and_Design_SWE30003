-- Migration: Create trips table
-- Path: database/migrations/trips.sql

CREATE TABLE IF NOT EXISTS trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    coordinator_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    rescue_trip_id INT NULL,
    assigned_driver_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    distance_km DECIMAL(10, 2) DEFAULT 0.00,
    calculated_fuel_cost DECIMAL(12, 2) DEFAULT 0.00,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    CONSTRAINT fk_trips_orders FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_trips_coordinators FOREIGN KEY (coordinator_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_trips_vehicles FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_trips_rescue_trips FOREIGN KEY (rescue_trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    CONSTRAINT fk_trips_drivers FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id) ON DELETE RESTRICT
);