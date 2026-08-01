CREATE TABLE IF NOT EXISTS vehicle_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL,
    max_payload_kg DECIMAL(10,2) NOT NULL,
    volumetric_limit_m3 DECIMAL(10,2) NOT NULL,
    base_fuel_rate DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;