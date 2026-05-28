<?php
/**
 * CompanySchema
 * Manages the company settings table.
 */
class CompanySchema {
    private static $done = false;

    private static function pdo() {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
        return new PDO($dsn, DB_USER, DB_PASS);
    }

    public static function ensure($force = false) {
        if (!$force && !defined('FORCE_MIGRATIONS')) return;
        if (self::$done && !$force) return;
        self::$done = true;

        $flagFile = __DIR__ . '/../../.schema_synced';
        if (file_exists($flagFile) && !$force) return;

        try {
            $pdo = self::pdo();
        } catch (Exception $e) {
            return;
        }
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // 1. Create Table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS company (
                id INT PRIMARY KEY DEFAULT 1,
                name VARCHAR(255) NOT NULL,
                address TEXT,
                phone VARCHAR(50),
                email VARCHAR(100),
                logo_filename VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");

        // 2. Default Seed (if empty)
        $stmt = $pdo->query("SELECT id FROM company WHERE id = 1");
        if (!$stmt->fetch()) {
            $pdo->exec("
                INSERT INTO company (id, name, address, phone, email)
                VALUES (1, 'Service Center Solution', 'Main Street, Colombo', '+94 11 234 5678', 'info@servicebay.com')
            ");
        }
    }
}
