<?php
try {
    $db = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
    $res = $db->query('SELECT * FROM vehicles WHERE id = 163')->fetch(PDO::FETCH_ASSOC);
    print_r($res);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
