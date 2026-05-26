<?php
require 'c:/xampp/htdocs/rapair-management/server/config/config.php';
require 'c:/xampp/htdocs/rapair-management/server/app/core/Database.php';

$db = new Database();
$db->query("SELECT customer_id FROM customer_visits WHERE DATE(created_at) = CURDATE()");
$results = $db->resultSet();
$visitedIds = [];
if ($results) {
    foreach ($results as $row) {
        $visitedIds[] = (int)$row->customer_id;
    }
}
echo json_encode(array_values(array_unique($visitedIds)));
