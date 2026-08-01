CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    transaction_reference VARCHAR(100) NOT NULL UNIQUE,
    amount_paid DECIMAL(12,2) NOT NULL,
    transaction_status VARCHAR(20) NOT NULL, -- e.g., 'SIMULATED_SUCCESS', 'FAILED'
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;