<?php
/**
 * Nexus Portal API Entry Point
 */
session_start([
    'cookie_lifetime' => 86400,
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax'
]);

// Global CORS Handling
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:3000';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Autoloader (Simple PSR-4)
require_once __DIR__ . '/../vendor/autoload.php';
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relative_class = substr($class, $len);
    
    // Fix for Linux: Try the exact path first, then try lowercase directory fallback
    $path = str_replace('\\', '/', $relative_class);
    $parts = explode('/', $path);
    $filename = array_pop($parts) . '.php';
    $dirPath = count($parts) > 0 ? implode('/', $parts) . '/' : '';
    
    $file = $base_dir . $dirPath . $filename;
    if (file_exists($file)) {
        require $file;
    } else {
        // Fallback: many Linux deployments use lowercase folder names (app/core/Router.php)
        $file_lower_dir = $base_dir . strtolower($dirPath) . $filename;
        if (file_exists($file_lower_dir)) require $file_lower_dir;
    }
});

use App\Core\Router;

$router = new Router();

// Root Health Check
if (empty($_GET['url']) || $_GET['url'] === '/') {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'online',
        'service' => 'Nexus Master ERP API',
        'version' => '1.0.0',
        'api_key_configured' => true,
        'timestamp' => date('Y-m-d H:i:s'),
        'environment' => PHP_OS === 'WINNT' ? 'Development' : 'Production'
    ]);
    exit;
}

// Test Route
if ($_GET['url'] === 'api/test') {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'success', 'message' => 'API Routing is working!']);
    exit;
}

// Routes
$router->add('api/request', ['controller' => 'PortalController', 'action' => 'submitRequest'], 'POST');
$router->add('api/auth/register', ['controller' => 'AuthController', 'action' => 'register'], 'POST');
$router->add('api/auth/verify', ['controller' => 'AuthController', 'action' => 'verify']);
$router->add('api/auth/login', ['controller' => 'AuthController', 'action' => 'login'], 'POST');
$router->add('api/auth/logout', ['controller' => 'AuthController', 'action' => 'logout']);
$router->add('api/auth/check', ['controller' => 'AuthController', 'action' => 'check']);

// SaaS Public Routes
$router->add('api/saas/config/([a-z0-9-]+)', ['controller' => 'SaaSController', 'action' => 'getTenantConfig', 'slug' => '$1']);
$router->add('api/saas/stats', ['controller' => 'SaaSController', 'action' => 'getStats']);
$router->add('api/saas/packages', ['controller' => 'SaaSController', 'action' => 'listPackages']);
$router->add('api/saas/license/check', ['controller' => 'SaaSController', 'action' => 'getLicenseDetails']);

// Admin Protected Routes (Logic in controller handles auth check)
$router->add('api/admin/requests', ['controller' => 'AdminController', 'action' => 'listRequests']);
$router->add('api/admin/requests/update', ['controller' => 'AdminController', 'action' => 'updateStatus'], 'POST');
$router->add('api/admin/users', ['controller' => 'AdminController', 'action' => 'listUsers']);
$router->add('api/admin/users/create', ['controller' => 'AdminController', 'action' => 'createUser'], 'POST');

// SaaS Admin Routes
$router->add('api/admin/tenants', ['controller' => 'SaaSController', 'action' => 'listTenants']);
$router->add('api/admin/tenants/register', ['controller' => 'SaaSController', 'action' => 'registerTenant'], 'POST');
$router->add('api/admin/tenants/update', ['controller' => 'SaaSController', 'action' => 'updateTenant'], 'POST');
$router->add('api/admin/tenants/update-status', ['controller' => 'SaaSController', 'action' => 'updateTenantStatus'], 'POST');
$router->add('api/admin/tenants/delete', ['controller' => 'SaaSController', 'action' => 'deleteTenant'], 'POST');
$router->add('api/admin/tenants/{id}', ['controller' => 'SaaSController', 'action' => 'getTenant']);

