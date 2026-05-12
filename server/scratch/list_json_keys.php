<?php
$json = file_get_contents('https://raw.githubusercontent.com/apsaraaruna/srilanka-cities-json/master/cities-and-postalcode-by-district.json');
$data = json_decode($json, true);
echo implode(", ", array_keys($data));
