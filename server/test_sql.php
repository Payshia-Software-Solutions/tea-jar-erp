<?php
$pdo = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
$stmt = $pdo->query("
    SELECT t.location_id, l.name as location_name, t.target_month,
           SUM(CASE WHEN t.collection_id IS NULL THEN t.target_value ELSE 0 END) as global_target,
           COUNT(t.collection_id) as collection_count
    FROM sales_targets t
    JOIN service_locations l ON t.location_id = l.id
    GROUP BY t.location_id, l.name, t.target_month
    ORDER BY t.target_month DESC, l.name ASC
");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
