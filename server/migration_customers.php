<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/app/core/Database.php';

try {
    $db = new Database();

    echo "Creating routes table...\n";
    $db->query("
        CREATE TABLE IF NOT EXISTS `routes` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `location_id` int(11) NOT NULL,
            `name` varchar(100) NOT NULL,
            `description` text DEFAULT NULL,
            `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
            `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
            PRIMARY KEY (`id`),
            CONSTRAINT `fk_routes_location` FOREIGN KEY (`location_id`) REFERENCES `service_locations` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");
    $db->execute();
    echo "Routes table created successfully.\n";

    echo "Altering customers table...\n";
    
    // Check if columns already exist to avoid errors
    $db->query("SHOW COLUMNS FROM `customers` LIKE 'latitude'");
    $hasLatitude = $db->single();
    
    if (!$hasLatitude) {
        $db->query("
            ALTER TABLE `customers`
            ADD COLUMN `latitude` DECIMAL(10,8) DEFAULT NULL,
            ADD COLUMN `longitude` DECIMAL(11,8) DEFAULT NULL,
            ADD COLUMN `photo_url` varchar(255) DEFAULT NULL,
            ADD COLUMN `qr_code_hash` varchar(100) DEFAULT NULL,
            ADD COLUMN `route_id` int(11) DEFAULT NULL,
            ADD CONSTRAINT `fk_customers_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE SET NULL;
        ");
        $db->execute();
        echo "Customers table altered successfully.\n";
    } else {
        echo "Customers table already has the new columns.\n";
    }

    echo "Migration completed.\n";

} catch (Exception $e) {
    echo "Error during migration: " . $e->getMessage() . "\n";
}
