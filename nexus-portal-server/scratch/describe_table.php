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
$db->query("DESCRIBE saas_invoices");
$res = $db->resultSet();
foreach($res as $r) {
    echo "Field: {$r->Field}, Type: {$r->Type}\n";
}
