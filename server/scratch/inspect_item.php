<?php
define('APPROOT', dirname(__DIR__));
require_once APPROOT . '/config/config.php';
require_once APPROOT . '/app/core/Database.php';

try {
    $db = new Database();
    $db->query("SELECT id, part_name, slug, is_active, is_online, allowed_locations, item_type FROM parts ORDER BY id DESC LIMIT 5");
    $rows = $db->resultSet();
    echo "=== LAST 5 ITEMS ===\n";
    print_r($rows);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
