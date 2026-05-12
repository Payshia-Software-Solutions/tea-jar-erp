<?php
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) require $file;
});

$db = new \App\Core\Database();

// Add billing_cc_email column to saas_tenants
try {
    $db->query("ALTER TABLE saas_tenants ADD COLUMN billing_cc_email VARCHAR(255) DEFAULT NULL AFTER admin_email");
    $db->execute();
    echo "Successfully added billing_cc_email column to saas_tenants.\n";
} catch (Exception $e) {
    echo "Error or Column already exists: " . $e->getMessage() . "\n";
}
