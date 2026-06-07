<?php
/**
 * SyncHelper
 * Centralized utility to synchronize all database schemas across modules.
 */
class SyncHelper {
    public static function runAll() {
        $results = [];

        // 1. Core Master Data (Pre-requisites)
        try {
            require_once __DIR__ . '/BrandSchema.php';
            require_once __DIR__ . '/TaxSchema.php';
            require_once __DIR__ . '/UnitSchema.php';
            BrandSchema::ensure(true);
            TaxSchema::ensure(true);
            UnitSchema::ensure(true);
            $results[] = ['module' => 'Base Master Data', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'Base Master Data', 'status' => 'error', 'message' => $e->getMessage()];
        }

        // 2. Inventory (Depends on Brand/Tax/Unit)
        try {
            require_once __DIR__ . '/InventorySchema.php';
            InventorySchema::ensure(true); 
            $results[] = ['module' => 'Inventory', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'Inventory', 'status' => 'error', 'message' => $e->getMessage()];
        }

        // 2. Vehicles
        try {
            require_once __DIR__ . '/../models/Vehicle.php';
            $vModel = new Vehicle();
            $vModel->ensureSchema(true);
            $results[] = ['module' => 'Vehicles', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'Vehicles', 'status' => 'error', 'message' => $e->getMessage()];
        }

        // 2.1 Service Locations
        try {
            require_once __DIR__ . '/../models/ServiceLocation.php';
            $slModel = new ServiceLocation();
            $slModel->ensureSchema();
            $results[] = ['module' => 'Service Locations', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'Service Locations', 'status' => 'error', 'message' => $e->getMessage()];
        }

        // 3. Taxes
        try {
            require_once __DIR__ . '/TaxSchema.php';
            TaxSchema::ensure(true);
            $results[] = ['module' => 'Taxes', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'Taxes', 'status' => 'error', 'message' => $e->getMessage()];
        }

        // 4. Invoices
        try {
            require_once __DIR__ . '/InvoiceSchema.php';
            InvoiceSchema::ensure(true);
            $results[] = ['module' => 'Invoices', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'Invoices', 'status' => 'error', 'message' => $e->getMessage()];
        }

        // 5. Customers & Company
        try {
            require_once __DIR__ . '/CustomerSchema.php';
            CustomerSchema::ensure(true);
            require_once __DIR__ . '/CompanySchema.php';
            CompanySchema::ensure(true);
            $results[] = ['module' => 'Profiles', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'Profiles', 'status' => 'error', 'message' => $e->getMessage()];
        }

        // 6. Banks & Branches
        try {
            require_once __DIR__ . '/BankSchema.php';
            BankSchema::ensure(true);
            $results[] = ['module' => 'Banks', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'Banks', 'status' => 'error', 'message' => $e->getMessage()];
        }
        // 7. POS Returns & Refunds
        try {
            require_once __DIR__ . '/SalesReturnSchema.php';
            SalesReturnSchema::ensure(true);
            $results[] = ['module' => 'Returns', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'Returns', 'status' => 'error', 'message' => $e->getMessage()];
        }

        // 8. Accounting
        try {
            require_once __DIR__ . '/AccountingSchema.php';
            AccountingSchema::ensure(true);
            $results[] = ['module' => 'Accounting', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'Accounting', 'status' => 'error', 'message' => $e->getMessage()];
        }

        // 9. API Clients
        try {
            require_once __DIR__ . '/ApiClientsSchema.php';
            ApiClientsSchema::ensure(true);
            $results[] = ['module' => 'API Clients', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'API Clients', 'status' => 'error', 'message' => $e->getMessage()];
        }

        // 10. HRM
        try {
            require_once __DIR__ . '/HRMSchema.php';
            HRMSchema::ensure(true);
            $results[] = ['module' => 'HRM', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'HRM', 'status' => 'error', 'message' => $e->getMessage()];
        }

        // 11. Online Orders
        try {
            require_once __DIR__ . '/OnlineOrderSchema.php';
            OnlineOrderSchema::ensure(true);
            $results[] = ['module' => 'Online Orders', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'Online Orders', 'status' => 'error', 'message' => $e->getMessage()];
        }

        // 12. POS Held Orders
        try {
            require_once __DIR__ . '/PosHeldOrderSchema.php';
            PosHeldOrderSchema::ensure(true);
            $results[] = ['module' => 'POS Held Orders', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'POS Held Orders', 'status' => 'error', 'message' => $e->getMessage()];
        }

        // 13. Promotions
        try {
            require_once __DIR__ . '/PromotionSchema.php';
            PromotionSchema::ensure(true);
            $results[] = ['module' => 'Promotions', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'Promotions', 'status' => 'error', 'message' => $e->getMessage()];
        }

        // 14. System Settings
        try {
            require_once __DIR__ . '/SystemSchema.php';
            SystemSchema::ensure(true);
            $results[] = ['module' => 'System Settings', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'System Settings', 'status' => 'error', 'message' => $e->getMessage()];
        }

        // 15. Payment Receipts
        try {
            require_once __DIR__ . '/../models/PaymentReceipt.php';
            $prModel = new PaymentReceipt();
            $prModel->ensureSchema();
            $results[] = ['module' => 'Payment Receipts', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'Payment Receipts', 'status' => 'error', 'message' => $e->getMessage()];
        }

        // 16. ENUM Synchronization
        try {
            self::syncEnums();
            $results[] = ['module' => 'ENUM Synchronization', 'status' => 'success'];
        } catch (Exception $e) {
            $results[] = ['module' => 'ENUM Synchronization', 'status' => 'error', 'message' => $e->getMessage()];
        }

        return $results;
    }

