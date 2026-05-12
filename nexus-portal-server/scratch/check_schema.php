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

echo "--- saas_invoices schema ---\n";
$db->query("DESCRIBE saas_invoices");
foreach ($db->resultSet() as $col) {
    echo "{$col->Field} - {$col->Type}\n";
}

echo "\n--- saas_email_logs schema ---\n";
$db->query("DESCRIBE saas_email_logs");
foreach ($db->resultSet() as $col) {
    echo "{$col->Field} - {$col->Type}\n";
}
