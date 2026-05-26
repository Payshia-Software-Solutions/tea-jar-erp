<?php
$pdo = new PDO('mysql:host=127.0.0.1;charset=utf8mb4', 'root', '');
$stmt = $pdo->query('SHOW DATABASES');
echo json_encode($stmt->fetchAll(PDO::FETCH_COLUMN));
