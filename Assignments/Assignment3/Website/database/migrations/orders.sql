DROP TABLE IF EXISTS orders;

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    origin_branch_id INT NOT NULL,
    destination_address TEXT NOT NULL,
    cargo_weight_kg DOUBLE NOT NULL,
    cargo_volume_m3 DOUBLE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (origin_branch_id) REFERENCES branches(id)
);