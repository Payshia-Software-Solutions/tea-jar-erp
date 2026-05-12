<?php
require_once 'c:/xampp/htdocs/rapair-management/server/config/config.php';
$dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
$pdo = new PDO($dsn, DB_USER, DB_PASS);
$stmt = $pdo->query("SHOW TABLES LIKE 'item_sections'");
if ($stmt->fetch()) {
    echo "TABLE item_sections EXISTS\n";
} else {
    echo "TABLE item_sections MISSING\n";
}

$stmt = $pdo->query("SHOW COLUMNS FROM parts LIKE 'item_section_id'");
if ($stmt->fetch()) {
    echo "COLUMN item_section_id EXISTS IN parts\n";
} else {
    echo "COLUMN item_section_id MISSING IN parts\n";
}
