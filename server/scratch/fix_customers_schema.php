<?php
/**
 * Schema helper to add e-commerce columns to customers table.
 */
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../app/core/Database.php';

$db = new Database();

echo "Checking customers table for missing columns...\n";

$columnsToAdd = [
    'city' => 'VARCHAR(255) NULL AFTER address',
    'postal_code' => 'VARCHAR(20) NULL AFTER city'
];

foreach ($columnsToAdd as $col => $definition) {
    $db->query("SHOW COLUMNS FROM customers LIKE :col");
    $db->bind(':col', $col);
    if (!$db->single()) {
        echo "Adding column '$col' to customers table...\n";
        $db->query("ALTER TABLE customers ADD $col $definition");
        $db->execute();
    } else {
        echo "Column '$col' already exists.\n";
    }
}

echo "Done!\n";
