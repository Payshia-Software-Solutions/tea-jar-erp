<?php
require_once 'config/config.php';

$apiUrl = FLEET_API_URL;
$apiToken = FLEET_API_TOKEN;

$url = $apiUrl . '?Token=' . $apiToken;
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$makes = [];
$models = [];

if (isset($data['data'])) {
    foreach ($data['data'] as $item) {
        $make = trim($item['type'] ?? '');
        $model = trim($item['Modle'] ?? '');
        
        if ($make && !in_array($make, $makes)) {
            $makes[] = $make;
        }
        
        if ($make && $model) {
            $models[$make][] = $model;
        }
    }
}

echo "UNIQUE MAKES FOUND IN API:\n";
foreach ($makes as $m) {
    echo "- $m\n";
    if (isset($models[$m])) {
        $uniqueModels = array_unique($models[$m]);
        foreach ($uniqueModels as $mod) {
            echo "  > $mod\n";
        }
    }
}
