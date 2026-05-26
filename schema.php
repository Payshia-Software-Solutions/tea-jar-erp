<?php
$pdo = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
$stmt = $pdo->query("SHOW COLUMNS FROM service_locations");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
