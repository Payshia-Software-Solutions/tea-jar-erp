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

echo "--- Collations ---\n";
$db->query("SHOW FULL COLUMNS FROM saas_email_logs");
foreach ($db->resultSet() as $col) {
    echo "saas_email_logs.{$col->Field}: {$col->Collation}\n";
}

$db->query("SHOW FULL COLUMNS FROM saas_tenants");
foreach ($db->resultSet() as $col) {
    echo "saas_tenants.{$col->Field}: {$col->Collation}\n";
}
