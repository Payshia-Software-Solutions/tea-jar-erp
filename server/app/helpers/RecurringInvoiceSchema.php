<?php
/**
 * Recurring Invoice Schema Helper
 */
class RecurringInvoiceSchema {
    private static $done = false;

    private static function pdo() {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    }

    public static function ensure($force = false) {
        if (!$force && !defined('FORCE_MIGRATIONS')) return;
        if (self::$done && !$force) return;
        self::$done = true;

        $pdo = self::pdo();

        // 1. recurring_invoices
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS recurring_invoices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                template_name VARCHAR(255) NOT NULL,
                customer_id INT NOT NULL,
                location_id INT NULL,
                frequency ENUM('Daily', 'Weekly', 'Monthly', 'Yearly') NOT NULL DEFAULT 'Monthly',
                start_date DATE NOT NULL,
                end_date DATE NULL,
                next_generation_date DATE NOT NULL,
                last_generation_date DATE NULL,
                status ENUM('Active', 'Paused', 'Completed') DEFAULT 'Active',
                billing_address TEXT NULL,
                shipping_address TEXT NULL,
                subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                tax_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                discount_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                grand_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                notes TEXT NULL,
                created_by INT NULL,
                updated_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        // 2. recurring_invoice_items
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS recurring_invoice_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                recurring_invoice_id INT NOT NULL,
                item_id INT NULL,
                description VARCHAR(255) NOT NULL,
                item_type ENUM('Part', 'Labor', 'Service', 'Other') DEFAULT 'Part',
                quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
                unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                line_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                FOREIGN KEY (recurring_invoice_id) REFERENCES recurring_invoices(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        // 3. recurring_invoice_taxes
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS recurring_invoice_taxes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                recurring_template_id INT NOT NULL,
                tax_name VARCHAR(100) NOT NULL,
                tax_code VARCHAR(50) NOT NULL,
                rate_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
                amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                FOREIGN KEY (recurring_template_id) REFERENCES recurring_invoices(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        // 4. Permissions
        if (self::hasTable($pdo, 'permissions')) {
            $pdo->exec("
                INSERT IGNORE INTO permissions (perm_key, description) VALUES 
                ('invoices.recurring.read', 'View recurring invoices'),
                ('invoices.recurring.write', 'Manage recurring invoices')
            ");
        }
    }

    private static function hasTable($pdo, $name) {
        try {
            $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
            $stmt->execute([$name]);
            return (bool)$stmt->fetch();
        } catch (Exception $e) { return false; }
    }
}
