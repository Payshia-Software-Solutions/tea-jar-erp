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

// Add last_sent_at column to saas_invoices
try {
    $db->query("ALTER TABLE saas_invoices ADD COLUMN last_sent_at DATETIME DEFAULT NULL AFTER email_status");
    $db->execute();
    echo "Successfully added last_sent_at column to saas_invoices.\n";
} catch (Exception $e) {
    echo "Error or Column already exists: " . $e->getMessage() . "\n";
}
