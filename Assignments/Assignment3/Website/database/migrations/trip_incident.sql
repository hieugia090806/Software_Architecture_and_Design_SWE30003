CREATE TABLE IF NOT EXISTS trip_incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    incident_type VARCHAR(50) NOT NULL, -- e.g., 'ACCIDENT', 'ENGINE_FAILURE', 'FLAT_TIRE'
    has_damage BOOLEAN NOT NULL DEFAULT FALSE,
    damage_description TEXT NULL,
    action_taken TEXT NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_incidents_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;