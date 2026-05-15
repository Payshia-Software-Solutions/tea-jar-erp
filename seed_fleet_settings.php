<?php
/**
 * Seed Fleet API settings into database
 */
require_once 'server/config/config.php';
require_once 'server/app/core/Database.php';
require_once 'server/app/core/Model.php';
require_once 'server/app/helpers/SystemSchema.php';
require_once 'server/app/models/SystemSetting.php';

// Initialize DB
$db = new Database();

// Ensure table exists
SystemSchema::ensure();

$settings = new SystemSetting();

$fleetUrl = 'http://220.247.236.239/api/Export_API/vehicales_INFO.php';
$fleetToken = 'a568090e-1958-4d72-9ed7-659fe2376532';

$settings->update('FLEET_API_URL', $fleetUrl);
$settings->update('FLEET_API_TOKEN', $fleetToken);

echo "Settings seeded successfully:\n";
echo "FLEET_API_URL: $fleetUrl\n";
echo "FLEET_API_TOKEN: $fleetToken\n";
