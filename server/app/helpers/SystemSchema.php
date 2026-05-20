<?php
/**
 * SystemSchema
 * Manages general system settings (Email, SMS, etc.)
 */
class SystemSchema {
    private static $done = false;

    private static function pdo() {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
        return new PDO($dsn, DB_USER, DB_PASS);
    }

    public static function ensure($force = false) {
        if (self::$done && !$force) return;
        self::$done = true;

        try {
            $pdo = self::pdo();
        } catch (Exception $e) {
            return;
        }
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // 1. Create table for key-value settings
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS system_settings (
                setting_key VARCHAR(100) PRIMARY KEY,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");

        // 2. Default SMTP and SMS keys
        $defaults = [
            'mail_host' => 'smtp.mailtrap.io',
            'mail_port' => '2525',
            'mail_user' => '',
            'mail_pass' => '',
            'mail_encryption' => 'tls',
            'mail_from_addr' => 'no-reply@servicebay.com',
            'mail_from_name' => 'BizFlow',
            'sms_gateway_url' => 'https://sms.send.lk/api/v3/sms/send',
            'sms_api_key' => '',
            'sms_sender_id' => 'BizFlow'
        ];

        foreach ($defaults as $key => $val) {
            $stmt = $pdo->prepare("INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES (:k, :v)");
            $stmt->execute([':k' => $key, ':v' => $val]);
        }

        // 3. SMS Marketing Tables
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS sms_campaigns (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                target_segment VARCHAR(50) DEFAULT 'all',
                status ENUM('Draft', 'Sent', 'Cancelled') DEFAULT 'Draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sent_at TIMESTAMP NULL
            )
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS sms_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                campaign_id INT NULL,
                customer_id INT NULL,
                recipient VARCHAR(20) NOT NULL,
                message TEXT NOT NULL,
                status ENUM('Success', 'Failed') DEFAULT 'Success',
                error_message TEXT,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");

        // 4. Segmentation Tables
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS customer_segments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS segment_contacts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                segment_id INT NOT NULL,
                name VARCHAR(100),
                phone VARCHAR(20) NOT NULL,
                email VARCHAR(100),
                FOREIGN KEY (segment_id) REFERENCES customer_segments(id) ON DELETE CASCADE
            )
        ");

        // 5. Email Marketing Tables
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS email_campaigns (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                content LONGTEXT NOT NULL,
                target_segment VARCHAR(50) DEFAULT 'all',
                status ENUM('Draft', 'Queued', 'Processing', 'Sent', 'Failed') DEFAULT 'Draft',
                sent_at DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        // Ensure status column includes 'Queued' and 'Processing' for background tasks
        try {
            $pdo->exec("ALTER TABLE email_campaigns MODIFY COLUMN status ENUM('Draft', 'Queued', 'Processing', 'Sent', 'Failed') DEFAULT 'Draft'");
        } catch (Exception $e) {
            // Might fail if column doesn't exist yet, which is fine since CREATE TABLE handles it
        }

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS email_queue (
                id INT AUTO_INCREMENT PRIMARY KEY,
                campaign_id INT NOT NULL,
                customer_id INT NULL,
                recipient_email VARCHAR(255) NOT NULL,
                recipient_name VARCHAR(255),
                subject VARCHAR(255) NOT NULL,
                content LONGTEXT NOT NULL,
                status ENUM('Pending', 'Processing', 'Sent', 'Failed') DEFAULT 'Pending',
                error_message TEXT,
                attempts INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP NULL,
                FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS email_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                subject VARCHAR(255),
                content LONGTEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS email_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                campaign_id INT,
                customer_id INT,
                recipient VARCHAR(255) NOT NULL,
                subject VARCHAR(255),
                status ENUM('Success', 'Failed') DEFAULT 'Success',
                error_message TEXT,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        // 6. Marketing Media
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS marketing_media (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                url VARCHAR(500) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        // 7. Printer Mapping Settings
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS printer_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                location_id INT NULL,
                printer_type VARCHAR(50), 
                printer_name VARCHAR(255),
                paper_width VARCHAR(20) DEFAULT '80mm',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_location_printer_type (location_id, printer_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
    }
}
