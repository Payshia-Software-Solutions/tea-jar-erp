<?php
require_once '../config/config.php';
require_once '../app/core/Database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$db = new Database();

$startDate = $_GET['start_date'] ?? date('Y-m-d');
$endDate = $_GET['end_date'] ?? date('Y-m-d');

// 1. Fetch Tracking Logs
try {
    $db->query("SELECT * FROM device_tracking_logs WHERE created_at >= :start_date AND created_at <= :end_date");
    $db->bind(':start_date', $startDate . ' 00:00:00');
    $db->bind(':end_date', $endDate . ' 23:59:59');
    $tracking = $db->resultSet();
} catch (Exception $e) {
    $tracking = ['error' => $e->getMessage()];
}

// 2. Fetch Customer Visits
try {
    $db->query("SELECT * FROM customer_visits WHERE created_at >= :start_date AND created_at <= :end_date");
    $db->bind(':start_date', $startDate . ' 00:00:00');
    $db->bind(':end_date', $endDate . ' 23:59:59');
    $visits = $db->resultSet();
} catch (Exception $e) {
    $visits = ['error' => $e->getMessage()];
}

echo json_encode([
    'date_range' => [$startDate, $endDate],
    'tracking_logs_count' => is_array($tracking) ? count($tracking) : $tracking,
    'tracking_data' => $tracking,
    'customer_visits_count' => is_array($visits) ? count($visits) : $visits,
    'visits_data' => $visits,
]);
