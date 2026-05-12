<?php
/**
 * Script to sync ALL cities from JSON to database.
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../app/core/Database.php';

$jsonUrl = 'https://raw.githubusercontent.com/apsaraaruna/srilanka-cities-json/master/cities-and-postalcode-by-district.json';

echo "Fetching JSON...\n";
$jsonData = file_get_contents($jsonUrl);
$data = json_decode($jsonData, true);

$db = new Database();

// 1. Map District Names to IDs
$db->query("SELECT id, name FROM districts");
$districts = $db->resultSet();
$districtMap = [];
foreach ($districts as $d) {
    $districtMap[strtolower($d->name)] = $d->id;
}

// Handle slight naming differences
$districtAlias = [
    'moneragala' => 'monaragala',
    'mullaitivu' => 'mullativu'
];
foreach ($districtAlias as $erpName => $jsonName) {
    if (isset($districtMap[$erpName])) {
        $districtMap[$jsonName] = $districtMap[$erpName];
    }
}

$totalProcessed = 0;
$totalUpdated = 0;
$totalInserted = 0;

echo "Syncing cities...\n";

foreach ($data as $jsonDistrictName => $cities) {
    $districtId = $districtMap[strtolower($jsonDistrictName)] ?? null;
    
    if (!$districtId) {
        echo "Warning: District '$jsonDistrictName' not found in database. Skipping.\n";
        continue;
    }

    foreach ($cities as $cityInfo) {
        $cityName = trim($cityInfo['city']);
        $postalCode = trim($cityInfo['code']);
        
        if (empty($cityName) || $postalCode === '*') {
            continue;
        }

        $totalProcessed++;

        // Check if city exists in this district
        $db->query("SELECT id FROM cities WHERE name = :name AND district_id = :did");
        $db->bind(':name', $cityName);
        $db->bind(':did', $districtId);
        $existing = $db->single();

        if ($existing) {
            // Update postal code
            $db->query("UPDATE cities SET postal_code = :code WHERE id = :id");
            $db->bind(':code', $postalCode);
            $db->bind(':id', $existing->id);
            $db->execute();
            if ($db->rowCount() > 0) $totalUpdated++;
        } else {
            // Insert new city
            $db->query("INSERT INTO cities (name, district_id, postal_code) VALUES (:name, :did, :code)");
            $db->bind(':name', $cityName);
            $db->bind(':did', $districtId);
            $db->bind(':code', $postalCode);
            $db->execute();
            $totalInserted++;
        }
    }
}

echo "Done!\n";
echo "Total cities in JSON processed: $totalProcessed\n";
echo "Total cities updated: $totalUpdated\n";
echo "Total new cities inserted: $totalInserted\n";