    private static function syncEnums() {
        $db = new Database();
        $pdo = $db->getDb();
        
        // Define correct ENUMs based on the codebase definitions
        $enums = [
            'online_orders' => [
                'payment_status' => "ENUM('Pending','Paid','Failed') NOT NULL DEFAULT 'Pending'",
                'order_status' => "ENUM('Pending','Processing','Shipped','Completed','Cancelled') NOT NULL DEFAULT 'Pending'",
                'payment_method' => "ENUM('COD','IPG') NOT NULL DEFAULT 'COD'"
            ],
            'cheque_inventory' => [
                'status' => "ENUM('Pending','Deposited','Cleared','Bounced','Cancelled') NOT NULL DEFAULT 'Pending'"
            ],
            'employees' => [
                'status' => "ENUM('Active','Inactive','Terminated','Resigned') DEFAULT 'Active'",
                'marital_status' => "ENUM('Single','Married','Divorced','Widowed') NULL",
                'gender' => "ENUM('Male','Female','Other') NULL"
            ],
            'purchase_orders' => [
                // Include 'Approved' which was in the live DB but missing in the initial schema file
                'status' => "ENUM('Draft','Sent','Partially Received','Received','Cancelled','Approved') NOT NULL DEFAULT 'Draft'"
            ],
            'stock_movements' => [
                'movement_type' => "ENUM('GRN','ORDER_ISSUE','ADJUSTMENT','TRANSFER_IN','TRANSFER_OUT','PRODUCTION_CONSUMPTION','PRODUCTION_RECEIPT','SALE','SALES_RETURN','PURCHASE_RETURN','MATERIAL_ISSUE') NOT NULL"
            ],
            'invoices' => [
                'status' => "ENUM('Unpaid','Partial','Paid','Cancelled') DEFAULT 'Unpaid'"
            ],
            'pos_held_orders' => [
                'order_type' => "ENUM('dine_in','take_away','retail') DEFAULT 'retail'",
                'status' => "ENUM('pending','completed','cancelled') DEFAULT 'pending'"
            ]
        ];

        foreach ($enums as $table => $columns) {
            foreach ($columns as $col => $definition) {
                try {
                    $pdo->exec("ALTER TABLE {$table} MODIFY COLUMN {$col} {$definition}");
                } catch (Exception $e) {
                    error_log("Enum sync failed for {$table}.{$col}: " . $e->getMessage());
                }
            }
        }
    }
}
