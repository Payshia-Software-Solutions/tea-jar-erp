<?php
require 'c:/xampp/htdocs/rapair-management/server/config/config.php';
require 'c:/xampp/htdocs/rapair-management/server/app/core/Database.php';

$db = new Database();

$db->query("SELECT cv.*, c.name FROM customer_visits cv JOIN customers c ON cv.customer_id = c.id LIMIT 10");
$visits = $db->resultSet();

echo json_encode($visits, JSON_PRETTY_PRINT);
