-- Migration: Create drivers table
-- Path: database/migrations/driver.sql

CREATE TABLE IF NOT EXISTS drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    branch_id INT NOT NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    active_service_hours DECIMAL(4, 2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'Ready',
    CONSTRAINT fk_drivers_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_drivers_branches FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT
);