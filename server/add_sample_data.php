<?php
try {
    $db = new PDO('mysql:host=localhost;dbname=repair_management_db', 'root', '');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get 4 random vehicles
    $stmt = $db->query("SELECT id FROM vehicles LIMIT 4");
    $vehicles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($vehicles) >= 4) {
        // Vehicle 0: Overdue by mileage (morning mileage > next service)
        $db->exec("UPDATE vehicles SET morning_mileage = 55000, next_service_mileage = 50000, next_service_date = NULL WHERE id = " . $vehicles[0]['id']);
        
        // Vehicle 1: Overdue by date (date is 5 days ago)
        $db->exec("UPDATE vehicles SET morning_mileage = 20000, next_service_mileage = 30000, next_service_date = DATE_SUB(CURDATE(), INTERVAL 5 DAY) WHERE id = " . $vehicles[1]['id']);

        // Vehicle 2: Due Soon by mileage (morning mileage is within 500km of next service)
        $db->exec("UPDATE vehicles SET morning_mileage = 49600, next_service_mileage = 50000, next_service_date = NULL WHERE id = " . $vehicles[2]['id']);

        // Vehicle 3: Due Soon by date (date is 5 days in the future)
        $db->exec("UPDATE vehicles SET morning_mileage = 20000, next_service_mileage = 30000, next_service_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY) WHERE id = " . $vehicles[3]['id']);

        echo "Sample data applied successfully.\n";
    } else {
        echo "Not enough vehicles in the database to apply sample data.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
