<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=repair_management_db;charset=utf8mb4', 'root', '');
$stmt = $pdo->query('SELECT * FROM customer_visits');
if ($stmt) {
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} else {
    echo json_encode($pdo->errorInfo());
}
