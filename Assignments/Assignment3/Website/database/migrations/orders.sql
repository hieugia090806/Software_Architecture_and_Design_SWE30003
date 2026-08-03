<<<<<<< HEAD
DROP TABLE IF EXISTS orders;

CREATE TABLE orders (
=======
CREATE TABLE IF NOT EXISTS orders (
>>>>>>> origin/main
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    origin_branch_id INT NOT NULL,
    destination_address TEXT NOT NULL,
<<<<<<< HEAD
    cargo_weight_kg DOUBLE NOT NULL,
    cargo_volume_m3 DOUBLE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (origin_branch_id) REFERENCES branches(id)
);
=======
    cargo_weight_kg DECIMAL(10,2) NOT NULL,
    cargo_volume_m3 DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_branch FOREIGN KEY (origin_branch_id) REFERENCES branches(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
>>>>>>> origin/main
