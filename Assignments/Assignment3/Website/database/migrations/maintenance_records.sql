DROP TABLE IF EXISTS maintenance_records;

CREATE TABLE maintenance_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL, -- Khóa ngoại liên kết tới bảng vehicles
    description TEXT NOT NULL,
    cost DECIMAL(12,2),
    maintenance_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS', -- Trạng thái: IN_PROGRESS, COMPLETED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
);