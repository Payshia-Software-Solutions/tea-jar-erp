<?php
$pdo = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
$stmt = $pdo->prepare('SELECT p.id, p.part_name FROM parts p WHERE p.part_name LIKE "%Brake Pads%"');
$stmt->execute();
$parts = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($parts);
$pid = $parts[0]['id'];

$stmt = $pdo->prepare("SELECT location_id, SUM(qty_change) as total FROM stock_movements WHERE part_id = ? GROUP BY location_id");
$stmt->execute([$pid]);
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

$stmt = $pdo->prepare("SELECT location_id, batch_id, SUM(qty_change) as total FROM stock_movements WHERE part_id = ? GROUP BY location_id, batch_id");
$stmt->execute([$pid]);
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
