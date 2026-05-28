<?php
/**
 * HotelSchema - Database structure for front office
 */
class HotelSchema {
    private static $done = false;

    public static function ensure($force = false) {
        if (!$force && !defined('FORCE_MIGRATIONS')) return;
        if (self::$done) return;
        self::$done = true;

        $db = new Database();

        // 1. Room Types
        $db->query("
            CREATE TABLE IF NOT EXISTS hotel_room_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                item_id INT DEFAULT NULL,
                description TEXT,
                base_rate DECIMAL(15,2) DEFAULT 0.00,
                max_occupancy INT DEFAULT 2,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();

        try {
            $db->query("SELECT item_id FROM hotel_room_types LIMIT 1");
            $db->execute();
        } catch (Exception $e) {
            $db->query("ALTER TABLE hotel_room_types ADD COLUMN item_id INT DEFAULT NULL AFTER name");
            $db->execute();
        }

        // 2. Rooms
        $db->query("
            CREATE TABLE IF NOT EXISTS hotel_rooms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_number VARCHAR(20) NOT NULL UNIQUE,
                type_id INT NOT NULL,
                location_id INT DEFAULT 1,
                status ENUM('Available', 'Occupied', 'Dirty', 'Maintenance') DEFAULT 'Available',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (type_id) REFERENCES hotel_room_types(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();

        // 3. Reservations
        $db->query("
            CREATE TABLE IF NOT EXISTS hotel_reservations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                reservation_no VARCHAR(50) UNIQUE,
                customer_id INT NOT NULL,
                room_id INT NOT NULL,
                check_in DATETIME NOT NULL,
                check_out DATETIME NOT NULL,
                adults INT DEFAULT 1,
                children INT DEFAULT 0,
                status ENUM('Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled') DEFAULT 'Pending',
                meal_plan ENUM('RO', 'BB', 'HB', 'FB', 'AI') DEFAULT 'BB',
                total_amount DECIMAL(15,2) DEFAULT 0.00,
                paid_amount DECIMAL(15,2) DEFAULT 0.00,
                invoice_id INT DEFAULT NULL,
                notes TEXT,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id),
                FOREIGN KEY (room_id) REFERENCES hotel_rooms(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();

        // 4. Migration for existing tables
        try {
            $db->query("SELECT meal_plan FROM hotel_reservations LIMIT 1");
            $db->execute();
        } catch (Exception $e) {
            $db->query("ALTER TABLE hotel_reservations ADD COLUMN meal_plan ENUM('RO', 'BB', 'HB', 'FB', 'AI') DEFAULT 'BB' AFTER status");
            $db->execute();
            
            // Also update status enum while we are at it
            $db->query("ALTER TABLE hotel_reservations MODIFY COLUMN status ENUM('Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled') DEFAULT 'Pending'");
            $db->execute();
        }

        // 5. Add reservation_id to invoices
        try {
            $db->query("SELECT reservation_id FROM invoices LIMIT 1");
            $db->execute();
        } catch (Exception $e) {
            $db->query("ALTER TABLE invoices ADD COLUMN reservation_id INT DEFAULT NULL AFTER online_order_id");
            $db->execute();
        }

        // 5. Reservation Items (Extra charges like food, laundry, etc.)
        $db->query("
            CREATE TABLE IF NOT EXISTS hotel_reservation_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                reservation_id INT NOT NULL,
                item_id INT DEFAULT NULL,
                description VARCHAR(255) NOT NULL,
                quantity DECIMAL(15,2) DEFAULT 1.00,
                unit_price DECIMAL(15,2) DEFAULT 0.00,
                total_price DECIMAL(15,2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (reservation_id) REFERENCES hotel_reservations(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();

        try {
            $db->query("SELECT item_id FROM hotel_reservation_items LIMIT 1");
            $db->execute();
        } catch (Exception $e) {
            $db->query("ALTER TABLE hotel_reservation_items ADD COLUMN item_id INT DEFAULT NULL AFTER reservation_id");
            $db->execute();
        }
        // 5. Room Rates (Meal Plan Matrix)
        $db->query("
            CREATE TABLE IF NOT EXISTS hotel_room_rates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type_id INT NOT NULL,
                meal_plan ENUM('RO', 'BB', 'HB', 'FB', 'AI') NOT NULL,
                rate DECIMAL(15,2) DEFAULT 0.00,
                UNIQUE KEY type_meal (type_id, meal_plan),
                FOREIGN KEY (type_id) REFERENCES hotel_room_types(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();
    }
}
