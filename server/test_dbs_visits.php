<?php
$dbs = ["crop_info","information_schema","kdu_auth","kdu_tea_factories","kdu_website","lanka_auto_prime","movies_hub","mysql","performance_schema","phpmyadmin","repair_management_db","saas_master_db","test","videohub"];
$pdo = new PDO('mysql:host=127.0.0.1;charset=utf8mb4', 'root', '');
foreach ($dbs as $db) {
    try {
        $stmt = $pdo->query("SELECT count(*) FROM `$db`.customer_visits");
        if ($stmt) {
            echo "DB $db has " . $stmt->fetchColumn() . " visits\n";
        }
    } catch (Exception $e) {}
}
