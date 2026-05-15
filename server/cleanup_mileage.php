<?php
try {
    $db = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
    $db->exec("ALTER TABLE vehicles DROP COLUMN IF EXISTS current_mileage");
    $db->exec("ALTER TABLE vehicles DROP COLUMN IF EXISTS mileage_last_synced_at");
    echo "Redundant columns cleaned up.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
