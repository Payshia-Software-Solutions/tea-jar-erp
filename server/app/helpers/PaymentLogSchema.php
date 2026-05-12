<?php
/**
 * PaymentLogSchema
 * Manages database schema for logging payment gateway notifications.
 */
class PaymentLogSchema {
    public static function ensure() {
        $db = new Database();

        $db->query("
            CREATE TABLE IF NOT EXISTS payment_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                gateway VARCHAR(50) NOT NULL,
                order_id VARCHAR(50) NULL,
                payment_id VARCHAR(100) NULL,
                status_code VARCHAR(20) NULL,
                amount DECIMAL(15,2) NULL,
                currency VARCHAR(10) NULL,
                raw_data TEXT NOT NULL,
                validation_status TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();
    }
}
