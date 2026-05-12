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

// Convert saas_email_logs to utf8mb4_unicode_ci to match saas_tenants
try {
    $db->query("ALTER TABLE saas_email_logs CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $db->execute();
    echo "Successfully converted saas_email_logs to utf8mb4_unicode_ci.\n";
} catch (Exception $e) {
    echo "Error converting table: " . $e->getMessage() . "\n";
}
