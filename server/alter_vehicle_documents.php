<?php
try {
    $db = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
    $db->exec('ALTER TABLE vehicle_documents MODIFY expiry_date DATE NULL');
    echo "Table altered successfully. expiry_date is now NULLable.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
