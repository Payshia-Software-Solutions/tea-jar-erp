<?php
try {
    $db = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
    $db->exec("ALTER TABLE vehicle_documents ADD COLUMN status ENUM('Active', 'Archived') DEFAULT 'Active' AFTER expiry_date");
    echo "Status column added successfully to vehicle_documents.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
