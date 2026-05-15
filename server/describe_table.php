<?php
try {
    $db = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
    $table = $_GET['table'] ?? 'vehicles';
    $res = $db->query("DESCRIBE $table")->fetchAll(PDO::FETCH_ASSOC);
    print_r($res);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
