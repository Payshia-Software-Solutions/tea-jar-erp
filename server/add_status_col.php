<?php
try {
    $db = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec("ALTER TABLE vehicles ADD COLUMN mileage_sync_status VARCHAR(20) NULL DEFAULT 'pending'");
    echo "Column added successfully.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
