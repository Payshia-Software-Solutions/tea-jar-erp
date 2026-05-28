<?php
/**
 * StorefrontSchema
 * Manages tables for storefront content and settings.
 */
class StorefrontSchema {
    private static function pdo() {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
        return new PDO($dsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    }

    public static function ensure($force = false) {
        if (!$force && !defined('FORCE_MIGRATIONS')) return;
        try {
            $pdo = self::pdo();
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS storefront_settings (
                    `location_id` INT DEFAULT 1,
                    `key` VARCHAR(64) NOT NULL,
                    `value` TEXT NULL,
                    `label` VARCHAR(255) NULL,
                    `group` VARCHAR(32) DEFAULT 'general',
                    `type` ENUM('text', 'color', 'url', 'textarea') DEFAULT 'text',
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (`location_id`, `key`)
                )
            ");

            // Migration: Add location_id if it doesn't exist and fix PK
            try {
                $columns = $pdo->query("SHOW COLUMNS FROM storefront_settings LIKE 'location_id'")->fetchAll();
                if (empty($columns)) {
                    $pdo->exec("ALTER TABLE storefront_settings DROP PRIMARY KEY");
                    $pdo->exec("ALTER TABLE storefront_settings ADD COLUMN `location_id` INT DEFAULT 1 FIRST");
                    $pdo->exec("ALTER TABLE storefront_settings ADD PRIMARY KEY (`location_id`, `key`) ");
                }
            } catch (Exception $e) {}

            // Seed initial data based on current hardcoded values
            $settings = [
                ['top_bar_text', 'Enjoy 20% Off & Island wide Free Delivery..!', 'Top Bar Text', 'header', 'text'],
                ['top_bar_bg_color', '#b91c1c', 'Top Bar Background Color', 'header', 'color'],
                ['hero_video_url', 'https://teajarceylon.com/assets/videos/TeaJar_HERO_V1-2.mp4', 'Hero Video URL', 'hero', 'url'],
                ['hero_logo_url', 'http://content-provider.payshia.com/tea-jar/white-logo.png', 'Hero Logo URL', 'hero', 'url'],
                ['sub_modal_active', '1', 'Show Subscription Modal', 'subscription', 'text'],
                ['sub_modal_title', "Life's better with tea, especially when it's 20% Off!", 'Modal Title', 'subscription', 'text'],
                ['sub_modal_subtitle', 'Enjoy 20% Off + FREE Delivery on all Tea Jar products, because you deserve the best. 👌', 'Modal Subtitle', 'subscription', 'textarea'],
                ['sub_modal_image_url', 'https://content-provider.payshia.com/tea-jar/tea-modal-v1.webp', 'Modal Image URL', 'subscription', 'url'],
                ['payment_payhere_enabled', '1', 'Enable PayHere', 'payments', 'text'],
                ['payment_cod_enabled', '1', 'Enable COD', 'payments', 'text'],
                ['payment_mintpay_enabled', '0', 'Enable Mintpay', 'payments', 'text'],
                ['payment_bank_transfer_enabled', '1', 'Enable Bank Transfer', 'payments', 'text'],
                ['storefront_product_prefix', '/product/', 'Product Route Prefix', 'promotions', 'text'],
                ['payment_payhere_icon', '', 'PayHere Icon', 'payments', 'text'],
                ['payment_cod_icon', '', 'COD Icon', 'payments', 'text'],
                ['payment_mintpay_icon', '', 'Mintpay Icon', 'payments', 'text'],
                ['payment_bank_transfer_icon', '', 'Bank Transfer Icon', 'payments', 'text'],
                ['bank_name', '', 'Bank Name', 'payments', 'text'],
                ['bank_account_name', '', 'Account Name', 'payments', 'text'],
                ['bank_account_number', '', 'Account Number', 'payments', 'text'],
                ['bank_branch', '', 'Branch Name', 'payments', 'text'],
                ['shipping_enabled', '0', 'Enable Shipping Charges', 'shipping', 'text'],
                ['shipping_flat_rate', '0', 'Flat Rate Amount', 'shipping', 'text'],

            ];

            $stmt = $pdo->prepare("INSERT IGNORE INTO storefront_settings (`key`, `value`, `label`, `group`, `type`) VALUES (?, ?, ?, ?, ?)");
            foreach ($settings as $s) {
                $stmt->execute($s);
            }
        } catch (Exception $e) {
            // Best effort
        }
    }
}
