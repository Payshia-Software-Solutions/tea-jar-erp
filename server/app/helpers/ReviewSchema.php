<?php
/**
 * Review Schema Helper
 */
class ReviewSchema {
    private static $done = false;

    public static function ensure($force = false) {
        if (!$force && !defined('FORCE_MIGRATIONS')) return;
        if (self::$done) return;
        self::$done = true;

        $db = new Database();
        
        // Product Reviews Table
        $db->query("CREATE TABLE IF NOT EXISTS product_reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            part_id INT NOT NULL,
            customer_id INT NOT NULL,
            rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            admin_reply TEXT,
            status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
            replied_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;");
        $db->execute();

        // Ensure reply columns exist
        try {
            $db->query("ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS admin_reply TEXT AFTER comment");
            $db->execute();
            $db->query("ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP NULL AFTER status");
            $db->execute();
        } catch (Exception $e) {}

        // Product Review Images Table
        $db->query("CREATE TABLE IF NOT EXISTS product_review_images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            review_id INT NOT NULL,
            image_path VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (review_id) REFERENCES product_reviews(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;");
        $db->execute();

        // Add permissions
        $db->query("INSERT IGNORE INTO permissions (perm_key, description) VALUES 
            ('reviews.manage', 'Manage product reviews and approvals')
        ");
        $db->execute();
    }
}
