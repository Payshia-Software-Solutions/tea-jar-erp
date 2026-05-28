<?php
require 'c:\xampp\htdocs\rapair-management\server\config\config.php';
require 'c:\xampp\htdocs\rapair-management\server\app\core\Database.php';

$db = new Database();
$db->query("SELECT * FROM promotions");
echo json_encode($db->resultSet(), JSON_PRETTY_PRINT);
