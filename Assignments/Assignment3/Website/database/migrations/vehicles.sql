-- Migration: Create vehicles table
-- Path: database/migrations/vehicles.sql

CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type_id INT NOT NULL,
    branch_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Available',
    lock_version INT DEFAULT 1,
    CONSTRAINT fk_vehicles_type FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_vehicles_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT
);