$router->add('api/admin/packages', ['controller' => 'SaaSController', 'action' => 'listPackages']);
$router->add('api/admin/packages/{id}', ['controller' => 'SaaSController', 'action' => 'getPackage']);
$router->add('api/admin/packages/create', ['controller' => 'SaaSController', 'action' => 'createPackage'], 'POST');
$router->add('api/admin/packages/update', ['controller' => 'SaaSController', 'action' => 'updatePackage'], 'POST');
$router->add('api/admin/packages/delete', ['controller' => 'SaaSController', 'action' => 'deletePackage'], 'POST');

$router->add('api/client/subscription', ['controller' => 'SaaSController', 'action' => 'getMySubscription']);

// Billing Routes
$router->add('api/admin/billing/run-cycle', ['controller' => 'BillingController', 'action' => 'runBillingCycle'], 'POST');
$router->add('api/admin/billing/list', ['controller' => 'BillingController', 'action' => 'listAll']);
$router->add('api/admin/billing/download', ['controller' => 'BillingController', 'action' => 'download']);
$router->add('api/admin/billing/resend', ['controller' => 'BillingController', 'action' => 'resend']);
$router->add('api/admin/billing/delete', ['controller' => 'BillingController', 'action' => 'deleteInvoice'], 'POST');
$router->add('api/admin/billing/pay', ['controller' => 'BillingController', 'action' => 'processPayment'], 'POST');
$router->add('api/admin/billing/payments/all', ['controller' => 'BillingController', 'action' => 'listAllPayments']);
$router->add('api/admin/billing/payments/delete', ['controller' => 'BillingController', 'action' => 'deletePayment'], 'POST');
$router->add('api/admin/billing/email-logs', ['controller' => 'BillingController', 'action' => 'getEmailLogs']);
$router->add('api/admin/communication/recipients', ['controller' => 'CommunicationController', 'action' => 'getRecipients']);
$router->add('api/admin/communication/send-custom', ['controller' => 'CommunicationController', 'action' => 'sendCustom'], 'POST');
$router->add('api/admin/billing/update', ['controller' => 'BillingController', 'action' => 'update'], 'POST');
$router->add('api/admin/billing/payments', ['controller' => 'BillingController', 'action' => 'getPayments']);
$router->add('api/client/billing/history', ['controller' => 'BillingController', 'action' => 'getMyHistory']);

// Settings & Exchange Rates
$router->add('api/admin/settings/exchange-rates', ['controller' => 'SettingsController', 'action' => 'getExchangeRates']);
$router->add('api/admin/settings/exchange-rates/update', ['controller' => 'SettingsController', 'action' => 'updateExchangeRate'], 'POST');
$router->add('api/admin/settings/exchange-rates/reset', ['controller' => 'SettingsController', 'action' => 'resetExchangeRate'], 'POST');
$router->add('api/admin/settings/exchange-rates/source', ['controller' => 'SettingsController', 'action' => 'updateSyncSource'], 'POST');
$router->add('api/admin/settings/exchange-rates/preview', ['controller' => 'SettingsController', 'action' => 'previewSync'], 'POST');
$router->add('api/admin/settings/exchange-rates/apply', ['controller' => 'SettingsController', 'action' => 'applySync'], 'POST');

// Company Settings
$router->add('api/admin/settings/company', ['controller' => 'SettingsController', 'action' => 'getCompanyInfo']);
$router->add('api/admin/settings/company/update', ['controller' => 'SettingsController', 'action' => 'updateCompanyInfo'], 'POST');
$router->add('api/admin/settings/company/logos', ['controller' => 'SettingsController', 'action' => 'getAvailableLogos']);

// Mail Settings
$router->add('api/admin/settings/mail', ['controller' => 'SettingsController', 'action' => 'getMailSettings']);
$router->add('api/admin/settings/mail/update', ['controller' => 'SettingsController', 'action' => 'updateMailSettings'], 'POST');
$router->add('api/admin/settings/mail/test', ['controller' => 'SettingsController', 'action' => 'testMailConnection'], 'POST');

// Match and Dispatch
$url = $_GET['url'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

$router->dispatch($url, $method);
