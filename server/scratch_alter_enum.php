<?php
require_once 'server/config/config.php';
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->exec("ALTER TABLE service_locations MODIFY location_type VARCHAR(50) NOT NULL DEFAULT 'service'");
    echo "Column modified successfully.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
