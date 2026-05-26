<?php
require 'c:/xampp/htdocs/rapair-management/server/config/config.php';
require 'c:/xampp/htdocs/rapair-management/server/app/core/Database.php';

$db = new Database();
$db->query("SELECT CURDATE(), DATE(created_at), created_at FROM customer_visits");
echo json_encode($db->resultSet());
