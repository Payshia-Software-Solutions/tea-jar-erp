<?php
/**
 * One-time script to create an API Key for the Room Kiosk App.
 * Run this once via browser, then delete this file.
 * Access: http://localhost/rapair-management/server/create_kiosk_api_key.php
 */

define('DB_HOST', '127.0.0.1');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'repair_management_db');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Generate a secure random API key
    $apiKey = bin2hex(random_bytes(32));

    $stmt = $pdo->prepare("
        INSERT INTO api_clients (client_name, domain, api_key, is_active, created_at, updated_at)
        VALUES (:name, :domain, :key, 1, NOW(), NOW())
    ");

    $stmt->execute([
        ':name'   => 'Room Kiosk App',
        ':domain' => '*',   // '*' allows all domains (localhost + production)
        ':key'    => $apiKey,
    ]);

    $id = $pdo->lastInsertId();

    echo "<html><body style='font-family:monospace;padding:30px;background:#f4f5f7'>";
    echo "<h2 style='color:#E8410A'>✅ API Client Created Successfully!</h2>";
    echo "<p><strong>Client ID:</strong> $id</p>";
    echo "<p><strong>Client Name:</strong> Room Kiosk App</p>";
    echo "<p><strong>Domain:</strong> * (all domains)</p>";
    echo "<hr/>";
    echo "<h3>Your API Key:</h3>";
    echo "<div style='background:#fff;border:2px solid #E8410A;border-radius:10px;padding:16px;font-size:16px;word-break:break-all;'><strong>$apiKey</strong></div>";
    echo "<hr/>";
    echo "<h3>📋 Copy this to your <code>.env.local</code> file:</h3>";
    echo "<pre style='background:#141414;color:#a3e635;padding:16px;border-radius:10px;font-size:14px;'>";
    echo "VITE_API_URL=http://localhost/rapair-management/server\n";
    echo "VITE_API_KEY=$apiKey\n";
    echo "VITE_DEFAULT_LOCATION_ID=1";
    echo "</pre>";
    echo "<p style='color:#dc2626'><strong>⚠ Delete this file after copying the key!</strong></p>";
    echo "</body></html>";

} catch (Exception $e) {
    echo "<html><body style='font-family:monospace;padding:30px;'>";
    echo "<h2 style='color:red'>❌ Error</h2>";
    echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
    echo "</body></html>";
}
