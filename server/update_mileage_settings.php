<?php
try {
    $db = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $settings = [
        'MILEAGE_API_URL' => 'http://220.247.236.239/api/Export_API/vehicles_GPS_Location.php',
        'MILEAGE_API_TOKEN' => 'a568090e-1958-4d72-9ed7-659fe2376532'
    ];

    foreach ($settings as $key => $val) {
        $stmt = $db->prepare("INSERT INTO system_settings (setting_key, setting_value) VALUES (:key, :val) ON DUPLICATE KEY UPDATE setting_value = :val2");
        $stmt->execute([':key' => $key, ':val' => $val, ':val2' => $val]);
    }

    echo "Settings updated successfully.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
