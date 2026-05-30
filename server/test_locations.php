<?php
$pdo = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
$stmt = $pdo->query("SELECT id, city FROM locations");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
