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

// Change billing_cc_email to TEXT for JSON storage
try {
    $db->query("ALTER TABLE saas_tenants MODIFY COLUMN billing_cc_email TEXT DEFAULT NULL");
    $db->execute();
    echo "Successfully updated billing_cc_email column to TEXT.\n";
} catch (Exception $e) {
    echo "Error updating column: " . $e->getMessage() . "\n";
}
