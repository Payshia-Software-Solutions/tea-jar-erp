<?php
/**
 * SalesReturnSchema Helper
 */
class SalesReturnSchema {
    public static function ensure($force = false) {
        if (!$force && !defined('FORCE_MIGRATIONS')) return;
        $db = new Database();

        // 1. sales_returns table
        $db->query("
            CREATE TABLE IF NOT EXISTS sales_returns (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                return_no       VARCHAR(30) NOT NULL UNIQUE,
                invoice_id      INT NULL,
                customer_id     INT NULL,
                return_date     DATE NOT NULL,
                total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                reason          VARCHAR(255) NULL,
                status          ENUM('Completed', 'Cancelled') NOT NULL DEFAULT 'Completed',
                location_id     INT NOT NULL DEFAULT 1,
                created_by      INT NULL,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_sr_invoice (invoice_id),
                INDEX idx_sr_customer (customer_id),
                INDEX idx_sr_date (return_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();

        // 2. sales_return_items table
        $db->query("
            CREATE TABLE IF NOT EXISTS sales_return_items (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                return_id       INT NOT NULL,
                item_id         INT NOT NULL,
                item_type       VARCHAR(50) NOT NULL DEFAULT 'Part',
                description     VARCHAR(255) NULL,
                quantity        DECIMAL(12,3) NOT NULL DEFAULT 0.000,
                unit_price      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                line_total      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                reason          VARCHAR(255) NULL,
                INDEX idx_sri_return (return_id),
                INDEX idx_sri_item (item_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();

        // 3. refunds table (independent of returns if needed)
        $db->query("
            CREATE TABLE IF NOT EXISTS refunds (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                refund_no       VARCHAR(30) NOT NULL UNIQUE,
                return_id       INT NULL,
                invoice_id      INT NULL,
                amount          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                payment_method  VARCHAR(50) NOT NULL DEFAULT 'Cash',
                reference_no    VARCHAR(100) NULL,
                refund_date     DATE NOT NULL,
                notes           TEXT NULL,
                location_id     INT NOT NULL DEFAULT 1,
                created_by      INT NULL,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_ref_invoice (invoice_id),
                INDEX idx_ref_return (return_id),
                INDEX idx_ref_location (location_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();

        // Migration Check: Add refund_no if it doesn't exist
        try {
            $db->query("SELECT refund_no FROM refunds LIMIT 1");
            $db->execute();
        } catch (Exception $e) {
            $db->query("ALTER TABLE refunds ADD COLUMN refund_no VARCHAR(30) UNIQUE AFTER id");
            $db->execute();
        }

        // Migration Check: Add location_id if it doesn't exist
        try {
            $db->query("SELECT location_id FROM refunds LIMIT 1");
            $db->execute();
        } catch (Exception $e) {
            $db->query("ALTER TABLE refunds ADD COLUMN location_id INT NOT NULL DEFAULT 1 AFTER invoice_id");
            $db->execute();
            $db->query("CREATE INDEX idx_ref_location ON refunds(location_id)");
            $db->execute();
        }

        // Migration Check: Make invoice_id nullable in sales_returns
        try {
            $db->query("ALTER TABLE sales_returns MODIFY COLUMN invoice_id INT NULL");
            $db->execute();
        } catch (Exception $e) {}

        // Migration Check: Add customer_id to sales_returns
        try {
            $db->query("SELECT customer_id FROM sales_returns LIMIT 1");
            $db->execute();
        } catch (Exception $e) {
            $db->query("ALTER TABLE sales_returns ADD COLUMN customer_id INT NULL AFTER invoice_id");
            $db->execute();
            $db->query("CREATE INDEX idx_sr_customer ON sales_returns(customer_id)");
            $db->execute();
        }

        // Migration Check: Make invoice_id nullable in refunds
        try {
            $db->query("ALTER TABLE refunds MODIFY COLUMN invoice_id INT NULL");
            $db->execute();
        } catch (Exception $e) {}

        // Initialize sequence for SR (Sales Return)
        $db->query("INSERT IGNORE INTO document_sequences (doc_type, prefix, next_number, padding) VALUES ('SR', 'SR-', 1, 5)");
        $db->execute();

        // Initialize sequence for REF (Refund)
        $db->query("INSERT IGNORE INTO document_sequences (doc_type, prefix, next_number, padding) VALUES ('REF', 'REF-', 1, 5)");
        $db->execute();

        return true;
    }
}
