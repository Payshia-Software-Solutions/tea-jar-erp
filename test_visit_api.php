<?php

$baseUrl = 'https://server-kdu-service.payshia.com/api';
$email = 'admin@local';
$password = 'admin123';

echo "Logging in...\n";
$loginData = json_encode(['email' => $email, 'password' => $password]);
$ch = curl_init("$baseUrl/auth/login");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $loginData);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
curl_close($ch);

$resData = json_decode($response, true);
if (!isset($resData['data']['token'])) {
    die("Login failed: " . $response . "\n");
}
$token = $resData['data']['token'];
echo "Login successful. Token obtained.\n\n";

$customerId = 1; // Let's try customer 1
echo "Testing GET /visit/history/$customerId...\n";
$ch2 = curl_init("$baseUrl/visit/history/$customerId");
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json'
]);
$historyResponse = curl_exec($ch2);
$httpCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);

echo "HTTP Code: $httpCode\n";
echo "Response:\n";
echo json_encode(json_decode($historyResponse, true), JSON_PRETTY_PRINT) . "\n";
