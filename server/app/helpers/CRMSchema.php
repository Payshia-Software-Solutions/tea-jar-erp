<?php
/**
 * CRM Schema Helper
 */
class CRMSchema {
    private static $done = false;

    public static function ensure($force = false) {
        if (!$force && !defined('FORCE_MIGRATIONS')) return;
        if (self::$done) return;
        self::$done = true;

        $db = new Database();
        
        // CRM Inquiries Table
        $db->query("CREATE TABLE IF NOT EXISTS crm_inquiries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            inquiry_number VARCHAR(50) NOT NULL UNIQUE,
            customer_id INT DEFAULT NULL,
            customer_name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) DEFAULT NULL,
            email VARCHAR(255) DEFAULT NULL,
            source VARCHAR(100) DEFAULT 'Direct',
            inquiry_type VARCHAR(100) DEFAULT 'General',
            status ENUM('New', 'Contacted', 'Qualified', 'Converted', 'Lost') DEFAULT 'New',
            assigned_to INT DEFAULT NULL,
            requirements TEXT,
            notes TEXT,
            converted_to_type VARCHAR(50) DEFAULT NULL,
            converted_to_id INT DEFAULT NULL,
            created_by INT,
            updated_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_inquiry_customer (customer_id),
            KEY idx_inquiry_status (status),
            KEY idx_inquiry_type (inquiry_type),
            KEY idx_inquiry_assigned (assigned_to)
        ) ENGINE=InnoDB;");
        $db->execute();

        // Ensure new columns exist for existing tables
        $db->query("SHOW COLUMNS FROM crm_inquiries LIKE 'converted_to_type'");
        if (!$db->single()) {
            $db->query("ALTER TABLE crm_inquiries ADD COLUMN converted_to_type VARCHAR(50) DEFAULT NULL AFTER notes");
            $db->execute();
            $db->query("ALTER TABLE crm_inquiries ADD COLUMN converted_to_id INT DEFAULT NULL AFTER converted_to_type");
            $db->execute();
        }

        // CRM Inquiry Items Table
        $db->query("CREATE TABLE IF NOT EXISTS crm_inquiry_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            inquiry_id INT NOT NULL,
            item_id INT DEFAULT NULL,
            description VARCHAR(255) NOT NULL,
            quantity DECIMAL(10, 2) DEFAULT 1.00,
            unit_price DECIMAL(10, 2) DEFAULT 0.00,
            FOREIGN KEY (inquiry_id) REFERENCES crm_inquiries(id) ON DELETE CASCADE,
            KEY idx_inquiry_item (inquiry_id)
        ) ENGINE=InnoDB;");
        $db->execute();

        // CRM Inquiry Logs (Interactions)
        $db->query("CREATE TABLE IF NOT EXISTS crm_inquiry_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            inquiry_id INT NOT NULL,
            action VARCHAR(255) NOT NULL,
            notes TEXT,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (inquiry_id) REFERENCES crm_inquiries(id) ON DELETE CASCADE,
            KEY idx_inquiry_log_inquiry (inquiry_id)
        ) ENGINE=InnoDB;");
        $db->execute();

        // Add permissions
        $db->query("INSERT IGNORE INTO permissions (perm_key, description) VALUES 
            ('crm.inquiries.view', 'View CRM inquiries'),
            ('crm.inquiries.manage', 'Create and manage CRM inquiries'),
            ('crm.inquiries.delete', 'Delete CRM inquiries')
        ");
        $db->execute();

        // Ensure document sequence for inquiries
        $db->query("INSERT IGNORE INTO document_sequences (doc_type, prefix, next_number, padding) VALUES 
            ('inquiry', 'INQ-', 1, 6)
        ");
        $db->execute();
    }
}
