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

// Add subject and body columns to saas_email_logs
try {
    $db->query("ALTER TABLE saas_email_logs ADD COLUMN subject VARCHAR(255) AFTER email_type, ADD COLUMN body LONGTEXT AFTER subject");
    $db->execute();
    echo "Successfully added subject and body columns to saas_email_logs.\n";
} catch (Exception $e) {
    echo "Error adding columns: " . $e->getMessage() . "\n";
}
