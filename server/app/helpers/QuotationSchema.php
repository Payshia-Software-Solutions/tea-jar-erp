<?php
/**
 * Quotation Schema Helper
 */
class QuotationSchema {
    private static $done = false;

    public static function ensure($force = false) {
        if (!$force && !defined('FORCE_MIGRATIONS')) return;
        if (self::$done) return;
        self::$done = true;

        $db = new Database();
        
        // Quotations Table
        $db->query("CREATE TABLE IF NOT EXISTS quotations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            quotation_no VARCHAR(50) UNIQUE NOT NULL,
            customer_id INT NOT NULL,
            location_id INT,
            issue_date DATE NOT NULL,
            expiry_date DATE,
            status ENUM('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted') DEFAULT 'Draft',
            subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
            tax_total DECIMAL(15,2) NOT NULL DEFAULT 0,
            discount_total DECIMAL(15,2) NOT NULL DEFAULT 0,
            grand_total DECIMAL(15,2) NOT NULL DEFAULT 0,
            notes TEXT,
            is_international TINYINT(1) DEFAULT 0,
            shipping_provider_id INT,
            shipping_cost DECIMAL(15,2) DEFAULT 0,
            shipping_country VARCHAR(100),
            shipping_address TEXT,
            shipping_costing_template_id INT,
            converted_invoice_id INT,
            created_by INT,
            updated_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;");
        $db->execute();

        // Add columns if they don't exist (for existing tables)
        $columns = [
            'is_international' => "TINYINT(1) DEFAULT 0",
            'shipping_provider_id' => "INT",
            'shipping_cost' => "DECIMAL(15,2) DEFAULT 0",
            'shipping_country' => "VARCHAR(100)",
            'shipping_address' => "TEXT",
            'shipping_costing_template_id' => "INT"
        ];

        foreach ($columns as $col => $def) {
            try {
                $db->query("ALTER TABLE quotations ADD COLUMN $col $def");
                $db->execute();
            } catch (Exception $e) {
                // Column might already exist
            }
        }

        // Quotation Items Table
        $db->query("CREATE TABLE IF NOT EXISTS quotation_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            quotation_id INT NOT NULL,
            item_id INT,
            description TEXT,
            item_type VARCHAR(50) DEFAULT 'Part',
            quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
            unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
            discount DECIMAL(15,2) DEFAULT 0,
            line_total DECIMAL(15,2) NOT NULL DEFAULT 0,
            FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;");
        $db->execute();

        // Quotation Taxes Table
        $db->query("CREATE TABLE IF NOT EXISTS quotation_taxes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            quotation_id INT NOT NULL,
            tax_name VARCHAR(100),
            tax_code VARCHAR(50),
            rate_percent DECIMAL(5,2),
            amount DECIMAL(15,2),
            FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;");
        $db->execute();

        // Seed Permissions
        $db->query("INSERT IGNORE INTO permissions (perm_key, description) VALUES 
            ('sales.read', 'View sales quotations'),
            ('sales.create', 'Create sales quotations'),
            ('sales.update', 'Update sales quotations')
        ");
        $db->execute();
    }
}
