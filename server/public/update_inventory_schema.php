<?php
/**
 * Publicly Accessible Database Migration Runner
 * Can be run via URL: http://<your-server-url>/server/public/update_inventory_schema.php
 * Or via CLI: php update_inventory_schema.php
 */
define('BASE_PATH', dirname(__DIR__));
require_once BASE_PATH . '/config/config.php';
require_once BASE_PATH . '/app/core/Database.php';
require_once BASE_PATH . '/app/core/Controller.php';
require_once BASE_PATH . '/app/core/Model.php';
require_once BASE_PATH . '/app/helpers/InventorySchema.php';
require_once BASE_PATH . '/app/helpers/ShippingSchema.php';

header('Content-Type: text/plain');
echo "Running Schema Updates...\n";
try {
    // InventorySchema::ensure() will seed the document_sequences including 'QT'
    InventorySchema::ensure(true);
    echo "Inventory Schema (and QT sequence) updated.\n";
    
    // ShippingSchema::ensure() will add costing_number column
    ShippingSchema::ensure();
    echo "Shipping Schema (and costing_number) updated.\n";
    
    echo "All updates completed successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
