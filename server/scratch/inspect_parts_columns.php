<?php
try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=repair_management_db;charset=utf8mb4", 'root', '');
    $stmt = $pdo->query("DESCRIBE parts");
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $c) {
        if (strpos(strtolower($c['Field']), 'kiosk') !== false) {
            echo "Col: " . $c['Field'] . " - Type: " . $c['Type'] . "\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
