DROP TABLE IF EXISTS branches;

CREATE TABLE branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_code VARCHAR(20) NOT NULL UNIQUE,
    branch_name VARCHAR(100) NOT NULL,
    location_city VARCHAR(50) NOT NULL
);