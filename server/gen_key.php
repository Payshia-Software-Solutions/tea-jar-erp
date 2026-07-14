<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=repair_management_db;charset=utf8mb4', 'root', '');
$key = bin2hex(random_bytes(32));
$stmt = $pdo->prepare('INSERT INTO api_clients (client_name, domain, api_key, is_active, created_at, updated_at) VALUES (?,?,?,1,NOW(),NOW())');
$stmt->execute(['Room Kiosk App', '*', $key]);
echo 'SUCCESS' . PHP_EOL;
echo 'API_KEY=' . $key . PHP_EOL;
