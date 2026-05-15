<?php
try {
    $db = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
    $m = $db->query('SELECT COUNT(*) FROM vehicle_makes')->fetchColumn();
    $mod = $db->query('SELECT COUNT(*) FROM vehicle_models')->fetchColumn();
    echo "Makes: $m, Models: $mod";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
