<?php
require dirname(__DIR__) . '/vendor/autoload.php';
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = dirname(__DIR__) . '/app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) require $file;
});

$db = new \App\Core\Database();
$db->query("SELECT i.id, i.invoice_number, i.billing_month, p.name as package_name 
            FROM saas_invoices i 
            JOIN saas_tenants t ON i.tenant_id = t.id 
            LEFT JOIN saas_packages p ON t.package_id = p.id 
            WHERE t.name LIKE '%Grand Silver Ray%'");
print_r($db->resultSet());
