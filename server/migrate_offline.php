<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/app/core/Database.php';

try {
    $db = new Database();
    $pdo = $db->getDb();

    // Add columns to invoices
    try {
        $pdo->exec("ALTER TABLE invoices ADD COLUMN offline_id VARCHAR(100) NULL");
        echo "offline_id added to invoices.\n";
    } catch (Exception $e) {
        echo "offline_id might already exist in invoices: " . $e->getMessage() . "\n";
    }

    try {
        $pdo->exec("ALTER TABLE invoices ADD COLUMN device_id VARCHAR(100) NULL");
        echo "device_id added to invoices.\n";
    } catch (Exception $e) {
        echo "device_id might already exist in invoices: " . $e->getMessage() . "\n";
    }

    // Add column to customer_visits
    try {
        $pdo->exec("ALTER TABLE customer_visits ADD COLUMN device_id VARCHAR(100) NULL");
        echo "device_id added to customer_visits.\n";
    } catch (Exception $e) {
        echo "device_id might already exist in customer_visits: " . $e->getMessage() . "\n";
    }
    
    echo "Migration complete.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
