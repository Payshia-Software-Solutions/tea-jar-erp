<?php
$pdo = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
$stmt = $pdo->query('SELECT count(*) FROM cities');
print_r($stmt->fetchAll());
?>
