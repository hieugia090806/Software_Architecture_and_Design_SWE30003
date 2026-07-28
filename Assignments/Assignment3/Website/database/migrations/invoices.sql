DROP TABLE IF EXISTS invoices;

CREATE TABLE invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL, -- Khóa ngoại liên kết tới bảng orders
    total_amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'UNPAID', -- Các trạng thái: UNPAID, PAID, CANCELLED
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);