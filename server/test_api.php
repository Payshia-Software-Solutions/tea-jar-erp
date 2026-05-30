<?php
$data = ['location_id' => 1, 'month' => '2026-05', 'global' => 1000, 'collections' => ['1' => 200, '2' => 300]];
$ch = curl_init('http://localhost/rapair-management/server/public/api/salestarget/save');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer test']);
$response = curl_exec($ch);
echo "Save Response: " . $response . "\n";

$ch2 = curl_init('http://localhost/rapair-management/server/public/api/salestarget/get?location_id=1&month=2026-05');
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_HTTPHEADER, ['Authorization: Bearer test']);
$response2 = curl_exec($ch2);
echo "Get Response: " . $response2 . "\n";
