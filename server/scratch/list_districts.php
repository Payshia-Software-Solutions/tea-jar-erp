<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../app/core/Database.php';

$db = new Database();
$db->query("SELECT id, name FROM districts");
$districts = $db->resultSet();

foreach ($districts as $d) {
    echo "ID: " . $d->id . " | Name: " . $d->name . "\n";
}
