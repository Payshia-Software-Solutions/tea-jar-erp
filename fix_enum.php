<?php
require_once __DIR__ . '/server/config/config.php';

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME;
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $query = "ALTER TABLE service_locations MODIFY COLUMN location_type ENUM('service','warehouse','fleet','sales','factory','hq') NOT NULL DEFAULT 'service'";
    
    $pdo->exec($query);
    echo "Success: Expanded ENUM for location_type.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
