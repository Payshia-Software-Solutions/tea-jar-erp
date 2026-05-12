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
$db->query("SELECT * FROM saas_email_logs ORDER BY created_at DESC LIMIT 5");
$logs = $db->resultSet();

echo "--- Recent Email Logs ---\n";
foreach ($logs as $log) {
    echo "ID: {$log->id} | Invoice: {$log->invoice_id} | To: {$log->recipient} | Status: {$log->status}\n";
}

$db->query("SELECT id, invoice_number, email_status FROM saas_invoices ORDER BY created_at DESC LIMIT 5");
$invoices = $db->resultSet();
echo "\n--- Recent Invoices ---\n";
foreach ($invoices as $inv) {
    echo "ID: {$inv->id} | Num: {$inv->invoice_number} | Email Status: {$inv->email_status}\n";
}
