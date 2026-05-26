<?php
require 'c:/xampp/htdocs/rapair-management/server/config/config.php';
require 'c:/xampp/htdocs/rapair-management/server/app/core/Database.php';

$db = new Database();
$db->exec('CREATE TABLE IF NOT EXISTS customer_visits (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    customer_id INT NOT NULL, 
    user_id INT NOT NULL, 
    visit_type VARCHAR(50) NOT NULL, 
    reason VARCHAR(255) NULL, 
    latitude DECIMAL(10,8) NULL, 
    longitude DECIMAL(11,8) NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);');
echo "Table created successfully\n";
