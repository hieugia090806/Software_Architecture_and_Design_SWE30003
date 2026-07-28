DROP TABLE IF EXISTS orders;

CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,          -- Khóa ngoại liên kết tới bảng customers
    origin_branch_id INT NOT NULL,     -- Khóa ngoại: Chi nhánh gửi
    destination_branch_id INT NOT NULL,-- Khóa ngoại: Chi nhánh nhận
    order_status VARCHAR(50) DEFAULT 'PENDING',
    total_weight DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (origin_branch_id) REFERENCES branches(branch_id),
    FOREIGN KEY (destination_branch_id) REFERENCES branches(branch_id)
);