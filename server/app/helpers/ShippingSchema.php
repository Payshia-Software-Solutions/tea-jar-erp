<?php
/**
 * Shipping Schema Helper
 */
class ShippingSchema {
    private static $done = false;

    public static function ensure($force = false) {
        if (!$force && !defined('FORCE_MIGRATIONS')) return;
        if (self::$done) return;
        self::$done = true;

        $db = new Database();
        
        // Shipping Providers Table
        $db->query("CREATE TABLE IF NOT EXISTS shipping_providers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            base_cost DECIMAL(15,2) DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_by INT,
            updated_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;");
        $db->execute();

        // Seed Default Providers
        $db->query("SELECT COUNT(*) as count FROM shipping_providers");
        $row = $db->single();
        if ($row->count == 0) {
            $db->query("INSERT INTO shipping_providers (name, base_cost) VALUES 
                ('DHL International', 50.00),
                ('UPS Worldwide', 45.00),
                ('FedEx International', 48.00),
                ('Domestic Courier', 10.00)
            ");
            $db->execute();
        }

        // Add permissions
        $db->query("INSERT IGNORE INTO permissions (perm_key, description) VALUES 
            ('shipping.manage', 'Manage shipping providers and rates'),
            ('costing.manage', 'Manage shipping costing templates')
        ");
        $db->execute();

        // Shipping Costing Templates
        $db->query("CREATE TABLE IF NOT EXISTS shipping_costing_templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            is_active TINYINT(1) DEFAULT 1,
            created_by INT,
            updated_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;");
        $db->execute();

        // Shipping Costing Items
        $db->query("CREATE TABLE IF NOT EXISTS shipping_costing_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            template_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            cost_type ENUM('Fixed', 'Percentage', 'Per Unit', 'Manual') DEFAULT 'Fixed',
            value DECIMAL(15,2) DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (template_id) REFERENCES shipping_costing_templates(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;");
        $db->execute();

        // Shipping Costing Sheets
        $db->query("CREATE TABLE IF NOT EXISTS shipping_costing_sheets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            template_id INT,
            customer_id INT,
            reference_number VARCHAR(100),
            shipping_term VARCHAR(20),
            base_carrier_cost DECIMAL(15,2) DEFAULT 0,
            total_quantity DECIMAL(15,2) DEFAULT 0,
            total_cost DECIMAL(15,2) DEFAULT 0,
            status VARCHAR(20) DEFAULT 'Draft',
            created_by INT,
            updated_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;");
        $db->execute();

        // Ensure freight_type column exists
        $db->query("SHOW COLUMNS FROM shipping_costing_sheets LIKE 'freight_type'");
        $row = $db->single();
        if (!$row) {
            $db->query("ALTER TABLE shipping_costing_sheets ADD COLUMN freight_type VARCHAR(50) DEFAULT NULL AFTER shipping_term");
            $db->execute();
        }

        // Ensure costing_number column exists
        $db->query("SHOW COLUMNS FROM shipping_costing_sheets LIKE 'costing_number'");
        if (!$db->single()) {
            $db->query("ALTER TABLE shipping_costing_sheets ADD COLUMN costing_number VARCHAR(50) DEFAULT NULL AFTER id");
            $db->execute();
            try { $db->query("ALTER TABLE shipping_costing_sheets ADD UNIQUE KEY uq_costing_number (costing_number)"); $db->execute(); } catch(Exception $e) {}
        }

        // Shipping Costing Sheet Items
        $db->query("CREATE TABLE IF NOT EXISTS shipping_costing_sheet_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sheet_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            cost_type VARCHAR(20) DEFAULT 'Fixed',
            value DECIMAL(15,2) DEFAULT 0,
            calculated_amount DECIMAL(15,2) DEFAULT 0,
            FOREIGN KEY (sheet_id) REFERENCES shipping_costing_sheets(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;");
        $db->execute();
        
        // Shipping Costing Sheet Products
        $db->query("CREATE TABLE IF NOT EXISTS shipping_costing_sheet_products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sheet_id INT NOT NULL,
            part_id INT NOT NULL,
            quantity DECIMAL(15,2) DEFAULT 0,
            unit_cost DECIMAL(15,2) DEFAULT 0,
            weight DECIMAL(15,3) DEFAULT 0,
            cbm DECIMAL(15,6) DEFAULT 0,
            packaging_type_id INT,
            packing_type VARCHAR(50) DEFAULT 'Carton',
            units_per_carton INT DEFAULT 1,
            carton_length_cm DECIMAL(10,2) DEFAULT 0,
            carton_width_cm DECIMAL(10,2) DEFAULT 0,
            carton_height_cm DECIMAL(10,2) DEFAULT 0,
            volume_cbm DECIMAL(15,6) DEFAULT 0,
            carton_tare_weight_kg DECIMAL(10,3) DEFAULT 0,
            net_weight_kg DECIMAL(10,3) DEFAULT 0,
            gross_weight_kg DECIMAL(10,3) DEFAULT 0,
            FOREIGN KEY (sheet_id) REFERENCES shipping_costing_sheets(id) ON DELETE CASCADE,
            FOREIGN KEY (part_id) REFERENCES parts(id)
        ) ENGINE=InnoDB;");
        $db->execute();
        
        $db->query("ALTER TABLE shipping_costing_sheet_products 
            ADD COLUMN IF NOT EXISTS packing_type VARCHAR(50) DEFAULT 'Carton',
            ADD COLUMN IF NOT EXISTS volume_cbm DECIMAL(15,6) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS hs_code VARCHAR(50) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(10,4) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS profit_method VARCHAR(20) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS profit_base VARCHAR(20) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS units_per_carton INT DEFAULT 1,
            ADD COLUMN IF NOT EXISTS carton_length_cm DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS carton_width_cm DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS carton_height_cm DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS carton_tare_weight_kg DECIMAL(10,3) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS net_weight_kg DECIMAL(10,3) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS gross_weight_kg DECIMAL(10,3) DEFAULT 0,
            MODIFY COLUMN cbm DECIMAL(15,6) DEFAULT 0
        ");
        $db->execute();

        // Ensure sheet columns exist
        $db->query("ALTER TABLE shipping_costing_sheets
            ADD COLUMN IF NOT EXISTS freight_type VARCHAR(50) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS shipment_mode VARCHAR(20) DEFAULT 'LCL',
            ADD COLUMN IF NOT EXISTS profit_method VARCHAR(20) DEFAULT 'Markup',
            ADD COLUMN IF NOT EXISTS profit_base VARCHAR(20) DEFAULT 'Landed',
            ADD COLUMN IF NOT EXISTS profit_value DECIMAL(15,4) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS overhead_absorption_method VARCHAR(20) DEFAULT 'Value',
            ADD COLUMN IF NOT EXISTS target_currency VARCHAR(10) DEFAULT 'USD',
            ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(15,6) DEFAULT 1
        ");
        $db->execute();

        // Ensure item columns exist
        $db->query("ALTER TABLE shipping_costing_sheet_items
            ADD COLUMN IF NOT EXISTS absorption_method VARCHAR(20) DEFAULT 'Value'
        ");
        $db->execute();
        
        // Logistics Categories Table
        $db->query("CREATE TABLE IF NOT EXISTS logistics_categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;");
        $db->execute();

        // Seed Default Categories if empty
        $db->query("SELECT COUNT(*) as count FROM logistics_categories");
        $res = $db->single();
        if ($res && $res->count == 0) {
            $db->query("INSERT INTO logistics_categories (name) VALUES ('Logistic'), ('Clearence'), ('Freight'), ('General')");
            $db->execute();
        }

        // Logistics Factors Table
        $db->query("CREATE TABLE IF NOT EXISTS logistics_factors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            type VARCHAR(50) DEFAULT 'General',
            absorption_method ENUM('Value', 'Quantity', 'Weight', 'Volume') DEFAULT 'Value',
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;");
        $db->execute();

        // Ensure absorption_method exists for existing tables and is updated
        $db->query("SHOW COLUMNS FROM logistics_factors LIKE 'absorption_method'");
        if (!$db->single()) {
            $db->query("ALTER TABLE logistics_factors ADD COLUMN absorption_method ENUM('Value', 'Quantity', 'Weight', 'Volume') DEFAULT 'Value' AFTER type");
            $db->execute();
        } else {
            $db->query("ALTER TABLE logistics_factors MODIFY COLUMN absorption_method ENUM('Value', 'Quantity', 'Weight', 'Volume') DEFAULT 'Value'");
            $db->execute();
        }
        $db->execute();

        // Export Packaging Types
        $db->query("CREATE TABLE IF NOT EXISTS export_packaging_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            type ENUM('Carton', 'Bag', 'Drum', 'Crate', 'Other') DEFAULT 'Carton',
            length_cm DECIMAL(10,2) DEFAULT 0,
            width_cm DECIMAL(10,2) DEFAULT 0,
            height_cm DECIMAL(10,2) DEFAULT 0,
            cbm DECIMAL(10,4) DEFAULT 0,
            tare_weight_kg DECIMAL(10,2) DEFAULT 0,
            max_weight_capacity_kg DECIMAL(10,2) DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;");
        $db->execute();

        // Export Pallet Types
        $db->query("CREATE TABLE IF NOT EXISTS export_pallet_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            length_cm DECIMAL(10,2) DEFAULT 0,
            width_cm DECIMAL(10,2) DEFAULT 0,
            max_load_height_cm DECIMAL(10,2) DEFAULT 0,
            tare_weight_kg DECIMAL(10,2) DEFAULT 0,
            max_weight_capacity_kg DECIMAL(10,2) DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;");
        $db->execute();

        // Export Container Types
        $db->query("CREATE TABLE IF NOT EXISTS export_container_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            max_cbm_capacity DECIMAL(10,2) DEFAULT 0,
            max_weight_capacity_kg DECIMAL(10,2) DEFAULT 0,
            max_standard_pallets INT DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;");
        $db->execute();

        // Seed basic containers if empty
        $db->query("SELECT COUNT(*) as count FROM export_container_types");
        if ($db->single()->count == 0) {
            $db->query("INSERT INTO export_container_types (name, max_cbm_capacity, max_weight_capacity_kg, max_standard_pallets) VALUES 
                ('20ft Standard (TEU)', 33.2, 28200, 10),
                ('40ft Standard (FEU)', 67.7, 28800, 21),
                ('40ft High Cube (HQ)', 76.4, 28600, 21),
                ('LCL / Air Freight', 9999, 99999, 999)
            ");
            $db->execute();
        }

        // Seed basic pallets if empty
        $db->query("SELECT COUNT(*) as count FROM export_pallet_types");
        if ($db->single()->count == 0) {
            $db->query("INSERT INTO export_pallet_types (name, length_cm, width_cm, max_load_height_cm, tare_weight_kg, max_weight_capacity_kg) VALUES 
                ('Euro Pallet (120x80)', 120, 80, 180, 25, 1500),
                ('Standard ISO Pallet (120x100)', 120, 100, 180, 30, 1500)
            ");
            $db->execute();
        }
        
        // Term Factor Defaults (Mapping Terms to Factors)
        $db->query("CREATE TABLE IF NOT EXISTS term_factor_defaults (
            id INT AUTO_INCREMENT PRIMARY KEY,
            shipping_term VARCHAR(20) NOT NULL,
            factor_id INT NOT NULL,
            FOREIGN KEY (factor_id) REFERENCES logistics_factors(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;");
        $db->execute();
        
        // Add item-level packing fields to parts table
        $db->query("SHOW COLUMNS FROM parts LIKE 'packing_type'");
        if (empty($db->resultSet())) {
            $db->query("ALTER TABLE parts 
                ADD COLUMN IF NOT EXISTS net_weight_kg DECIMAL(10,3) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS gross_weight_kg DECIMAL(10,3) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS units_per_carton INT DEFAULT 1,
                ADD COLUMN IF NOT EXISTS packing_type VARCHAR(50) DEFAULT 'Carton',
                ADD COLUMN IF NOT EXISTS carton_length_cm DECIMAL(10,2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS carton_width_cm DECIMAL(10,2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS carton_height_cm DECIMAL(10,2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS volume_cbm DECIMAL(15,6) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS carton_tare_weight_kg DECIMAL(10,3) DEFAULT 0
            ");
            $db->execute();
        }
    }
}
