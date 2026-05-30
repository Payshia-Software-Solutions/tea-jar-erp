<?php
$ch = curl_init('http://localhost/rapair-management/server/public/api/salestarget/list');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer test']);
$response = curl_exec($ch);
echo "API Response:\n" . $response . "\n";
