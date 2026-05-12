<?php
session_start();
$_SESSION['admin_id'] = 1;
$_SESSION['admin_role'] = 'super_admin';

spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) require $file;
});

require_once __DIR__ . '/../vendor/autoload.php';

// Mock Controller dependencies
require_once __DIR__ . '/../app/Core/Config.php';

// Instantiate controller and run cycle
$_GET['period'] = 'June 2026';
$ctrl = new \App\Controllers\BillingController(['action' => 'runBillingCycle']);

// Since it calls $this->json() which exits, we might need to handle that or just let it run.
// We want to see if it finishes or errors.

try {
    $ctrl->runBillingCycle();
} catch (Exception $e) {
    echo "CAUGHT EXCEPTION: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
