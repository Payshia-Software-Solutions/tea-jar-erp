<?php
$pdo = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
$sql = "CREATE TABLE IF NOT EXISTS sales_targets (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    location_id INT(11) NOT NULL,
    collection_id INT(11) NULL,
    target_month VARCHAR(7) NOT NULL,
    target_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY loc_col_month (location_id, collection_id, target_month)
)";
$pdo->exec($sql);
echo "Table created successfully.";
