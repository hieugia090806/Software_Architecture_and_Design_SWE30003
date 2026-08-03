<<<<<<< HEAD
DROP TABLE IF EXISTS maintenance_records;

CREATE TABLE maintenance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    servicing_type VARCHAR(100) NOT NULL,
    cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);
=======
CREATE TABLE IF NOT EXISTS maintenance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    servicing_type VARCHAR(50) NOT NULL, -- e.g., 'OIL_CHANGE', 'TIRE_REPLACEMENT', 'ENGINE_REPAIR'
    cost DECIMAL(12,2) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NULL,
    CONSTRAINT fk_maintenance_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
>>>>>>> origin/main
