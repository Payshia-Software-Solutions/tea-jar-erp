<?php
/**
 * ShippingCarrierSchema
 * Manages database schema for Shipping Carriers.
 */
class ShippingCarrierSchema {
    private static $done = false;

    public static function ensure($force = false) {
        if (!$force && !defined('FORCE_MIGRATIONS')) return;
        if (self::$done) return;
        self::$done = true;

        $db = new Database();

        // 1. shipping_carriers table
        $db->query("
            CREATE TABLE IF NOT EXISTS shipping_carriers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                tracking_url VARCHAR(255) NULL,
                is_default TINYINT(1) NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();

        // Migration: Ensure default carrier logic
        // We'll handle this in the controller (only one default allowed)
    }
}
