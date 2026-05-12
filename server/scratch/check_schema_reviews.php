<?php
require_once 'c:/xampp/htdocs/rapair-management/server/config/config.php';
require_once 'c:/xampp/htdocs/rapair-management/server/app/core/Database.php';

$db = new Database();

echo "PARTS TABLE:\n";
$db->query("DESCRIBE parts");
print_r($db->resultSet());

echo "\nCUSTOMERS TABLE:\n";
$db->query("DESCRIBE customers");
print_r($db->resultSet());
