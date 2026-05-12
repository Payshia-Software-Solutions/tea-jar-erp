<?php
/**
 * OnlineOrderSchema
 * Manages database schema for Online Orders.
 */
class OnlineOrderSchema {
    public static function ensure() {
        $db = new Database();

        // 1. online_orders table
        $db->query("
            CREATE TABLE IF NOT EXISTS online_orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_no VARCHAR(50) NOT NULL UNIQUE,
                location_id INT NOT NULL DEFAULT 1,
                customer_id INT NULL,
                customer_details_json TEXT NULL,
                shipping_address TEXT NULL,
                billing_address TEXT NULL,
                shipping_fee DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                shipping_zone_id INT NULL,
                district_id INT NULL,
                total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                payment_method VARCHAR(20) NOT NULL DEFAULT 'COD',
                payment_status ENUM('Pending', 'Paid', 'Failed') NOT NULL DEFAULT 'Pending',
                order_status ENUM('Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
                payhere_id VARCHAR(100) NULL,
                invoice_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (location_id) REFERENCES service_locations(id),
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
                FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();

        // 2. online_order_items table
        $db->query("
            CREATE TABLE IF NOT EXISTS online_order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                item_id INT NOT NULL,
                description VARCHAR(255) NULL,
                quantity DECIMAL(15,4) NOT NULL DEFAULT 1.0000,
                unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                line_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                FOREIGN KEY (order_id) REFERENCES online_orders(id) ON DELETE CASCADE,
                FOREIGN KEY (item_id) REFERENCES parts(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();

        // Migration: Add missing columns and fix payment_method type
        $db->query("ALTER TABLE online_orders MODIFY COLUMN payment_method VARCHAR(20) NOT NULL DEFAULT 'COD'");
        $db->execute();
        
        try {
            $db->query("ALTER TABLE online_orders ADD COLUMN shipping_fee DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER billing_address");
            $db->execute();
        } catch (Exception $e) {}

        try {
            $db->query("ALTER TABLE online_orders ADD COLUMN shipping_zone_id INT NULL AFTER shipping_fee");
            $db->execute();
        } catch (Exception $e) {}

        try {
            $db->query("ALTER TABLE online_orders ADD COLUMN district_id INT NULL AFTER shipping_zone_id");
            $db->execute();
        } catch (Exception $e) {}

        try {
            $db->query("ALTER TABLE online_orders ADD COLUMN payment_slip VARCHAR(255) NULL AFTER payhere_id");
            $db->execute();
        } catch (Exception $e) {}
    }
}
