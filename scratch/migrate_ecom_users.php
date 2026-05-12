<?php
require_once __DIR__ . '/../server/app/core/Database.php';
require_once __DIR__ . '/../server/app/config/config.php';

$db = new Database();

echo "Checking customers table for e-commerce fields...\n";

$cols = [
    'password' => "VARCHAR(255) NULL",
    'is_ecommerce_user' => "TINYINT(1) DEFAULT 0",
    'last_login' => "DATETIME NULL"
];

foreach ($cols as $col => $def) {
    $db->query("SHOW COLUMNS FROM customers LIKE '{$col}'");
    if (!$db->single()) {
        echo "Adding column {$col}...\n";
        $db->query("ALTER TABLE customers ADD COLUMN {$col} {$def}");
        $db->execute();
    }
}

echo "Done.\n";
