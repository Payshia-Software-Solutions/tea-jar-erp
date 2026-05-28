<?php
/**
 * HRMSchema
 * auto-migrations for HRM tables.
 */
class HRMSchema {
    private static $done = false;

    private static function pdo() {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    }

    private static function hasColumn(PDO $pdo, $table, $col) {
        $stmt = $pdo->prepare("SHOW COLUMNS FROM {$table} LIKE ?");
        $stmt->execute([$col]);
        return (bool)$stmt->fetch(PDO::FETCH_ASSOC);
    }

    private static function hasTable(PDO $pdo, $table) {
        $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$table]);
        return (bool)$stmt->fetch(PDO::FETCH_ASSOC);
    }

    public static function ensure($force = false) {
        if (!$force && !defined('FORCE_MIGRATIONS')) return;
        if (self::$done && !$force) return;
        self::$done = true;

        try {
            $pdo = self::pdo();

            // 1. HR Departments table
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS hr_departments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) UNIQUE NOT NULL,
                    prefix VARCHAR(10) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB
            ");

            // Seed some departments if empty
            $stmt = $pdo->query("SELECT COUNT(*) FROM hr_departments");
            if ($stmt->fetchColumn() == 0) {
                $pdo->exec("INSERT IGNORE INTO hr_departments (name, prefix) VALUES 
                    ('Administration', 'ADM'),
                    ('Finance', 'FIN'),
                    ('Operations', 'OPS'),
                    ('Technical', 'TEC'),
                    ('Sales', 'SLS')
                ");
            }

            // 2. Employee Categories table
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS hr_categories (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(50) UNIQUE NOT NULL,
                    prefix VARCHAR(10) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB
            ");

            // Seed some categories if empty
            $stmt = $pdo->query("SELECT COUNT(*) FROM hr_categories");
            if ($stmt->fetchColumn() == 0) {
                $pdo->exec("INSERT INTO hr_categories (name, prefix) VALUES 
                    ('Executive', 'EX'),
                    ('Staff', 'ST'),
                    ('Worker', 'WR'),
                    ('Contract', 'CT')
                ");
            }

            // 3. Employees table
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS employees (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    employee_code VARCHAR(50) UNIQUE NOT NULL,
                    user_id INT NULL,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    nic VARCHAR(20) UNIQUE NULL,
                    dob DATE NULL,
                    gender ENUM('Male', 'Female', 'Other') NULL,
                    address TEXT NULL,
                    phone VARCHAR(20) NULL,
                    email VARCHAR(100) NULL,
                    
                    -- New Advanced Fields
                    nationality VARCHAR(100) NULL,
                    religion VARCHAR(100) NULL,
                    marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed') NULL,
                    blood_group VARCHAR(5) NULL,
                    emergency_contact_name VARCHAR(100) NULL,
                    emergency_contact_phone VARCHAR(20) NULL,
                    emergency_contact_relationship VARCHAR(50) NULL,
                    passport_no VARCHAR(50) NULL,
                    epf_no VARCHAR(50) NULL,
                    etf_no VARCHAR(50) NULL,
                    facebook_url VARCHAR(255) NULL,
                    linkedin_url VARCHAR(255) NULL,
                    twitter_url VARCHAR(255) NULL,
                    instagram_url VARCHAR(255) NULL,
                    
                    bank_account_no VARCHAR(50) NULL,
                    bank_name VARCHAR(100) NULL,
                    category_id INT NULL,
                    department_id INT NULL,
                    designation VARCHAR(100) NULL,
                    joined_date DATE NULL,
                    basic_salary DECIMAL(15,2) DEFAULT 0.00,
                    avatar_url VARCHAR(255) NULL,
                    status ENUM('Active', 'Inactive', 'Terminated', 'Resigned') DEFAULT 'Active',
                    created_by INT NULL,
                    updated_by INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_emp_dept (department_id),
                    INDEX idx_emp_cat (category_id),
                    INDEX idx_emp_user (user_id)
                ) ENGINE=InnoDB
            ");

            // Check for new columns
            $newCols = [
                'nationality' => "VARCHAR(100) NULL",
                'religion' => "VARCHAR(100) NULL",
                'marital_status' => "ENUM('Single', 'Married', 'Divorced', 'Widowed') NULL",
                'blood_group' => "VARCHAR(5) NULL",
                'emergency_contact_name' => "VARCHAR(100) NULL",
                'emergency_contact_phone' => "VARCHAR(20) NULL",
                'emergency_contact_relationship' => "VARCHAR(50) NULL",
                'passport_no' => "VARCHAR(50) NULL",
                'epf_no' => "VARCHAR(50) NULL",
                'etf_no' => "VARCHAR(50) NULL",
                'facebook_url' => "VARCHAR(255) NULL",
                'linkedin_url' => "VARCHAR(255) NULL",
                'twitter_url' => "VARCHAR(255) NULL",
                'instagram_url' => "VARCHAR(255) NULL",
                'avatar_url' => "VARCHAR(255) NULL"
            ];

            foreach ($newCols as $col => $def) {
                if (!self::hasColumn($pdo, 'employees', $col)) {
                    $pdo->exec("ALTER TABLE employees ADD COLUMN {$col} {$def}");
                }
            }

            // 4. Salary Items table (Per-Employee Template)
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS hr_salary_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    employee_id INT NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    amount DECIMAL(15,2) NOT NULL,
                    type ENUM('Allowance', 'Deduction') NOT NULL,
                    is_recurring TINYINT(1) DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_hsi_emp (employee_id),
                    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
                ) ENGINE=InnoDB
            ");

            // 4.5 Global Salary Templates (Schemes)
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS hr_salary_templates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB
            ");

            $pdo->exec("
                CREATE TABLE IF NOT EXISTS hr_salary_template_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    template_id INT NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    amount DECIMAL(15,2) NOT NULL,
                    type ENUM('Allowance', 'Deduction') NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_hsti_temp (template_id),
                    FOREIGN KEY (template_id) REFERENCES hr_salary_templates(id) ON DELETE CASCADE
                ) ENGINE=InnoDB
            ");

            // 4.6 Employee Documents
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS hr_employee_documents (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    employee_id INT NOT NULL,
                    title VARCHAR(150) NOT NULL,
                    file_path VARCHAR(255) NOT NULL,
                    file_name VARCHAR(150) NULL,
                    file_type VARCHAR(50) NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_hed_emp (employee_id),
                    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
                ) ENGINE=InnoDB
            ");

            // 4.7 HR Settings Table
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS hr_settings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    setting_key VARCHAR(100) UNIQUE NOT NULL,
                    setting_value TEXT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB
            ");

            // Seed default Payroll Rules if empty
            $stmt = $pdo->query("SELECT COUNT(*) FROM hr_settings");
            if ($stmt->fetchColumn() == 0) {
                $defaults = [
                    'PAYROLL_LATE_PENALTY' => '0.00',
                    'PAYROLL_ABSENCE_DEDUCTION_TYPE' => 'daily_fraction', // 'daily_fraction' or 'fixed'
                    'PAYROLL_ABSENCE_FIXED_AMOUNT' => '0.00',
                    'PAYROLL_AUTO_CALC_ATTENDANCE' => '1'
                ];
                $ins = $pdo->prepare("INSERT INTO hr_settings (setting_key, setting_value) VALUES (?, ?)");
                foreach ($defaults as $k => $v) {
                    $ins->execute([$k, $v]);
                }
            }

            // 5. Attendance table
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS attendance (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    employee_id INT NOT NULL,
                    date DATE NOT NULL,
                    clock_in DATETIME NULL,
                    clock_out DATETIME NULL,
                    status ENUM('Present', 'Absent', 'Late', 'Half-Day') DEFAULT 'Present',
                    notes TEXT NULL,
                    location_id INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_emp_date (employee_id, date),
                    INDEX idx_att_date (date),
                    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
                ) ENGINE=InnoDB
            ");

            // 6. Leave Types table
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS leave_types (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(50) UNIQUE NOT NULL,
                    allocation_per_year INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB
            ");

            // 7. Leave Requests table
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS leave_requests (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    employee_id INT NOT NULL,
                    leave_type_id INT NOT NULL,
                    start_date DATE NOT NULL,
                    end_date DATE NOT NULL,
                    total_days DECIMAL(5,1) NOT NULL,
                    reason TEXT NULL,
                    status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') DEFAULT 'Pending',
                    approved_by INT NULL,
                    approved_at DATETIME NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_lr_emp (employee_id),
                    INDEX idx_lr_status (status),
                    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id)
                ) ENGINE=InnoDB
            ");

            // 8. Payroll table
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS payroll (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    employee_id INT NOT NULL,
                    month INT NOT NULL,
                    year INT NOT NULL,
                    basic_salary DECIMAL(15,2) NOT NULL,
                    allowances DECIMAL(15,2) DEFAULT 0.00,
                    deductions DECIMAL(15,2) DEFAULT 0.00,
                    net_salary DECIMAL(15,2) NOT NULL,
                    breakdown LONGTEXT NULL,
                    status ENUM('Draft', 'Approved', 'Paid') DEFAULT 'Draft',
                    paid_at DATETIME NULL,
                    created_by INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_payroll_emp_month (employee_id, month, year),
                    INDEX idx_payroll_date (month, year),
                    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
                ) ENGINE=InnoDB
            ");

            // 9. Ensure permissions exist
            if (self::hasTable($pdo, 'permissions')) {
                $pdo->exec("
                    INSERT IGNORE INTO permissions (perm_key, description) VALUES
                    ('hrm.read', 'View HRM records'),
                    ('hrm.write', 'Manage employees and HR settings'),
                    ('attendance.write', 'Mark/edit attendance'),
                    ('leave.write', 'Manage leave requests'),
                    ('payroll.write', 'Process payroll')
                ");

                // Assign to all roles for now (Administrator can refine later)
                $pdo->exec("
                    INSERT IGNORE INTO role_permissions (role_id, permission_id)
                    SELECT r.id, p.id
                    FROM roles r, permissions p
                    WHERE p.perm_key IN ('hrm.read', 'hrm.write', 'attendance.write', 'leave.write', 'payroll.write')
                ");
            }

        } catch (Exception $e) {
            error_log("HRMSchema Error: " . $e->getMessage());
        }
    }
}
