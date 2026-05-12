<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../app/core/Database.php';

$db = new Database();
$db->query("DESCRIBE customers");
$res = $db->resultSet();
foreach ($res as $row) {
    echo $row->Field . " | " . $row->Type . "\n";
}
