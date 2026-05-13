<?php
/**
 * CouponSchema
 * Manages tables for the coupon system.
 */
class CouponSchema {
    private static function pdo() {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
        return new PDO($dsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    }

    public static function ensure() {
        require_once __DIR__ . '/PromotionSchema.php';
        PromotionSchema::ensure();

        try {
            $pdo = self::pdo();
            
            // 1. Coupons Table
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS coupons (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    code VARCHAR(50) NOT NULL UNIQUE,
                    description TEXT NULL,
                    discount_type ENUM('Percentage', 'FixedAmount') NOT NULL DEFAULT 'Percentage',
                    discount_value DECIMAL(12,2) NOT NULL DEFAULT 0,
                    min_order_amount DECIMAL(12,2) DEFAULT 0,
                    max_discount_amount DECIMAL(12,2) DEFAULT 0,
                    start_date DATETIME NULL,
                    end_date DATETIME NULL,
                    is_active TINYINT(1) DEFAULT 1,
                    max_uses INT DEFAULT 0, -- 0 = unlimited
                    used_count INT DEFAULT 0,
                    user_limit INT DEFAULT 1, -- uses per customer
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");

            // 2. Coupon Usage Log
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS coupon_usage (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    coupon_id INT NOT NULL,
                    order_id INT NOT NULL,
                    customer_id INT NULL,
                    discount_amount DECIMAL(12,2) NOT NULL,
                    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");

        } catch (Exception $e) {
            error_log("CouponSchema error: " . $e->getMessage());
        }
    }
}
