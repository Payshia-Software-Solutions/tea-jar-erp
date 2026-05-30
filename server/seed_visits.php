<?php
require 'c:/xampp/htdocs/rapair-management/server/config/config.php';
require 'c:/xampp/htdocs/rapair-management/server/app/core/Database.php';

$db = new Database();

// Ensure the table exists
$db->exec('CREATE TABLE IF NOT EXISTS customer_visits (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    customer_id INT NOT NULL, 
    user_id INT NOT NULL, 
    visit_type VARCHAR(50) NOT NULL, 
    reason VARCHAR(255) NULL, 
    latitude DECIMAL(10,8) NULL, 
    longitude DECIMAL(11,8) NULL, 
    device_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);');

// Fetch all customers
$db->query("SELECT id, name FROM customers");
$customers = $db->resultSet();

if (empty($customers)) {
    echo "No customers found to seed visits for!\n";
    exit;
}

echo "Found " . count($customers) . " customers. Seeding random last visits...\n";

$reasons = ['Start Order', 'Shop Closed', 'Overstocked', 'Owner Unavailable', 'Regular Checkin', 'Delivery'];
$visitTypes = ['SALE', 'NO_SALE', 'NO_SALE', 'NO_SALE', 'SALE', 'SALE'];

$insertedCount = 0;
foreach ($customers as $c) {
    // Generate 1-2 visits in the last 10 days
    $numVisits = rand(1, 2);
    for ($i = 0; $i < $numVisits; $i++) {
        $daysAgo = rand(1, 10);
        $randomTime = sprintf("%02d:%02d:%02d", rand(8, 17), rand(0, 59), rand(0, 59));
        $dateStr = date('Y-m-d', strtotime("-$daysAgo days")) . ' ' . $randomTime;
        
        $reason = $reasons[array_rand($reasons)];
        $type = $visitTypes[array_rand($visitTypes)];
        $userId = rand(1, 5); // Dummy user_id
        
        // Random coords close to Colombo/common area or null
        $lat = 6.9271 + (rand(-100, 100) / 1000.0);
        $lng = 79.8612 + (rand(-100, 100) / 1000.0);

        $db->query("INSERT INTO customer_visits (customer_id, user_id, visit_type, reason, latitude, longitude, created_at) 
                    VALUES (:customer_id, :user_id, :visit_type, :reason, :latitude, :longitude, :created_at)");
        $db->bind(':customer_id', $c->id);
        $db->bind(':user_id', $userId);
        $db->bind(':visit_type', $type);
        $db->bind(':reason', $reason);
        $db->bind(':latitude', $lat);
        $db->bind(':longitude', $lng);
        $db->bind(':created_at', $dateStr);
        $db->execute();
        $insertedCount++;
    }
}

echo "Successfully seeded {$insertedCount} visit records for " . count($customers) . " customers!\n";
