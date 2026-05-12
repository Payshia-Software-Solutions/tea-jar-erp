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

// Create saas_email_logs table
$db->query("
    CREATE TABLE IF NOT EXISTS saas_email_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        email_type VARCHAR(50) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        cc_recipient VARCHAR(255) DEFAULT NULL,
        status VARCHAR(20) NOT NULL,
        error_message TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (invoice_id),
        FOREIGN KEY (invoice_id) REFERENCES saas_invoices(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");
if ($db->execute()) {
    echo "Successfully created saas_email_logs table.\n";
} else {
    echo "Failed to create saas_email_logs table.\n";
}
