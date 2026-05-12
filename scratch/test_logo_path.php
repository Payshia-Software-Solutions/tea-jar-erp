<?php
require_once __DIR__ . '/../nexus-portal-server/vendor/autoload.php';

$basePath = dirname(__DIR__) . '/nexus-portal-server';
$logoName = 'nebulink-logo-croped.png';
$logoPath = $basePath . '/public/' . $logoName;

echo "Base Path: $basePath\n";
echo "Logo Path: $logoPath\n";
echo "File Exists: " . (file_exists($logoPath) ? "YES" : "NO") . "\n";

if (file_exists($logoPath)) {
    echo "File Size: " . filesize($logoPath) . " bytes\n";
} else {
    echo "Listing public dir:\n";
    print_r(scandir($basePath . '/public/'));
}
