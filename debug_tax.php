<?php
require_once 'server/app/core/Database.php';
require_once 'server/app/models/Tax.php';
require_once 'server/app/models/ServiceLocation.php';
require_once 'server/app/models/StorefrontSetting.php';

// Mock some constants if needed
define('DB_HOST', '127.0.0.1');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'repair_management_db');

$db = new Database();
$locModel = new ServiceLocation();
$taxModel = new Tax();
$settingModel = new StorefrontSetting();

$locationId = 1;
$location = $locModel->getById($locationId);
$settings = $settingModel->getAll($locationId);

echo "Location: " . ($location->name ?? 'Unknown') . "\n";
echo "Allowed Taxes JSON: " . ($location->allowed_taxes_json ?? 'NULL') . "\n";
echo "Ecom Tax Inclusive: " . ($settings['ecom_tax_inclusive'] ?? 'NULL') . "\n";

$taxIds = !empty($location->allowed_taxes_json) ? json_decode($location->allowed_taxes_json, true) : [];
$taxes = $taxModel->getByIds($taxIds);
echo "Taxes Count: " . count($taxes) . "\n";
foreach ($taxes as $t) {
    echo "- " . $t->tax_name . ": " . $t->rate_percent . "%\n";
}
