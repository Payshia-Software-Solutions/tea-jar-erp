<?php
/**
 * Install Controller
 * Handles Automated Database and Table Creation via MVC Router
 */

class InstallController extends Controller {

    private function ensureSchema(PDO $pdo) {
        // RBAC tables
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                perm_key VARCHAR(100) NOT NULL UNIQUE,
                description VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS role_permissions (
                role_id INT NOT NULL,
                permission_id INT NOT NULL,
                PRIMARY KEY (role_id, permission_id),
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
            )
        ");

        // Seed roles
        $pdo->exec("INSERT IGNORE INTO roles (name) VALUES ('Admin'), ('Workshop Officer'), ('Factory Officer')");

        // Company + multi-location setup
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS company (
                id INT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                address VARCHAR(255) NULL,
                phone VARCHAR(50) NULL,
                email VARCHAR(255) NULL,
                logo_filename VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");
        $pdo->exec("INSERT IGNORE INTO company (id, name) VALUES (1, 'ServiceBay')");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS service_locations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                location_type ENUM('service','warehouse') NOT NULL DEFAULT 'service',
                address VARCHAR(255) NULL,
                phone VARCHAR(50) NULL,
                created_by INT NULL,
                updated_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_service_locations_name (name)
            )
        ");
        // Default location
        $pdo->exec("INSERT IGNORE INTO service_locations (id, name) VALUES (1, 'Main')");
        // Best-effort add location_type on older installs
        try {
            $stmt = $pdo->query("SHOW COLUMNS FROM service_locations LIKE 'location_type'");
            $exists = (bool)$stmt->fetch(PDO::FETCH_ASSOC);
            if (!$exists) {
                $pdo->exec("ALTER TABLE service_locations ADD COLUMN location_type ENUM('service','warehouse') NOT NULL DEFAULT 'service' AFTER name");
            }
        } catch (Exception $e) {}

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS departments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                location_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                created_by INT NULL,
                updated_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_departments_loc_name (location_id, name),
                FOREIGN KEY (location_id) REFERENCES service_locations(id) ON DELETE CASCADE
            )
        ");
        // Default department
        $pdo->exec("INSERT IGNORE INTO departments (location_id, name) VALUES (1, 'General')");

