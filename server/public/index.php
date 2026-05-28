<?php
/**
 * Entry Point for the Repair Management API
 */

// Set Server Timezone to Sri Lanka (LK)
date_default_timezone_set('Asia/Colombo');

// Load Configuration
require_once '../config/config.php';

// Load Composer Autoloader
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require_once __DIR__ . '/../vendor/autoload.php';
}

// Enable CORS
// NOTE: When the frontend sends cookies (`credentials: 'include'`), we cannot use `*` for Allow-Origin.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'http://localhost:9003',
    'http://localhost:3000',
    'http://localhost:9002',
    'https://kdu-service.netlify.app',
    'https://bizzflow.nebulync.com',
    'http://bizzflow.nebulync.com',
];

if ($origin && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
} elseif (!$origin) {
    // Non-browser clients (curl/Postman) may not send an Origin header.
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

// Echo back requested headers so preflight succeeds even if the browser adds more.
$reqHeaders = $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ?? '';
if ($reqHeaders) {
    header('Access-Control-Allow-Headers: ' . $reqHeaders);
} else {
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Simple Autoloader (PSR-4 alternative for this structure)
spl_autoload_register(function ($className) {
    // Map namespaces to directories
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/../app/';

    // Logic to load core classes, controllers, and models
    $paths = [
        '../app/core/',
        '../app/controllers/',
        '../app/models/',
        '../app/helpers/'
    ];

    foreach ($paths as $path) {
        $file = __DIR__ . '/' . $path . $className . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

// Initialize the App (Router)
// We'll call the App directly since we aren't using strict namespaces yet for simplicity.
require_once '../app/core/App.php';
require_once '../app/core/Controller.php'; // Base Controller
require_once '../app/core/Database.php';   // Base Database
require_once '../app/core/Model.php';      // Base Model
require_once '../app/helpers/InventorySchema.php'; // Schema Helper
require_once '../app/helpers/PromotionSchema.php';
require_once '../app/helpers/ApiClientsSchema.php';
require_once '../app/helpers/HotelSchema.php';
require_once '../app/helpers/SystemSchema.php';
require_once '../app/helpers/QuotationSchema.php';
require_once '../app/helpers/AccountingSchema.php';
require_once '../app/helpers/BanquetSchema.php';
require_once '../app/helpers/ShippingSchema.php';
require_once '../app/helpers/CRMSchema.php';
require_once '../app/helpers/ShippingCarrierSchema.php';

// Schema checks should be run via a dedicated migration script or endpoint.
// Running them on every request causes massive performance issues and DB locks.
// CityPostalSchema::ensure();
// ShippingCarrierSchema::ensure();
// SystemSchema::ensure();

$init = new App();
