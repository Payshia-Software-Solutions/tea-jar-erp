<?php
/**
 * Clean Database Template Generator
 * Creates a clean SQL schema dump with only core system configuration, settings,
 * lookup lists, roles, permissions, chart of accounts, cities, logistics factors, etc.
 * Transactional data, custom inventory parts, and customer profiles are excluded.
 */

require_once __DIR__ . '/../config/config.php';

// Configuration tables that should have their lookup data exported:
$configTables = [
    'roles',
    'permissions',
    'role_permissions',
    'system_settings',
    'acc_settings',
    'acc_accounts',
    'acc_mappings',
    'cities',
    'districts',
    'taxes',
    'supplier_taxes',
    'company_taxes',
    'shipping_carriers',
    'shipping_providers',
    'shipping_zones',
    'logistics_categories',
    'logistics_factors',
    'term_factor_defaults',
    'export_container_types',
    'export_packaging_types',
    'export_pallet_types',
    'shipping_costing_templates',
    'shipping_costing_items',
    'banks',
    'bank_branches',
    'service_locations',
    'departments',
    'units',
    'email_templates',
    'leave_types',
    'hr_categories',
    'hr_departments',
    'hr_settings',
    'hr_salary_templates',
    'hr_salary_template_items',
    'printer_settings',
    'storefront_settings',
    'users' // Will be filtered to keep only admin@local
];

$outputFile = __DIR__ . '/../clean_database_template.sql';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $sqlContent = "-- ========================================================\n";
    $sqlContent .= "-- Clean Database Template for ERP / Repair Management System\n";
    $sqlContent .= "-- Generated on: " . date('Y-m-d H:i:s') . "\n";
    $sqlContent .= "-- ========================================================\n\n";
    $sqlContent .= "SET FOREIGN_KEY_CHECKS = 0;\n\n";

    // 1. Get all tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "Exporting database schema...\n";

    foreach ($tables as $table) {
        $sqlContent .= "-- --------------------------------------------------------\n";
        $sqlContent .= "-- Table structure for table `{$table}`\n";
        $sqlContent .= "-- --------------------------------------------------------\n";
        $sqlContent .= "DROP TABLE IF EXISTS `{$table}`;\n";
        
        // Get Create Table definition
        $createStmt = $pdo->query("SHOW CREATE TABLE `{$table}`");
        $createRow = $createStmt->fetch(PDO::FETCH_ASSOC);
        $sqlContent .= $createRow['Create Table'] . ";\n\n";

        // 2. If it's a config/lookup table, export its data
        if (in_array($table, $configTables)) {
            echo "Exporting seed data for: `{$table}`\n";
            
            // Build query
            $query = "SELECT * FROM `{$table}`";
            if ($table === 'users') {
                // Keep only the default admin account
                $query .= " WHERE email = 'admin@local'";
            }
            
            $dataStmt = $pdo->query($query);
            $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($rows) > 0) {
                $sqlContent .= "-- Dumping data for table `{$table}`\n";
                
                // Chunk insert statements to keep the file cleaner
                $columns = array_keys($rows[0]);
                $colNames = implode('`, `', $columns);
                
                $sqlContent .= "INSERT INTO `{$table}` (`{$colNames}`) VALUES\n";
                
                $valueLines = [];
                foreach ($rows as $row) {
                    $values = [];
                    foreach ($columns as $col) {
                        $val = $row[$col];
                        if ($val === null) {
                            $values[] = "NULL";
                        } else {
                            $values[] = $pdo->quote($val);
                        }
                    }
                    $valueLines[] = "(" . implode(', ', $values) . ")";
                }
                
                $sqlContent .= implode(",\n", $valueLines) . ";\n\n";
            }
        }
    }

    $sqlContent .= "SET FOREIGN_KEY_CHECKS = 1;\n";
    
    file_put_contents($outputFile, $sqlContent);
    echo "\nSuccess! Clean database template saved to: " . realpath($outputFile) . "\n";

} catch (Exception $e) {
    echo "Error generating template: " . $e->getMessage() . "\n";
}
