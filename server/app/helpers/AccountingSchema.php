<?php
/**
 * AccountingSchema
 * Handles the initialization of accounting-related tables.
 */
class AccountingSchema {
    private static $done = false;

    private static function pdo() {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
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

            // Ensure goods_receive_notes has total_amount
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS goods_receive_notes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    grn_number VARCHAR(50) NOT NULL,
                    purchase_order_id INT NULL,
                    location_id INT NOT NULL DEFAULT 1,
                    supplier_id INT NOT NULL,
                    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                    tax_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                    received_at DATETIME NOT NULL,
                    notes TEXT NULL,
                    created_by INT NULL,
                    updated_by INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_grn_number (grn_number),
                    INDEX idx_grn_location (location_id),
                    INDEX idx_grn_supplier (supplier_id),
                    INDEX idx_grn_po (purchase_order_id)
                )
            ");

            // Accounts (Chart of Accounts)
            if (!self::hasTable($pdo, 'acc_accounts')) {
                $pdo->exec("
                    CREATE TABLE acc_accounts (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        code VARCHAR(20) NOT NULL UNIQUE,
                        name VARCHAR(255) NOT NULL,
                        type ENUM('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE') NOT NULL,
                        category VARCHAR(100) NULL,
                        is_system TINYINT(1) DEFAULT 0,
                        is_active TINYINT(1) DEFAULT 1,
                        balance DECIMAL(15,2) DEFAULT 0.00,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_acc_type (type)
                    )
                ");
            }

            // Seed default system accounts
            $systemAccounts = [
                ['1000', 'Cash in Hand', 'ASSET', 'Cash'],
                ['1010', 'Bank Account', 'ASSET', 'Cash'],
                ['1200', 'Accounts Receivable', 'ASSET', 'Receivables'],
                ['1250', 'Purchase Tax Claimable', 'ASSET', 'Tax'],
                ['1400', 'Inventory', 'ASSET', 'Inventory'],
                ['1410', 'Work in Progress (WIP)', 'ASSET', 'Inventory'],
                ['2000', 'Accounts Payable', 'LIABILITY', 'Payables'],
                ['2200', 'Sales Tax Payable', 'LIABILITY', 'Tax'],
                ['3000', 'Retained Earnings', 'EQUITY', 'Equity'],
                ['4000', 'Sales Revenue', 'INCOME', 'Revenue'],
                ['4100', 'Service Income', 'INCOME', 'Revenue'],
                ['5000', 'Cost of Goods Sold', 'EXPENSE', 'COGS'],
                ['5100', 'Operating Expenses', 'EXPENSE', 'Expense'],
                ['3010', 'Opening Balance Equity', 'EQUITY', 'Equity']
            ];

            foreach ($systemAccounts as $sa) {
                $stmt = $pdo->prepare("INSERT IGNORE INTO acc_accounts (code, name, type, category, is_system) VALUES (?, ?, ?, ?, 1)");
                $stmt->execute($sa);
            }

            // Journal Entries (Headers)
            if (!self::hasTable($pdo, 'acc_journal_entries')) {
                $pdo->exec("
                    CREATE TABLE acc_journal_entries (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        entry_date DATE NOT NULL,
                        description TEXT NULL,
                        ref_type VARCHAR(50) NULL,
                        ref_id INT NULL,
                        total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                        created_by INT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_aje_ref (ref_type, ref_id),
                        INDEX idx_aje_date (entry_date)
                    )
                ");
            }

            // Journal Items (Lines - Debits/Credits)
            if (!self::hasTable($pdo, 'acc_journal_items')) {
                $pdo->exec("
                    CREATE TABLE acc_journal_items (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        entry_id INT NOT NULL,
                        account_id INT NOT NULL,
                        debit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                        credit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                        partner_type VARCHAR(20) NULL,
                        partner_id INT NULL,
                        notes VARCHAR(255) NULL,
                        reconciled_at DATETIME NULL,
                        INDEX idx_aji_entry (entry_id),
                        INDEX idx_aji_account (account_id),
                        FOREIGN KEY (entry_id) REFERENCES acc_journal_entries(id) ON DELETE CASCADE,
                        FOREIGN KEY (account_id) REFERENCES acc_accounts(id)
                    )
                ");
            } else {
                // Ensure reconciled_at column exists
                $stmt = $pdo->query("SHOW COLUMNS FROM acc_journal_items LIKE 'reconciled_at'");
                if (!$stmt->fetch()) {
                    $pdo->exec("ALTER TABLE acc_journal_items ADD COLUMN reconciled_at DATETIME NULL");
                }
            }

            // Bank Reconciliations
            if (!self::hasTable($pdo, 'acc_reconciliations')) {
                $pdo->exec("
                    CREATE TABLE acc_reconciliations (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        account_id INT NOT NULL,
                        statement_date DATE NOT NULL,
                        statement_balance DECIMAL(15,2) NOT NULL,
                        cleared_balance DECIMAL(15,2) NOT NULL,
                        difference DECIMAL(15,2) NOT NULL,
                        is_finalized TINYINT(1) DEFAULT 0,
                        created_by INT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (account_id) REFERENCES acc_accounts(id)
                    )
                ");
            }

            // Account Mappings (Link system events to specific accounts)
            if (!self::hasTable($pdo, 'acc_mappings')) {
                $pdo->exec("
                    CREATE TABLE acc_mappings (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        map_key VARCHAR(50) NOT NULL UNIQUE,
                        account_id INT NOT NULL,
                        label VARCHAR(100) NOT NULL,
                        category VARCHAR(50) NOT NULL,
                        FOREIGN KEY (account_id) REFERENCES acc_accounts(id)
                    )
                ");
            }

            // Global Accounting Settings
            if (!self::hasTable($pdo, 'acc_settings')) {
                $pdo->exec("
                    CREATE TABLE acc_settings (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        setting_key VARCHAR(50) NOT NULL UNIQUE,
                        setting_value TEXT NULL,
                        description VARCHAR(255) NULL,
                        category VARCHAR(50) DEFAULT 'General'
                    )
                ");

                // Seed default Financial Year (Current Calendar Year)
                $year = date('Y');
                $pdo->exec("
                    INSERT IGNORE INTO acc_settings (setting_key, setting_value, description, category) VALUES
                    ('fy_start', '{$year}-01-01', 'Financial Year Start Date', 'Fiscal'),
                    ('fy_end', '{$year}-12-31', 'Financial Year End Date', 'Fiscal')
                ");
            }
            
            // Seed default mappings
            $mappings = [
                ['invoice_ar', '1200', 'Invoice AR Account', 'Sales'],
                ['invoice_revenue', '4000', 'Invoice Revenue Account', 'Sales'],
                ['invoice_tax', '2200', 'Invoice Tax Account', 'Sales'],
                ['cogs_account', '5000', 'Cost of Goods Sold Account', 'Sales'],
                ['payment_cash', '1000', 'Payment Cash Account', 'Payments'],
                ['payment_bank', '1010', 'Payment Bank Account', 'Payments'],
                ['grn_inventory', '1400', 'GRN Inventory Account', 'Purchases'],
                ['grn_ap', '2000', 'GRN AP Account', 'Purchases'],
                ['sales_return', '4000', 'Sales Return Account', 'Sales'],
                ['purchase_return', '1400', 'Purchase Return Account', 'Purchases'],
                ['inventory_adjustment', '5100', 'Inventory Adjustment Expense', 'Purchases'],
                ['sales_discount', '5100', 'Sales Discount Account', 'Sales'],
                ['purchase_tax', '1250', 'Purchase Input Tax Account', 'Purchases'],
                ['retained_earnings', '3000', 'Retained Earnings Account', 'Equity'],
                ['opening_balance_equity', '3010', 'Opening Balance Equity', 'Equity'],
                ['production_wip', '1410', 'Work in Progress Account', 'Production'],
                ['production_inventory', '1400', 'Production Inventory Account', 'Production'],
                ['production_finished_goods', '1400', 'Finished Goods Inventory Account', 'Production'],
                ['issue_note_expense', '5000', 'Issue Note Expense Account', 'Issue Notes'],
                ['issue_note_inventory', '1400', 'Issue Note Inventory Account', 'Issue Notes']
            ];

            foreach ($mappings as $m) {
                $pdo->exec("
                    INSERT IGNORE INTO acc_mappings (map_key, account_id, label, category) 
                    SELECT '{$m[0]}', id, '{$m[2]}', '{$m[3]}' 
                    FROM acc_accounts 
                    WHERE code = '{$m[1]}' LIMIT 1
                ");
            }

            // Fiscal Periods
            if (!self::hasTable($pdo, 'acc_fiscal_periods')) {
                $pdo->exec("
                    CREATE TABLE acc_fiscal_periods (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(100) NOT NULL,
                        start_date DATE NOT NULL,
                        end_date DATE NOT NULL,
                        is_closed TINYINT(1) DEFAULT 0,
                        is_active TINYINT(1) DEFAULT 0,
                        closing_entry_id INT NULL,
                        closed_at TIMESTAMP NULL,
                        closed_by INT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (closing_entry_id) REFERENCES acc_journal_entries(id)
                    )
                ");
            } else {
                // Ensure is_active column exists for existing tables
                $stmt = $pdo->query("SHOW COLUMNS FROM acc_fiscal_periods LIKE 'is_active'");
                if (!$stmt->fetch()) {
                    $pdo->exec("ALTER TABLE acc_fiscal_periods ADD COLUMN is_active TINYINT(1) DEFAULT 0 AFTER is_closed");
                }
            }

            // Supplier Payments
            if (!self::hasTable($pdo, 'acc_supplier_payments')) {
                $pdo->exec("
                    CREATE TABLE acc_supplier_payments (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        supplier_id INT NOT NULL,
                        grn_id INT NULL,
                        amount DECIMAL(15,2) NOT NULL,
                        payment_date DATE NOT NULL,
                        payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
                        reference_no VARCHAR(100) NULL,
                        notes TEXT NULL,
                        status ENUM('Paid', 'Cancelled') NOT NULL DEFAULT 'Paid',
                        cancelled_at DATETIME NULL,
                        cancelled_by INT NULL,
                        cancellation_reason TEXT NULL,
                        created_by INT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
                        FOREIGN KEY (grn_id) REFERENCES goods_receive_notes(id) ON DELETE SET NULL
                    )
                ");
            } else {
                // Add status column if missing
                $stmt = $pdo->query("SHOW COLUMNS FROM acc_supplier_payments LIKE 'status'");
                if (!$stmt->fetch()) {
                    $pdo->exec("ALTER TABLE acc_supplier_payments ADD COLUMN status ENUM('Paid', 'Cancelled') NOT NULL DEFAULT 'Paid' AFTER notes");
                }
                // Add cancellation columns
                foreach (['cancelled_at' => "DATETIME NULL", 'cancelled_by' => "INT NULL", 'cancellation_reason' => "TEXT NULL"] as $col => $def) {
                    $stmt = $pdo->query("SHOW COLUMNS FROM acc_supplier_payments LIKE '$col'");
                    if (!$stmt->fetch()) {
                        $pdo->exec("ALTER TABLE acc_supplier_payments ADD COLUMN $col $def");
                    }
                }
            }

            // Supplier Payment Allocations (Multi-GRN settlement)
            if (!self::hasTable($pdo, 'acc_supplier_payment_allocations')) {
                $pdo->exec("
                    CREATE TABLE acc_supplier_payment_allocations (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        payment_id INT NOT NULL,
                        grn_id INT NOT NULL,
                        amount DECIMAL(15,2) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (payment_id) REFERENCES acc_supplier_payments(id) ON DELETE CASCADE,
                        FOREIGN KEY (grn_id) REFERENCES goods_receive_notes(id)
                    )
                ");
            }

            // Purchase Returns
            if (!self::hasTable($pdo, 'acc_purchase_returns')) {
                $pdo->exec("
                    CREATE TABLE acc_purchase_returns (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        grn_id INT NULL,
                        supplier_id INT NOT NULL,
                        return_date DATE NOT NULL,
                        subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                        tax_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                        total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                        reason TEXT NULL,
                        created_by INT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (grn_id) REFERENCES goods_receive_notes(id) ON DELETE SET NULL,
                        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
                    )
                ");

                $pdo->exec("
                    CREATE TABLE acc_purchase_return_items (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        return_id INT NOT NULL,
                        part_id INT NOT NULL,
                        quantity DECIMAL(12,3) NOT NULL,
                        unit_cost DECIMAL(10,2) NOT NULL,
                        line_total DECIMAL(15,2) NOT NULL,
                        FOREIGN KEY (return_id) REFERENCES acc_purchase_returns(id) ON DELETE CASCADE,
                        FOREIGN KEY (part_id) REFERENCES parts(id)
                    )
                ");
            }

        } catch (Exception $e) {
            error_log("AccountingSchema error: " . $e->getMessage());
        }
    }
}
