<?php
/**
 * KioskSchema
 * Lightweight auto-migrations for Kiosk tables.
 */
class KioskSchema {
    private static $done = false;

    private static function pdo() {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    }

    public static function ensure($force = false) {
        if (self::$done && !$force) return;
        self::$done = true;

        try {
            $pdo = self::pdo();

            // 1. kiosk_bookings
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `kiosk_bookings` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `booking_no` varchar(20) NOT NULL,
                  `room_number` varchar(50) NOT NULL,
                  `guest_name` varchar(100) NOT NULL,
                  `experience_id` int(11) NOT NULL,
                  `pax_count` int(11) NOT NULL DEFAULT 1,
                  `preferred_date_time` datetime DEFAULT NULL,
                  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
                  `status` enum('Pending','Confirmed','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
                  `notes` text DEFAULT NULL,
                  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                  PRIMARY KEY (`id`),
                  UNIQUE KEY `booking_no` (`booking_no`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            ");

            // 2. kiosk_orders
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `kiosk_orders` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `order_no` varchar(20) NOT NULL,
                  `room_number` varchar(50) NOT NULL,
                  `guest_name` varchar(100) NOT NULL,
                  `phone_number` varchar(50) DEFAULT NULL,
                  `special_instructions` text DEFAULT NULL,
                  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
                  `status` enum('Pending','Preparing','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
                  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                  PRIMARY KEY (`id`),
                  UNIQUE KEY `order_no` (`order_no`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            ");

            // 3. kiosk_order_items
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `kiosk_order_items` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `kiosk_order_id` int(11) NOT NULL,
                  `product_id` int(11) NOT NULL,
                  `quantity` int(11) NOT NULL DEFAULT 1,
                  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
                  PRIMARY KEY (`id`),
                  KEY `kiosk_order_id` (`kiosk_order_id`),
                  CONSTRAINT `kiosk_order_items_ibfk_1` FOREIGN KEY (`kiosk_order_id`) REFERENCES `kiosk_orders` (`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            ");

            // 4. kiosk_contents
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `kiosk_contents` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `part_id` int(11) DEFAULT NULL,
                  `title` varchar(255) DEFAULT NULL,
                  `content_html` text DEFAULT NULL,
                  `video_url` varchar(500) DEFAULT NULL,
                  `created_by` int(11) DEFAULT NULL,
                  `updated_by` int(11) DEFAULT NULL,
                  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                  PRIMARY KEY (`id`),
                  KEY `part_id` (`part_id`),
                  CONSTRAINT `kiosk_contents_ibfk_1` FOREIGN KEY (`part_id`) REFERENCES `parts` (`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            ");

        } catch (Throwable $e) {
            error_log("KioskSchema Auto-migration failed: " . $e->getMessage());
        }
    }
}
