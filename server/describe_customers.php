<?php
$pdo = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
print_r($pdo->query('DESCRIBE customers')->fetchAll(PDO::FETCH_ASSOC));
