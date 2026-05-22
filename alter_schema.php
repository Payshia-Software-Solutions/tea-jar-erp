<?php
require_once __DIR__ . '/server/config/config.php';

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME;
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $queries = [
        "ALTER TABLE vehicles ADD COLUMN service_interval_mileage INT DEFAULT NULL",
        "ALTER TABLE vehicles ADD COLUMN next_service_mileage INT DEFAULT NULL",
        "ALTER TABLE vehicles ADD COLUMN next_service_date DATE DEFAULT NULL",
        "ALTER TABLE repair_orders ADD COLUMN job_type ENUM('Repair', 'Service Booking') NOT NULL DEFAULT 'Repair'",
        "ALTER TABLE repair_orders ADD COLUMN booking_date DATETIME DEFAULT NULL"
    ];

    foreach ($queries as $query) {
        try {
            $pdo->exec($query);
            echo "Successfully executed: $query\n";
        } catch (PDOException $e) {
            echo "Error executing '$query': " . $e->getMessage() . "\n";
        }
    }
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
}
