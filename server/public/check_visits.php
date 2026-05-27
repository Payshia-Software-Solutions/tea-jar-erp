<?php
require_once '../config/config.php';
$db = new PDO('mysql:host=127.0.0.1;dbname='.DB_NAME, DB_USER, DB_PASS);
$stmt = $db->query('SELECT * FROM customer_visits');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
