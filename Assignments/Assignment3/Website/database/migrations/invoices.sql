DROP TABLE IF EXISTS invoices;

CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    base_tariff DECIMAL(12,2) NOT NULL,
    distance_surcharge DECIMAL(12,2) NOT NULL,
    surge_multiplier DECIMAL(4,2) DEFAULT 1.00,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id)
);