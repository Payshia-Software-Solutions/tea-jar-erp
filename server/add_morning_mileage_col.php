<?php
try {
    $db = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check if column exists first
    $stmt = $db->query("SHOW COLUMNS FROM vehicles LIKE 'morning_mileage'");
    if ($stmt->rowCount() == 0) {
        $db->exec("ALTER TABLE vehicles ADD COLUMN morning_mileage INT DEFAULT 0 AFTER current_mileage");
        echo "Column 'morning_mileage' added successfully.\n";
    } else {
        echo "Column 'morning_mileage' already exists.\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
