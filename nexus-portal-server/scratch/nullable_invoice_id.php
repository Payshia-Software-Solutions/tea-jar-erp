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

// Make invoice_id nullable in saas_email_logs
try {
    $db->query("ALTER TABLE saas_email_logs MODIFY COLUMN invoice_id INT(11) DEFAULT NULL");
    $db->execute();
    echo "Successfully made invoice_id nullable in saas_email_logs.\n";
} catch (Exception $e) {
    echo "Error updating column: " . $e->getMessage() . "\n";
}
