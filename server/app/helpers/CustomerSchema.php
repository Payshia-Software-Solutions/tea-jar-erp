<?php
/**
 * CustomerSchema Helper
 * Automates table creation and permission seeding.
 */

class CustomerSchema {
    private static function pdo() {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    }

    public static function ensure($force = false) {
        if (!$force && !defined('FORCE_MIGRATIONS')) return;
        $pdo = self::pdo();

        // 1. Create Table (Basic)
        $sql = "
            CREATE TABLE IF NOT EXISTS customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NULL,
                email VARCHAR(255) NULL,
                address TEXT NULL,
                nic VARCHAR(50) NULL,
                created_by INT NULL,
                updated_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        ";
        try {
            $pdo->exec($sql);
        } catch (Exception $e) {}

        // 2. Ensure missing columns exist
        $cols = [
            'tax_number' => "VARCHAR(100) NULL",
            'order_type' => "ENUM('Internal', 'External') DEFAULT 'External'",
            'is_active' => "TINYINT(1) DEFAULT 1",
            'is_unsubscribed' => "TINYINT(1) DEFAULT 0",
            'credit_limit' => "DECIMAL(10, 2) DEFAULT 0.00",
            'credit_days' => "INT DEFAULT 0",
            'password' => "VARCHAR(255) NULL",
            'is_ecommerce_user' => "TINYINT(1) DEFAULT 0",
            'city' => "VARCHAR(255) NULL",
            'postal_code' => "VARCHAR(100) NULL",
            'last_login' => "DATETIME NULL"
        ];

        foreach ($cols as $col => $def) {
            if (!self::hasColumn($pdo, 'customers', $col)) {
                try {
                    $pdo->exec("ALTER TABLE customers ADD COLUMN $col $def");
                } catch (Exception $e) {}
            }
        }

        // 3. Ensure index exists
        if (!self::hasIndex($pdo, 'customers', 'uq_customers_name_phone')) {
            try {
                $pdo->exec("ALTER TABLE customers ADD UNIQUE KEY uq_customers_name_phone (name, phone)");
            } catch (Exception $e) {}
        }

        // 4. Ensure Permissions exist
        try {
            if (self::hasTable($pdo, 'permissions')) {
                $pdo->exec("
                    INSERT IGNORE INTO permissions (perm_key, description) VALUES 
                    ('customers.read', 'View customers'),
                    ('customers.write', 'Create/update/delete customers')
                ");

                // Grant to Workshop Officer by default
                try {
                    $stmt = $pdo->prepare("SELECT id FROM roles WHERE name = 'Workshop Officer' LIMIT 1");
                    $stmt->execute();
                    $roleId = $stmt->fetchColumn();
                    if ($roleId) {
                        $pdo->exec("
                            INSERT IGNORE INTO role_permissions (role_id, permission_id)
                            SELECT $roleId, id FROM permissions WHERE perm_key IN ('customers.read', 'customers.write')
                        ");
                    }
                } catch (Exception $ee) {}
            }
        } catch (Exception $e) {}
    }

    private static function hasTable($pdo, $name) {
        try {
            $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
            $stmt->execute([$name]);
            return (bool)$stmt->fetch();
        } catch (Exception $e) {
            return false;
        }
    }

    private static function hasColumn($pdo, $table, $col) {
        try {
            $stmt = $pdo->prepare("SHOW COLUMNS FROM `$table` LIKE ?");
            $stmt->execute([$col]);
            return (bool)$stmt->fetch();
        } catch (Exception $e) {
            return false;
        }
    }

    private static function hasIndex($pdo, $table, $index) {
        try {
            $stmt = $pdo->prepare("SHOW INDEX FROM `$table` WHERE Key_name = ?");
            $stmt->execute([$index]);
            return (bool)$stmt->fetch();
        } catch (Exception $e) {
            return false;
        }
    }
}
