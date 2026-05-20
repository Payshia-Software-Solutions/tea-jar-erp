<?php
require_once 'config/config.php';
require_once 'app/core/Database.php';

try {
    $db = new Database();
    
    $sql = "CREATE TABLE IF NOT EXISTS printer_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        location_id INT NULL,
        printer_type VARCHAR(50), 
        printer_name VARCHAR(255),
        paper_width VARCHAR(20) DEFAULT '80mm',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    
    $db->exec($sql);
    echo "Table printer_settings created successfully\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
