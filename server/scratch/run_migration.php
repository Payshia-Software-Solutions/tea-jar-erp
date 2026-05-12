<?php
require_once 'c:/xampp/htdocs/rapair-management/server/config/config.php';
require_once 'c:/xampp/htdocs/rapair-management/server/app/core/Database.php';
require_once 'c:/xampp/htdocs/rapair-management/server/app/helpers/InventorySchema.php';
require_once 'c:/xampp/htdocs/rapair-management/server/app/helpers/BrandSchema.php';
require_once 'c:/xampp/htdocs/rapair-management/server/app/helpers/TaxSchema.php';

echo "Running Inventory Schema migration...\n";
InventorySchema::ensure(true);
echo "Done.\n";
