<?php
require_once 'app/core/Database.php';
require_once 'app/config/config.php';

$db = new Database();
$db->query("SELECT * FROM online_orders");
$orders = $db->resultSet();
echo "Total Orders: " . count($orders) . "\n";
foreach($orders as $o) {
    echo "ID: {$o->id}, No: {$o->order_no}, Location: {$o->location_id}\n";
}
