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
$query = "
    SELECT l.*, i.invoice_number, t.name as tenant_name
    FROM saas_email_logs l
    LEFT JOIN saas_invoices i ON l.invoice_id = i.id
    LEFT JOIN saas_tenants t ON i.tenant_id = t.id OR (l.invoice_id IS NULL AND l.recipient = t.admin_email)
    ORDER BY l.created_at DESC
";
$db->query($query);
$results = $db->resultSet();

echo "Total results: " . count($results) . "\n";
foreach ($results as $r) {
    echo "ID: {$r->id} | Invoice: {$r->invoice_number} | Tenant: {$r->tenant_name}\n";
}
