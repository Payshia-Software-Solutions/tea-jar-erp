<?php
/**
 * ApiClientsSchema
 * Manages the table for domain-specific API keys.
 */
class ApiClientsSchema {
    private static $done = false;

    private static function pdo() {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
        return new PDO($dsn, DB_USER, DB_PASS);
    }

    public static function ensure($force = false) {
        if (!$force && !defined('FORCE_MIGRATIONS')) return;
        if (self::$done && !$force) return;
        self::$done = true;

        try {
            $pdo = self::pdo();
        } catch (Exception $e) {
            return;
        }
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // API Clients table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS api_clients (
                id INT AUTO_INCREMENT PRIMARY KEY,
                client_name VARCHAR(100) NOT NULL,
                domain VARCHAR(255) NOT NULL,
                api_key VARCHAR(100) NOT NULL UNIQUE,
                location_id INT NULL,
                is_active TINYINT(1) DEFAULT 1,
                created_by INT NULL,
                updated_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");

        try {
            $stmt = $pdo->query("SHOW COLUMNS FROM api_clients LIKE 'location_id'");
            if (!$stmt->fetch()) {
                $pdo->exec("ALTER TABLE api_clients ADD COLUMN location_id INT NULL AFTER api_key");
            }
        } catch (Exception $e) {}
    }
}
