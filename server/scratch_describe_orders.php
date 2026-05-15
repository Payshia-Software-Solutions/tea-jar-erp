<?php
require_once 'server/config/config.php';
require_once 'server/app/Libraries/Database.php';

$db = new Database();
$db->query("DESCRIBE repair_orders");
$res = $db->resultSet();
foreach ($res as $row) {
    echo $row->Field . " - " . $row->Type . "\n";
}