        // Core auth + logging tables
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role_id INT NOT NULL,
                location_id INT NOT NULL DEFAULT 1,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_users_role (role_id),
                INDEX idx_users_location (location_id),
                INDEX idx_users_active (is_active),
                FOREIGN KEY (role_id) REFERENCES roles(id)
                ,FOREIGN KEY (location_id) REFERENCES service_locations(id)
            )
        ");

        // Allow assigning a user to multiple locations.
        // users.location_id is treated as the default/primary location.
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS user_locations (
                user_id INT NOT NULL,
                location_id INT NOT NULL,
                PRIMARY KEY (user_id, location_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (location_id) REFERENCES service_locations(id) ON DELETE CASCADE,
                INDEX idx_user_locations_location (location_id)
            )
        ");

        // Units master data (company-wide)
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS units (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                created_by INT NULL,
                updated_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");
        $pdo->exec("INSERT IGNORE INTO units (name) VALUES ('pcs'), ('ltr'), ('kg')");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS audit_logs (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                location_id INT NULL,
                action VARCHAR(100) NOT NULL,
                entity VARCHAR(100) NOT NULL,
                entity_id BIGINT NULL,
                method VARCHAR(10) NOT NULL,
                path VARCHAR(255) NOT NULL,
                ip VARCHAR(64) NULL,
                user_agent VARCHAR(255) NULL,
                details JSON NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_audit_user (user_id),
                INDEX idx_audit_location (location_id),
                INDEX idx_audit_entity (entity, entity_id),
                INDEX idx_audit_action (action),
                INDEX idx_audit_created (created_at)
            )
        ");

        // Migrate existing installs: add role_id and backfill from legacy users.role if present.
        $hasRoleId = false;
        try {
            $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'role_id'");
            $hasRoleId = (bool)$stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $hasRoleId = false;
        }
        if (!$hasRoleId) {
            // Add nullable first so we can backfill without failing.
            $pdo->exec("ALTER TABLE users ADD COLUMN role_id INT NULL");
        }

        // Ensure users.location_id exists and is populated.
        $hasLocationId = false;
        try {
            $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'location_id'");
            $hasLocationId = (bool)$stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $hasLocationId = false;
        }
        if (!$hasLocationId) {
            // Add nullable first to backfill safely.
            $pdo->exec("ALTER TABLE users ADD COLUMN location_id INT NULL");
        }

        // Ensure users.is_active exists and defaults to 1 for existing installs.
        $hasIsActive = false;
        try {
            $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'is_active'");
            $hasIsActive = (bool)$stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $hasIsActive = false;
        }
        if (!$hasIsActive) {
            $pdo->exec("ALTER TABLE users ADD COLUMN is_active TINYINT(1) NULL");
            // Backfill existing users as active so we don't lock out current installs.
            $pdo->exec("UPDATE users SET is_active = 1 WHERE is_active IS NULL");
            $pdo->exec("ALTER TABLE users MODIFY is_active TINYINT(1) NOT NULL DEFAULT 1");
            try { $pdo->exec("ALTER TABLE users ADD INDEX idx_users_active (is_active)"); } catch (Exception $e) {}
        }
        // Ensure role_id has values.
        $hasLegacyRoleCol = false;
        try {
            $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'role'");
            $hasLegacyRoleCol = (bool)$stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $hasLegacyRoleCol = false;
        }
        if ($hasLegacyRoleCol) {
            $pdo->exec("
                UPDATE users u
                INNER JOIN roles r ON r.name = COALESCE(u.role, 'Workshop Officer')
                SET u.role_id = r.id
                WHERE u.role_id IS NULL
            ");

            // After migrating, drop the legacy `role` column so users table relies only on role_id.
            // (Safe to ignore errors if column is already gone or constrained.)
            try { $pdo->exec("ALTER TABLE users DROP COLUMN role"); } catch (Exception $e) {}
        } else {
            $pdo->exec("
                UPDATE users u
                INNER JOIN roles r ON r.name = 'Workshop Officer'
                SET u.role_id = r.id
                WHERE u.role_id IS NULL
            ");
        }
        // Make role_id NOT NULL + add FK if we just added it.
        if (!$hasRoleId) {
            $pdo->exec("ALTER TABLE users MODIFY role_id INT NOT NULL");
            // Add index/fk defensively (may already exist).
            try { $pdo->exec("ALTER TABLE users ADD INDEX idx_users_role (role_id)"); } catch (Exception $e) {}
            try { $pdo->exec("ALTER TABLE users ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id)"); } catch (Exception $e) {}
        }

        // Backfill / enforce location_id with default location 1.
        $pdo->exec("UPDATE users SET location_id = 1 WHERE location_id IS NULL");
        if (!$hasLocationId) {
            $pdo->exec("ALTER TABLE users MODIFY location_id INT NOT NULL DEFAULT 1");
            try { $pdo->exec("ALTER TABLE users ADD INDEX idx_users_location (location_id)"); } catch (Exception $e) {}
            try { $pdo->exec("ALTER TABLE users ADD CONSTRAINT fk_users_location_id FOREIGN KEY (location_id) REFERENCES service_locations(id)"); } catch (Exception $e) {}
        }

        // Ensure every user has at least one entry in user_locations (their primary location).
        try {
            $pdo->exec("
                INSERT IGNORE INTO user_locations (user_id, location_id)
                SELECT id, location_id
                FROM users
                WHERE location_id IS NOT NULL
            ");
        } catch (Exception $e) {
            // ignore
        }

        // Ensure audit_logs.location_id exists (nullable).
        try {
            $stmt = $pdo->query("SHOW COLUMNS FROM audit_logs LIKE 'location_id'");
            $exists = (bool)$stmt->fetch(PDO::FETCH_ASSOC);
            if (!$exists) {
                $pdo->exec("ALTER TABLE audit_logs ADD COLUMN location_id INT NULL");
                try { $pdo->exec("ALTER TABLE audit_logs ADD INDEX idx_audit_location (location_id)"); } catch (Exception $e) {}
            }
        } catch (Exception $e) {
            // ignore
        }

        // Seed permissions (Admin is treated as superuser in code, but we still keep a list here)
        $pdo->exec("
            INSERT IGNORE INTO permissions (perm_key, description) VALUES
            ('orders.read', 'View repair orders'),
            ('orders.write', 'Create/update repair orders'),
            ('vehicles.read', 'View vehicles'),
            ('vehicles.write', 'Create/update/delete vehicles'),
            ('bays.read', 'View service bays'),
            ('bays.write', 'Create/update/delete bays and update status'),
            ('technicians.read', 'View technicians'),
            ('technicians.write', 'Create/update/delete technicians'),
            ('makes.read', 'View vehicle makes'),
            ('makes.write', 'Create/update/delete vehicle makes'),
            ('models.read', 'View vehicle models'),
            ('models.write', 'Create/update/delete vehicle models'),
            ('categories.read', 'View repair categories'),
            ('categories.write', 'Create/update/delete repair categories'),
            ('checklists.read', 'View checklist items'),
            ('checklists.write', 'Create/update/delete checklist items'),
            ('parts.read', 'View item master (parts)'),
            ('parts.write', 'Create/update/delete item master (parts)'),
            ('suppliers.read', 'View suppliers'),
            ('suppliers.write', 'Create/update/delete suppliers'),
            ('purchase.read', 'View purchase orders'),
            ('purchase.write', 'Create/update/delete purchase orders'),
            ('grn.read', 'View goods receive notes'),
            ('grn.write', 'Create/update goods receive notes'),
            ('stock.read', 'View stock movements and balances'),
            ('stock.adjust', 'Adjust stock quantity'),
            ('transfer.read', 'View stock transfer requests'),
            ('transfer.write', 'Create/update stock transfer requests'),
            ('locations.read', 'View service center locations'),
            ('locations.write', 'Create/update/delete service center locations'),
            ('departments.read', 'View departments'),
            ('departments.write', 'Create/update/delete departments'),
            ('company.write', 'Update company details'),
            ('reports.read', 'View reports'),
            ('units.read', 'View units'),
            ('units.write', 'Create/update/delete units'),
            ('payments.read', 'View payments and cheques'),
            ('payments.write', 'Record payments and update cheque status'),
            ('accounting.read', 'View financial accounts and expenses'),
            ('accounting.write', 'Manage chart of accounts and record expenses')
        ");

        // Seed role permissions (Admin is superuser; mappings below are for non-admin roles)
        $roleId = function($name) use ($pdo) {
            $stmt = $pdo->prepare("SELECT id FROM roles WHERE name = ? LIMIT 1");
            $stmt->execute([$name]);
            return (int)$stmt->fetchColumn();
        };
        $permId = function($key) use ($pdo) {
            $stmt = $pdo->prepare("SELECT id FROM permissions WHERE perm_key = ? LIMIT 1");
            $stmt->execute([$key]);
            return (int)$stmt->fetchColumn();
        };
        $grant = function($roleName, $permKey) use ($pdo, $roleId, $permId) {
            $rid = $roleId($roleName);
            $pid = $permId($permKey);
            if ($rid && $pid) {
                $stmt = $pdo->prepare("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
                $stmt->execute([$rid, $pid]);
            }
        };

        // Workshop Officer: broad operational access (no make/model writes by default)
        foreach (['orders.read','orders.write','vehicles.read','vehicles.write','bays.read','bays.write','technicians.read','categories.read','checklists.read','reports.read'] as $p) {
            $grant('Workshop Officer', $p);
        }
        foreach (['makes.read','models.read'] as $p) {
            $grant('Workshop Officer', $p);
        }
        foreach (['parts.read','parts.write','suppliers.read','purchase.read','purchase.write','grn.read','grn.write','stock.read','transfer.read','transfer.write','payments.read','payments.write','accounting.read','accounting.write'] as $p) {
            $grant('Workshop Officer', $p);
        }
        foreach (['units.read'] as $p) {
            $grant('Workshop Officer', $p);
        }

        // Factory Officer: read-mostly, can update orders
        foreach (['orders.read','orders.write','vehicles.read','bays.read','technicians.read','makes.read','models.read','categories.read','checklists.read','reports.read'] as $p) {
            $grant('Factory Officer', $p);
        }
        foreach (['parts.read','suppliers.read','purchase.read','grn.read','stock.read','transfer.read','payments.read'] as $p) {
            $grant('Factory Officer', $p);
        }
        foreach (['units.read'] as $p) {
            $grant('Factory Officer', $p);
        }

        // Ensure a default admin user exists for development.
        $rid = (int)$pdo->query("SELECT id FROM roles WHERE name = 'Admin' LIMIT 1")->fetchColumn();
        if (!$rid) {
            $pdo->exec("INSERT IGNORE INTO roles (name) VALUES ('Admin')");
            $rid = (int)$pdo->query("SELECT id FROM roles WHERE name = 'Admin' LIMIT 1")->fetchColumn();
        }
        $stmt = $pdo->prepare("SELECT id, password_hash FROM users WHERE email = ? LIMIT 1");
        $stmt->execute(['admin@local']);
        $adminRow = $stmt->fetch(PDO::FETCH_ASSOC);
        $desiredHash = password_hash('admin123', PASSWORD_BCRYPT);
        if (!$adminRow) {
            $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)");
            $stmt->execute(['Admin', 'admin@local', $desiredHash, $rid]);
        } else {
            // If the password doesn't match, reset to the default dev password.
            $currentHash = (string)($adminRow['password_hash'] ?? '');
            $needsReset = !$currentHash || !password_verify('admin123', $currentHash);
            if ($needsReset) {
                $stmt = $pdo->prepare("UPDATE users SET password_hash = ?, role_id = ? WHERE id = ?");
                $stmt->execute([$desiredHash, $rid, (int)$adminRow['id']]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET role_id = ? WHERE id = ?");
                $stmt->execute([$rid, (int)$adminRow['id']]);
            }
        }

        // Ensure created_by/updated_by columns exist across tables in existing databases.
        $tables = [
            'repair_orders',
            'parts',
            'order_parts',
            'units',
            'suppliers',
            'purchase_orders',
            'purchase_order_items',
            'goods_receive_notes',
            'grn_items',
            'stock_movements',
            'stock_adjustments',
            'stock_adjustment_items',
            'technicians',
            'service_bays',
            'repair_categories',
            'checklist_items',
            'vehicles',
            'vehicle_makes',
            'vehicle_models',
            'checklist_templates'
        ];
        foreach ($tables as $t) {
            // Create checklist_templates if missing (older installs)
            if ($t === 'checklist_templates') {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS checklist_templates (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        description TEXT NOT NULL,
                        created_by INT NULL,
                        updated_by INT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                ");
            }
            foreach (['created_by', 'updated_by'] as $col) {
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
                ");
                $stmt->execute([DB_NAME, $t, $col]);
                $exists = (int)$stmt->fetchColumn() > 0;
                if (!$exists) {
                    // Keep nullable to avoid breaking existing seed data.
                    $pdo->exec("ALTER TABLE {$t} ADD COLUMN {$col} INT NULL");
                }
            }
        }

        // Ensure repair_orders has the fields used by the frontend create/order flow.
        $orderCols = [
            'location_id' => "INT NULL",
            'vehicle_id' => "INT NULL",
            'vehicle_identifier' => "VARCHAR(100) NULL",
            'mileage' => "INT NULL",
            'priority' => "VARCHAR(20) NULL",
            'expected_time' => "DATETIME NULL",
            'comments' => "TEXT NULL",
            'categories_json' => "TEXT NULL",
            'checklist_json' => "TEXT NULL",
            'attachments_json' => "TEXT NULL",
            'location' => "VARCHAR(50) NULL",
            'technician' => "VARCHAR(255) NULL",
        ];
        foreach ($orderCols as $col => $def) {
            try {
                $stmt = $pdo->query("SHOW COLUMNS FROM repair_orders LIKE '{$col}'");
                $exists = (bool)$stmt->fetch(PDO::FETCH_ASSOC);
                if (!$exists) {
                    $pdo->exec("ALTER TABLE repair_orders ADD COLUMN {$col} {$def}");
                }
            } catch (Exception $e) {
                // ignore
            }
        }

        // Multi-location support:
        // Only repair_orders and service_bays are location-scoped.
        foreach (['repair_orders', 'service_bays'] as $t) {
            try {
                $stmt = $pdo->query("SHOW COLUMNS FROM {$t} LIKE 'location_id'");
                $exists = (bool)$stmt->fetch(PDO::FETCH_ASSOC);
                if (!$exists) {
                    $pdo->exec("ALTER TABLE {$t} ADD COLUMN location_id INT NULL");
                }
                try { $pdo->exec("UPDATE {$t} SET location_id = 1 WHERE location_id IS NULL"); } catch (Exception $e2) {}
                try { $pdo->exec("ALTER TABLE {$t} MODIFY location_id INT NOT NULL DEFAULT 1"); } catch (Exception $e3) {}
                try { $pdo->exec("ALTER TABLE {$t} ADD INDEX idx_{$t}_location (location_id)"); } catch (Exception $e4) {}
            } catch (Exception $e) {
                // ignore
            }
        }

        // Ensure vehicles can be assigned to departments.
        try {
            $stmt = $pdo->query("SHOW COLUMNS FROM vehicles LIKE 'department_id'");
            $exists = (bool)$stmt->fetch(PDO::FETCH_ASSOC);
            if (!$exists) {
                $pdo->exec("ALTER TABLE vehicles ADD COLUMN department_id INT NULL");
                try { $pdo->exec("ALTER TABLE vehicles ADD INDEX idx_vehicles_department (department_id)"); } catch (Exception $e2) {}
            }
        } catch (Exception $e) {
            // ignore
        }

        // Ensure vehicles has image filename column for FTP-hosted images.
        try {
            $stmt = $pdo->query("SHOW COLUMNS FROM vehicles LIKE 'image_filename'");
            $exists = (bool)$stmt->fetch(PDO::FETCH_ASSOC);
            if (!$exists) {
                $pdo->exec("ALTER TABLE vehicles ADD COLUMN image_filename VARCHAR(255) NULL");
            }
        } catch (Exception $e) {
            // ignore
        }
    }

    public function index() {
        $response = [
            'status' => 'pending',
            'steps' => []
        ];

        try {
            // 1. Connect to MySQL (No DB selected)
            $dsn = "mysql:host=" . DB_HOST;
            $pdo = new PDO($dsn, DB_USER, DB_PASS);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $response['steps'][] = ['name' => 'Connection', 'status' => 'success', 'message' => 'Connected to MySQL server'];

            if ($_SERVER['REQUEST_METHOD'] == 'POST') {
                // 2. Create Database
                $pdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME);
                $response['steps'][] = ['name' => 'Database', 'status' => 'success', 'message' => 'Database ' . DB_NAME . ' created or already exists'];

                // 3. Switch to Database
                $pdo->exec("USE " . DB_NAME);

                // 4. Read database.sql
                // Note: We need to go up from controllers/ to apps/ then server root
                $sqlPath = APPROOT . '/database.sql';
                
                if (file_exists($sqlPath)) {
                    $sql = file_get_contents($sqlPath);
                    
                    // Split by semicolon and filter out empty statements
                    $statements = array_filter(array_map('trim', explode(';', $sql)));
                    
                    foreach ($statements as $statement) {
                        if (!empty($statement)) {
                            $pdo->exec($statement);
                        }
                    }

                    // Ensure auth + logging tables exist and are seeded.
                    $this->ensureSchema($pdo);
                    
                    $response['steps'][] = ['name' => 'Tables', 'status' => 'success', 'message' => 'Tables created and mock data inserted successfully'];
                    
                    $response['status'] = 'success';
                    $response['message'] = 'Installation completed successfully!';
                } else {
                    throw new Exception('database.sql file not found at ' . $sqlPath);
                }
            } else {
                // GET request - Check status
                $stmt = $pdo->query("SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '" . DB_NAME . "'");
                $dbExists = (bool)$stmt->fetchColumn();
                
                $response['status'] = 'ready';
                $response['exists'] = $dbExists;
                $response['message'] = $dbExists ? 'Database already exists.' : 'System is ready for installation.';
            }

        } catch (Exception $e) {
            $response['status'] = 'error';
            $response['message'] = $e->getMessage();
            $response['steps'][] = ['name' => 'Error', 'status' => 'failed', 'message' => $e->getMessage()];
        }

        $this->json($response);
    }

    public function seeds() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $response = [
                'status' => 'pending',
                'logs' => []
            ];
            try {
                $dsn = "mysql:host=" . DB_HOST;
                $pdo = new PDO($dsn, DB_USER, DB_PASS);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                $response['logs'][] = "Connected to MySQL Server.";

                // Create DB if not exists
                $pdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME);
                $response['logs'][] = "Database '" . DB_NAME . "' verified/created.";

                $pdo->exec("USE " . DB_NAME);
                
                $sqlPath = APPROOT . '/clean_database_template.sql';
                if (!file_exists($sqlPath)) {
                    throw new Exception("Clean database template file not found at " . $sqlPath);
                }

                $response['logs'][] = "Reading clean_database_template.sql...";
                $sql = file_get_contents($sqlPath);

                // Disable foreign key checks
                $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
                $response['logs'][] = "Disabled foreign key checks temporarily.";

                // Split SQL by semicolon, skipping comments and empty lines.
                // Clean database template SQL statements are separated by ;\n\n or ;\r\n\r\n.
                $statements = preg_split('/;(?:\r?\n)+/', $sql);
                
                $executed = 0;
                $total = count($statements);
                
                $response['logs'][] = "Executing " . $total . " database statements...";

                foreach ($statements as $stmt) {
                    $stmt = trim($stmt);
                    if (empty($stmt)) continue;
                    
                    $pdo->exec($stmt);
                    $executed++;
                }

                $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
                $response['logs'][] = "Enabled foreign key checks.";
                $response['logs'][] = "Successfully executed " . $executed . " statements.";
                $response['status'] = 'success';
                $response['message'] = "Database successfully reset and seeded with default dataset!";

            } catch (Exception $e) {
                $response['status'] = 'error';
                $response['message'] = $e->getMessage();
                $response['logs'][] = "ERROR: " . $e->getMessage();
            }
            $this->json($response);
        }

        // GET request - Output beautiful UI
        header('Content-Type: text/html; charset=utf-8');
        ?>
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Tea Jar ERP - Database Seed Center</title>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
            <style>
                :root {
                    --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
                    --glass-bg: rgba(30, 41, 59, 0.7);
                    --glass-border: rgba(255, 255, 255, 0.08);
                    --primary: #6366f1;
                    --primary-hover: #4f46e5;
                    --primary-glow: rgba(99, 102, 241, 0.4);
                    --accent: #14b8a6;
                    --text: #f8fafc;
                    --text-muted: #94a3b8;
                    --danger: #ef4444;
                    --success: #10b981;
                }

                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                body {
                    font-family: 'Outfit', sans-serif;
                    background: var(--bg-gradient);
                    color: var(--text);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow-x: hidden;
                    padding: 20px;
                }

                .container {
                    background: var(--glass-bg);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid var(--glass-border);
                    border-radius: 24px;
                    width: 100%;
                    max-width: 650px;
                    padding: 40px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    position: relative;
                    overflow: hidden;
                }

                .container::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%);
                    pointer-events: none;
                }

                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .logo-icon {
                    font-size: 3rem;
                    margin-bottom: 10px;
                    display: inline-block;
                    animation: float 4s ease-in-out infinite;
                }

                h1 {
                    font-weight: 800;
                    font-size: 2.2rem;
                    background: linear-gradient(to right, #a5b4fc, #818cf8, #2dd4bf);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 8px;
                }

                .subtitle {
                    color: var(--text-muted);
                    font-size: 1rem;
                }

                .info-box {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 24px;
                    display: flex;
                    gap: 12px;
                    align-items: flex-start;
                }

                .info-box-icon {
                    color: var(--danger);
                    font-size: 1.25rem;
                    font-weight: bold;
                }

                .info-box-text {
                    font-size: 0.9rem;
                    color: #fca5a5;
                    line-height: 1.4;
                }

                .btn {
                    display: block;
                    width: 100%;
                    background: var(--primary);
                    color: var(--text);
                    border: none;
                    border-radius: 12px;
                    padding: 16px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 14px var(--primary-glow);
                    position: relative;
                    overflow: hidden;
                    text-align: center;
                }

                .btn:hover:not(:disabled) {
                    background: var(--primary-hover);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
                }

                .btn:active:not(:disabled) {
                    transform: translateY(1px);
                }

                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .console-wrapper {
                    margin-top: 30px;
                    border-radius: 12px;
                    background: #020617;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    overflow: hidden;
                    display: none;
                }

                .console-header {
                    background: #0f172a;
                    padding: 10px 16px;
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .console-dots {
                    display: flex;
                    gap: 6px;
                }

                .console-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }
                .dot-red { background: #ef4444; }
                .dot-yellow { background: #f59e0b; }
                .dot-green { background: #10b981; }

                .console-body {
                    padding: 16px;
                    font-family: 'Fira Code', monospace;
                    font-size: 0.85rem;
                    line-height: 1.6;
                    max-height: 250px;
                    overflow-y: auto;
                    color: var(--accent);
                }

                .log-line {
                    margin-bottom: 6px;
                    display: flex;
                    gap: 8px;
                }

                .log-line::before {
                    content: '>';
                    color: var(--primary);
                }

                .log-error {
                    color: var(--danger);
                }

                .log-success {
                    color: var(--success);
                }

                .spinner {
                    display: none;
                    width: 20px;
                    height: 20px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: #fff;
                    animation: spin 1s ease-in-out infinite;
                    position: absolute;
                    right: 20px;
                    top: calc(50% - 10px);
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                /* Toast Alert */
                .toast {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    background: var(--glass-bg);
                    backdrop-filter: blur(8px);
                    border: 1px solid var(--glass-border);
                    border-radius: 12px;
                    padding: 16px 24px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
                    transform: translateY(100px);
                    opacity: 0;
                    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                    z-index: 100;
                }

                .toast.show {
                    transform: translateY(0);
                    opacity: 1;
                }

                .toast-icon {
                    font-size: 1.5rem;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <span class="logo-icon">🌱</span>
                    <h1>Database Seed Center</h1>
                    <p class="subtitle">Reset & initialize your ERP environment</p>
                </div>

                <div class="info-box">
                    <span class="info-box-icon">⚠️</span>
                    <div class="info-box-text">
                        <strong>Warning:</strong> This action will drop all existing tables in database <code><?= DB_NAME ?></code> and reload the clean seed dataset. All current transactional data, custom parts, sales, and accounts will be permanently deleted.
                    </div>
                </div>

                <button id="seedBtn" class="btn" onclick="startSeeding()">
                    <span id="btnText">Reset & Load Default Seeds</span>
                    <div id="btnSpinner" class="spinner"></div>
                </button>

                <div id="consoleWrapper" class="console-wrapper">
                    <div class="console-header">
                        <div class="console-dots">
                            <div class="console-dot dot-red"></div>
                            <div class="console-dot dot-yellow"></div>
                            <div class="console-dot dot-green"></div>
                        </div>
                        <span>migration-console</span>
                    </div>
                    <div id="consoleBody" class="console-body"></div>
                </div>
            </div>

            <div id="toast" class="toast">
                <span id="toastIcon" class="toast-icon"></span>
                <span id="toastText"></span>
            </div>

            <script>
                function appendLog(text, type = '') {
                    const consoleBody = document.getElementById('consoleBody');
                    const line = document.createElement('div');
                    line.className = 'log-line ' + type;
                    line.textContent = text;
                    consoleBody.appendChild(line);
                    consoleBody.scrollTop = consoleBody.scrollHeight;
                }

                function showToast(message, success = true) {
                    const toast = document.getElementById('toast');
                    const icon = document.getElementById('toastIcon');
                    const text = document.getElementById('toastText');
                    
                    icon.textContent = success ? '✅' : '❌';
                    text.textContent = message;
                    
                    toast.classList.add('show');
                    setTimeout(() => {
                        toast.classList.remove('show');
                    }, 4000);
                }

                async function startSeeding() {
                    const btn = document.getElementById('seedBtn');
                    const btnText = document.getElementById('btnText');
                    const spinner = document.getElementById('btnSpinner');
                    const consoleWrapper = document.getElementById('consoleWrapper');
                    const consoleBody = document.getElementById('consoleBody');

                    if (!confirm('Are you absolutely sure you want to reset the database? This cannot be undone.')) {
                        return;
                    }

                    // Reset states
                    btn.disabled = true;
                    btnText.textContent = 'Seeding Database...';
                    spinner.style.display = 'block';
                    consoleWrapper.style.display = 'block';
                    consoleBody.innerHTML = '';

                    appendLog('Initiating database reset handshake...', 'log-info');

                    try {
                        const response = await fetch(window.location.href, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        const result = await response.json();
                        
                        if (result.logs && Array.isArray(result.logs)) {
                            result.logs.forEach(log => {
                                if (log.startsWith('ERROR:')) {
                                    appendLog(log, 'log-error');
                                } else {
                                    appendLog(log);
                                }
                            });
                        }

                        if (result.status === 'success') {
                            appendLog('Migration successful!', 'log-success');
                            btnText.textContent = 'Successfully Seeded';
                            showToast(result.message, true);
                        } else {
                            appendLog('Migration failed!', 'log-error');
                            btnText.textContent = 'Seed Failed';
                            btn.disabled = false;
                            showToast(result.message || 'Error running seeds.', false);
                        }
                    } catch (err) {
                        appendLog('Network or Server Error: ' + err.message, 'log-error');
                        btnText.textContent = 'Seed Failed';
                        btn.disabled = false;
                        showToast('Connection failed.', false);
                    } finally {
                        spinner.style.display = 'none';
                    }
                }
            </script>
        </body>
        </html>
        <?php
        exit();
    }
}
