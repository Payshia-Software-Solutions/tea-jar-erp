<?php
/**
 * PromotionSchema
 * Automated migrations for the Promotion & Discount engine.
 */
class PromotionSchema {
    private static $done = false;

    private static function pdo() {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    }

    private static function hasTable(PDO $pdo, $table) {
        $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$table]);
        return (bool)$stmt->fetch(PDO::FETCH_ASSOC);
    }

    public static function ensure($force = false) {
        if (self::$done && !$force) return;
        self::$done = true;

        try {
            $pdo = self::pdo();

            // 1. Promotions Master Table
            if (!self::hasTable($pdo, 'promotions')) {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS promotions (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        description TEXT NULL,
                        type ENUM('Discount', 'Bundle', 'BOGO', 'Bulk') NOT NULL DEFAULT 'Discount',
                        start_date DATE NULL,
                        end_date DATE NULL,
                        is_active TINYINT(1) NOT NULL DEFAULT 1,
                        priority INT NOT NULL DEFAULT 0,
                        applicable_locations TEXT NULL,
                        created_by INT NULL,
                        updated_by INT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                ");
            } else {
                // Ensure applicable_locations exists for existing promotions table
                $cols = $pdo->query("DESCRIBE promotions")->fetchAll(PDO::FETCH_COLUMN);
                if (!in_array('applicable_locations', $cols)) {
                    $pdo->exec("ALTER TABLE promotions ADD COLUMN applicable_locations TEXT NULL AFTER priority");
                }
            }

            // 2. Promotion Conditions (The "If" part)
            // e.g. condition_type = 'MinAmount', requirement = 5000
            // e.g. condition_type = 'MinQty', requirement = 3
            // e.g. condition_type = 'ItemList', requirement = [102, 105] (JSON)
            if (!self::hasTable($pdo, 'promotion_conditions')) {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS promotion_conditions (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        promotion_id INT NOT NULL,
                        condition_type ENUM('MinAmount', 'MinQty', 'ItemList', 'CollectionList', 'OrderType', 'BankCard', 'CardCategory') NOT NULL,
                        requirement_value TEXT NOT NULL, 
                        operator ENUM('>=', '=', 'IN') DEFAULT '>=',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                ");
            }

            // 3. Promotion Benefits (The "Then" part)
            // e.g. benefit_type = 'Percentage', value = 10
            // e.g. benefit_type = 'FixedPrice', value = 1500
            // e.g. benefit_type = 'FreeItem', value = part_id
            if (!self::hasTable($pdo, 'promotion_benefits')) {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS promotion_benefits (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        promotion_id INT NOT NULL,
                        benefit_type ENUM('Percentage', 'FixedAmount', 'FixedPrice', 'FreeItem', 'BuyXGetY') NOT NULL,
                        benefit_value DECIMAL(12,2) NOT NULL DEFAULT 0,
                        trigger_items TEXT NULL,
                        reward_items TEXT NULL,
                        trigger_qty INT DEFAULT 1,
                        reward_qty INT DEFAULT 1,
                        benefit_discount_pct DECIMAL(5,2) DEFAULT 100.00,
                        benefit_data TEXT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                ");
            } else {
                // Ensure new columns exist for existing tables
                $cols = $pdo->query("DESCRIBE promotion_benefits")->fetchAll(PDO::FETCH_COLUMN);
                if (!in_array('trigger_items', $cols)) $pdo->exec("ALTER TABLE promotion_benefits ADD COLUMN trigger_items TEXT NULL");
                if (!in_array('reward_items', $cols)) $pdo->exec("ALTER TABLE promotion_benefits ADD COLUMN reward_items TEXT NULL");
                if (!in_array('trigger_qty', $cols)) $pdo->exec("ALTER TABLE promotion_benefits ADD COLUMN trigger_qty INT DEFAULT 1");
                if (!in_array('reward_qty', $cols)) $pdo->exec("ALTER TABLE promotion_benefits ADD COLUMN reward_qty INT DEFAULT 1");
                if (!in_array('benefit_discount_pct', $cols)) $pdo->exec("ALTER TABLE promotion_benefits ADD COLUMN benefit_discount_pct DECIMAL(5,2) DEFAULT 100.00");
                
                // Update ENUM for benefit_type (MySQL specific)
                $pdo->exec("ALTER TABLE promotion_benefits MODIFY COLUMN benefit_type ENUM('Percentage', 'FixedAmount', 'FixedPrice', 'FreeItem', 'BuyXGetY') NOT NULL");
            }

            // 4. Permissions
            $pdo->exec("
                INSERT IGNORE INTO permissions (perm_key, description) VALUES
                ('promotions.read', 'View promotions and coupons'),
                ('promotions.write', 'Manage promotions and coupons')
            ");

        } catch (Exception $e) {
            // Silently fail to avoid breaking the logic during schema upgrades
            error_log("PromotionSchema setup error: " . $e->getMessage());
        }
    }
}
