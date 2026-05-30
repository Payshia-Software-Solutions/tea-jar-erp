<?php
$ch = curl_init('http://localhost/rapair-management/server/public/api/salestarget/list');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer test']); // It might fail with unauthorized but let's test directly from DB

echo "Testing DB directly...\n";
$pdo = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
$stmt = $pdo->query("SELECT * FROM sales_targets");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
