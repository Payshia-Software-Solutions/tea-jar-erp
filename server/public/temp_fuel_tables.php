<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../app/core/Database.php';

$db = new Database();

$queries = [
    "CREATE TABLE IF NOT EXISTS `fleet_fuel_stations` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `name` varchar(255) NOT NULL,
        `type` enum('outside_shed', 'factory_pump') NOT NULL,
        `status` enum('active', 'inactive') DEFAULT 'active',
        `created_at` timestamp DEFAULT current_timestamp(),
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    "CREATE TABLE IF NOT EXISTS `fleet_fuel_types` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `name` varchar(255) NOT NULL,
        `price_per_liter` decimal(10,2) NOT NULL DEFAULT '0.00',
        `created_at` timestamp DEFAULT current_timestamp(),
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    "CREATE TABLE IF NOT EXISTS `fleet_fuel_orders` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `vehicle_id` int(11) NOT NULL,
        `driver_id` int(11) DEFAULT NULL,
        `fuel_station_id` int(11) NOT NULL,
        `fuel_type_id` int(11) NOT NULL,
        `liters` decimal(10,2) NOT NULL,
        `price_per_liter` decimal(10,2) NOT NULL,
        `total_cost` decimal(10,2) NOT NULL,
        `mileage` int(11) NOT NULL,
        `status` enum('completed', 'cancelled') DEFAULT 'completed',
        `created_by` int(11) DEFAULT NULL,
        `created_at` timestamp DEFAULT current_timestamp(),
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
];

foreach ($queries as $query) {
    try {
        $db->rawQuery($query);
        echo "Successfully executed query.\n";
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
echo "Done.\n";
