<?php
require_once __DIR__ . '/app/bootstrap.php';
$db = new Database();
$db->query("SELECT id, make, model, vin, current_mileage, next_service_mileage, next_service_date FROM vehicles WHERE next_service_mileage > 0 OR next_service_date IS NOT NULL LIMIT 20");
$rows = $db->resultSet();
echo "Vehicles with service targets:\n";
print_r($rows);

$db->query("SELECT COUNT(*) as cnt FROM vehicles");
$total = $db->single()->cnt;
echo "\nTotal vehicles: " . $total . "\n";
