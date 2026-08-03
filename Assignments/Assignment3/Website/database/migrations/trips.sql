CREATE TABLE IF NOT EXISTS trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    coordinator_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    vehicle_type_id INT NOT NULL,
    driver_id INT NOT NULL,
    branch_id INT NOT NULL,
    rescue_trip_id INT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'IN_TRANSIT', 'COMPLETED', 'INCIDENT_HALT'
    distance_km DECIMAL(10,2) DEFAULT 0.00,
    calculated_fuel_cost DECIMAL(10,2) DEFAULT 0.00,
    lock_version INT NOT NULL DEFAULT 1,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    CONSTRAINT fk_trips_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
    CONSTRAINT fk_trips_coordinator FOREIGN KEY (coordinator_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_trips_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_trips_vehicle_type FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_trips_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_trips_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_trips_rescue FOREIGN KEY (rescue_trip_id) REFERENCES trips(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;