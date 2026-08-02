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

use App\Models\TenantModel;

$model = new TenantModel();

$data = [
    'name' => 'Grand Amanee',
    'address' => 'Grand Amanee Hotel',
    'business_type' => 'Hotel ERP',
    'admin_email' => 'amanee@nebulync.com',
    'contact_number' => '+94771234567',
    'billing_cc_email' => 'accounts@nebulync.com',
    'slug' => 'grand-amanee',
    'package_id' => 3,
    'currency' => 'LKR',
    'db_name' => 'grand_amanee_db',
    'api_url' => 'http://localhost/grand-amanee/server',
];

// Check if tenant already exists
$db = new \App\Core\Database();
$db->query("SELECT * FROM saas_tenants WHERE slug = :slug");
$db->bind(':slug', $data['slug']);
$existing = $db->single();

if ($existing) {
    echo "Tenant already exists!\n";
    echo "License Key: " . $existing->license_key . "\n";
    echo "API Key: " . $existing->api_key . "\n";
} else {
    $result = $model->create($data);
    if ($result) {
        echo "Tenant registered successfully!\n";
        echo "License Key: " . $result['license'] . "\n";
        echo "API Key: " . $result['api_key'] . "\n";
    } else {
        echo "Registration failed!\n";
    }
}
