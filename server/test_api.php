<?php
$token = 'a568090e-1958-4d72-9ed7-659fe2376532';
$no = 'LK-7900';
$url = "http://220.247.236.239/api/Export_API/vehicles_GPS_Location.php?Token=$token&VehicleNo=$no";
echo "Testing URL: $url\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);
echo "Response: $res\n";
