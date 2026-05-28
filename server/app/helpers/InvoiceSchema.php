<?php
/**
 * InvoiceSchema Helper
 * Automates table creation for invoicing.
 */
class InvoiceSchema {
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

        // [MIGRATIONS] Always check for missing columns even if tables exist
        try {
            if (self::hasTable($pdo, 'invoice_items')) {
                if (!self::hasColumn($pdo, 'invoice_items', 'cost_price')) {
                    $pdo->exec("ALTER TABLE invoice_items ADD COLUMN cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER unit_price");
                }
            }
            if (self::hasTable($pdo, 'invoices')) {
                if (!self::hasColumn($pdo, 'invoices', 'discount_total')) {
                    $pdo->exec("ALTER TABLE invoices ADD COLUMN discount_total DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER tax_total");
                }
                if (!self::hasColumn($pdo, 'invoices', 'applied_promotion_id')) {
                    $pdo->exec("ALTER TABLE invoices ADD COLUMN applied_promotion_id INT NULL AFTER notes");
                }
                if (!self::hasColumn($pdo, 'invoices', 'applied_promotion_name')) {
                    $pdo->exec("ALTER TABLE invoices ADD COLUMN applied_promotion_name VARCHAR(255) NULL AFTER applied_promotion_id");
                }
                if (!self::hasColumn($pdo, 'invoices', 'shipping_fee')) {
                    $pdo->exec("ALTER TABLE invoices ADD COLUMN shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER grand_total");
                }
                if (!self::hasColumn($pdo, 'invoices', 'online_order_id')) {
                    $pdo->exec("ALTER TABLE invoices ADD COLUMN online_order_id INT NULL AFTER order_id");
                }
                if (!self::hasColumn($pdo, 'invoices', 'reservation_id')) {
                    $pdo->exec("ALTER TABLE invoices ADD COLUMN reservation_id INT NULL AFTER online_order_id");
                }
                if (!self::hasColumn($pdo, 'invoices', 'banquet_booking_id')) {
                    $pdo->exec("ALTER TABLE invoices ADD COLUMN banquet_booking_id INT NULL AFTER reservation_id");
                }
                if (!self::hasColumn($pdo, 'invoices', 'shipping_provider_id')) {
                    $pdo->exec("ALTER TABLE invoices ADD COLUMN shipping_provider_id INT NULL AFTER shipping_fee");
                }
                if (!self::hasColumn($pdo, 'invoices', 'is_international')) {
                    $pdo->exec("ALTER TABLE invoices ADD COLUMN is_international TINYINT(1) DEFAULT 0 AFTER shipping_provider_id");
                }
                if (!self::hasColumn($pdo, 'invoices', 'shipping_country')) {
                    $pdo->exec("ALTER TABLE invoices ADD COLUMN shipping_country VARCHAR(100) NULL AFTER is_international");
                }
                if (!self::hasColumn($pdo, 'invoices', 'recurring_template_id')) {
                    $pdo->exec("ALTER TABLE invoices ADD COLUMN recurring_template_id INT NULL AFTER banquet_booking_id");
                }
                if (!self::hasColumn($pdo, 'invoices', 'offline_id')) {
                    $pdo->exec("ALTER TABLE invoices ADD COLUMN offline_id VARCHAR(100) NULL AFTER recurring_template_id");
                }
                if (!self::hasColumn($pdo, 'invoices', 'device_id')) {
                    $pdo->exec("ALTER TABLE invoices ADD COLUMN device_id VARCHAR(100) NULL AFTER offline_id");
                }
            }
        } catch (Exception $e) {}

        if (self::$done && !$force) return;
        self::$done = true;

        $flagFile = __DIR__ . '/../../.schema_synced';
        if (file_exists($flagFile) && !$force) return;

        // 1. invoices
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS invoices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                invoice_no VARCHAR(50) UNIQUE NOT NULL,
                order_id INT NULL,
                location_id INT NULL,
                customer_id INT NOT NULL,
                billing_address TEXT NULL,
                shipping_address TEXT NULL,
                issue_date DATE NOT NULL,
                due_date DATE NULL,
                subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                tax_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                discount_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                grand_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                status ENUM('Unpaid', 'Partial', 'Paid', 'Cancelled') DEFAULT 'Unpaid',
                notes TEXT NULL,
                applied_promotion_id INT NULL,
                applied_promotion_name VARCHAR(255) NULL,
                recurring_template_id INT NULL,
                offline_id VARCHAR(100) NULL,
                device_id VARCHAR(100) NULL,
                created_by INT NULL,
                updated_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES repair_orders(id) ON DELETE SET NULL,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        // 2. invoice_items
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS invoice_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                invoice_id INT NOT NULL,
                item_id INT NULL,
                description VARCHAR(255) NOT NULL,
                item_type ENUM('Part', 'Labor', 'Service', 'Other') DEFAULT 'Part',
                quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
                unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                line_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        // 3. invoice_payments
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS invoice_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                invoice_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                payment_date DATE NOT NULL,
                payment_method VARCHAR(50) DEFAULT 'Cash',
                reference_no VARCHAR(100) NULL,
                notes TEXT NULL,
                created_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        // 4. Permissions
        if (self::hasTable($pdo, 'permissions')) {
            $pdo->exec("
                INSERT IGNORE INTO permissions (perm_key, description) VALUES 
                ('invoices.read', 'View invoices'),
                ('invoices.write', 'Manage invoices')
            ");

            // Grant to Workshop Officer
            try {
                $stmt = $pdo->prepare("SELECT id FROM roles WHERE name = 'Workshop Officer' LIMIT 1");
                $stmt->execute();
                $roleId = $stmt->fetchColumn();
                if ($roleId) {
                    $pdo->exec("
                        INSERT IGNORE INTO role_permissions (role_id, permission_id)
                        SELECT $roleId, id FROM permissions WHERE perm_key IN ('invoices.read', 'invoices.write')
                    ");
                }
            } catch (Exception $ee) {}
        }

        // 5. Sequence
        if (self::hasTable($pdo, 'document_sequences')) {
            $stmt = $pdo->prepare("SELECT doc_type FROM document_sequences WHERE doc_type = 'INV'");
            $stmt->execute();
            if (!$stmt->fetch()) {
                $pdo->exec("
                    INSERT INTO document_sequences (doc_type, prefix, next_number, padding)
                    VALUES ('INV', 'INV/', 1, 6)
                ");
            }
        }
    }

    private static function hasTable($pdo, $name) {
        try {
            $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
            $stmt->execute([$name]);
            return (bool)$stmt->fetch();
        } catch (Exception $e) { return false; }
    }

    private static function hasColumn($pdo, $table, $column) {
        try {
            $stmt = $pdo->prepare("SHOW COLUMNS FROM `$table` LIKE ?");
            $stmt->execute([$column]);
            return (bool)$stmt->fetch();
        } catch (Exception $e) { return false; }
    }
}
