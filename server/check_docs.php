<?php
try {
    $db = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
    $res = $db->query('SELECT id, vehicle_id, document_type, status, expiry_date FROM vehicle_documents')->fetchAll(PDO::FETCH_ASSOC);
    print_r($res);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
