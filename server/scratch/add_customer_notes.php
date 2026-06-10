<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../app/core/Database.php';

$db = new Database();

$sql = "
CREATE TABLE IF NOT EXISTS customer_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    note_no VARCHAR(30) UNIQUE NOT NULL,
    type ENUM('Credit Note', 'Debit Note') NOT NULL,
    customer_id INT NOT NULL,
    location_id INT DEFAULT 1,
    date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    reason VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
";

try {
    $db->query($sql);
    $db->execute();
    echo "Table 'customer_notes' created successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
