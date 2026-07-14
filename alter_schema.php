<?php
require_once __DIR__ . '/server/config/config.php';

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME;
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $queries = [
        "ALTER TABLE parts ADD COLUMN kiosk_module ENUM('None', 'Dining', 'Experience') NOT NULL DEFAULT 'None'",
        "CREATE TABLE IF NOT EXISTS kiosk_bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_no VARCHAR(20) NOT NULL UNIQUE,
            room_number VARCHAR(50) NOT NULL,
            guest_name VARCHAR(100) NOT NULL,
            experience_id INT NOT NULL,
            pax_count INT NOT NULL DEFAULT 1,
            preferred_date_time DATETIME DEFAULT NULL,
            total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS kiosk_orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_no VARCHAR(20) NOT NULL UNIQUE,
            room_number VARCHAR(50) NOT NULL,
            guest_name VARCHAR(100) NOT NULL,
            phone_number VARCHAR(50) DEFAULT NULL,
            special_instructions TEXT,
            total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            status ENUM('Pending', 'Preparing', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS kiosk_order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            kiosk_order_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            FOREIGN KEY (kiosk_order_id) REFERENCES kiosk_orders(id) ON DELETE CASCADE
        )"
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
