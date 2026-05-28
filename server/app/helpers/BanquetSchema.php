<?php
/**
 * BanquetSchema - Database structure for banquet management
 */
class BanquetSchema {
    private static $done = false;

    public static function ensure($force = false) {
        if (!$force && !defined('FORCE_MIGRATIONS')) return;
        if (self::$done) return;
        self::$done = true;

        $db = new Database();

        // 1. Banquet Halls
        $db->query("
            CREATE TABLE IF NOT EXISTS banquet_halls (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                location_id INT DEFAULT 1,
                capacity INT DEFAULT 0,
                price_per_session DECIMAL(15,2) DEFAULT 0.00,
                status ENUM('Available', 'Maintenance', 'Inactive') DEFAULT 'Available',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();

        // 2. Banquet Menus
        $db->query("
            CREATE TABLE IF NOT EXISTS banquet_menus (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price_per_pax DECIMAL(15,2) DEFAULT 0.00,
                cost_price DECIMAL(15,2) DEFAULT 0.00,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();

        // 3. Banquet Menu Items
        $db->query("
            CREATE TABLE IF NOT EXISTS banquet_menu_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                menu_id INT NOT NULL,
                part_id INT NULL,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(50) NOT NULL,
                qty DECIMAL(15,3) DEFAULT 1.000,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (menu_id) REFERENCES banquet_menus(id) ON DELETE CASCADE,
                FOREIGN KEY (part_id) REFERENCES parts(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();

        // Migration for existing tables
        try {
            $db->query("ALTER TABLE banquet_menus ADD COLUMN IF NOT EXISTS cost_price DECIMAL(15,2) DEFAULT 0.00 AFTER price_per_pax");
            $db->execute();
            $db->query("ALTER TABLE banquet_menu_items ADD COLUMN IF NOT EXISTS part_id INT NULL AFTER menu_id");
            $db->execute();
            $db->query("ALTER TABLE banquet_menu_items ADD COLUMN IF NOT EXISTS qty DECIMAL(15,3) DEFAULT 1.000 AFTER category");
            $db->execute();
        } catch (Exception $e) {}

        // 4. Banquet Bookings
        $db->query("
            CREATE TABLE IF NOT EXISTS banquet_bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_no VARCHAR(20) UNIQUE NOT NULL,
                customer_id INT NOT NULL,
                hall_id INT NOT NULL,
                menu_id INT NULL,
                pax_count INT DEFAULT 0,
                booking_date DATE NOT NULL,
                session ENUM('Morning', 'Evening', 'FullDay') DEFAULT 'FullDay',
                status ENUM('Confirmed', 'Cancelled', 'Completed', 'Invoiced') DEFAULT 'Confirmed',
                total_amount DECIMAL(15,2) DEFAULT 0.00,
                advance_paid DECIMAL(15,2) DEFAULT 0.00,
                notes TEXT,
                created_by INT,
                invoice_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id),
                FOREIGN KEY (hall_id) REFERENCES banquet_halls(id),
                FOREIGN KEY (menu_id) REFERENCES banquet_menus(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();

        // Ensure columns exist for existing tables
        try {
            $db->query("ALTER TABLE banquet_bookings ADD COLUMN IF NOT EXISTS menu_id INT NULL AFTER hall_id");
            $db->execute();
            $db->query("ALTER TABLE banquet_bookings ADD COLUMN IF NOT EXISTS pax_count INT DEFAULT 0 AFTER menu_id");
            $db->execute();
            $db->query("ALTER TABLE banquet_bookings ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) DEFAULT 0.00 AFTER total_amount");
            $db->execute();
        } catch (Exception $e) {}

        // 5. Permissions
        if (self::hasTable($db, 'permissions')) {
            $db->query("
                INSERT IGNORE INTO permissions (perm_key, description) VALUES 
                ('banquet.read', 'View banquet bookings'),
                ('banquet.write', 'Manage banquet bookings'),
                ('banquet.menu', 'Manage banquet menus')
            ");
            $db->execute();
        }
        // 6. Banquet Resources (Internal items like Stage, Projector, etc.)
        $db->query("
            CREATE TABLE IF NOT EXISTS banquet_resources (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                name            VARCHAR(150) NOT NULL,
                resource_type   ENUM('Internal', 'External') NOT NULL DEFAULT 'Internal',
                base_price      DECIMAL(12,2) NOT NULL DEFAULT 0,
                selling_price   DECIMAL(12,2) NOT NULL DEFAULT 0,
                default_supplier_id INT NULL,
                is_active       TINYINT(1) DEFAULT 1,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (default_supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();

        try {
            $db->query("ALTER TABLE banquet_resources ADD COLUMN IF NOT EXISTS selling_price DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER base_price");
            $db->execute();
            $db->query("ALTER TABLE banquet_resources ADD COLUMN IF NOT EXISTS default_supplier_id INT NULL AFTER selling_price");
            $db->execute();
            $db->query("ALTER TABLE banquet_resources ADD CONSTRAINT fk_br_supplier FOREIGN KEY (default_supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL");
            $db->execute();
        } catch (Exception $e) {}

        // 7. Banquet Event Assignments (Linking Resources/Vendors to Bookings)
        $db->query("
            CREATE TABLE IF NOT EXISTS banquet_event_assignments (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                booking_id      INT NOT NULL,
                resource_id     INT NULL,
                vendor_id       INT NULL, -- Links to suppliers table
                description     VARCHAR(255) NOT NULL,
                qty             DECIMAL(10,2) NOT NULL DEFAULT 1,
                unit_cost       DECIMAL(12,2) NOT NULL DEFAULT 0,
                unit_price      DECIMAL(12,2) NOT NULL DEFAULT 0,
                status          ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Pending',
                notes           TEXT NULL,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_bea_booking (booking_id),
                INDEX idx_bea_resource (resource_id),
                INDEX idx_bea_vendor (vendor_id)
            )
        ");
        $db->execute();
        
        // 8. Banquet Staff Assignments (Linking HR Employees to Events)
        $db->query("
            CREATE TABLE IF NOT EXISTS banquet_staff_assignments (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                booking_id      INT NOT NULL,
                employee_id     INT NOT NULL,
                role            VARCHAR(100) NULL,
                notes           TEXT NULL,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_bsa_booking (booking_id),
                INDEX idx_bsa_employee (employee_id),
                FOREIGN KEY (booking_id) REFERENCES banquet_bookings(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        $db->execute();

        // Add total_cost column to bookings if not exists
        try {
            $db->query("SELECT total_cost FROM banquet_bookings LIMIT 1");
            $db->execute();
        } catch (Exception $e) {
            $db->query("ALTER TABLE banquet_bookings ADD COLUMN total_cost DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER total_amount");
            $db->execute();
        }
    }

    private static function hasTable($db, $name) {
        try {
            $db->query("SHOW TABLES LIKE :name");
            $db->bind(':name', $name);
            return (bool)$db->single();
        } catch (Exception $e) { return false; }
    }
}
