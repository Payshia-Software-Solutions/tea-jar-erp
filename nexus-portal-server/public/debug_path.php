<?php
$file = 'nebulync-logo.png';
$paths = [
    __DIR__ . '/nebulync-logo.png',
    __DIR__ . '/public/nebulync-logo.png',
    dirname(__DIR__) . '/public/nebulync-logo.png',
    dirname(__DIR__, 2) . '/public/nebulync-logo.png',
    $_SERVER['DOCUMENT_ROOT'] . '/public/nebulync-logo.png',
    $_SERVER['DOCUMENT_ROOT'] . '/nebulync-logo.png',
];

echo "<h3>Path Discovery</h3><ul>";
foreach ($paths as $p) {
    $exists = file_exists($p) ? "<b style='color:green'>FOUND</b>" : "<b style='color:red'>NOT FOUND</b>";
    echo "<li>$p : $exists</li>";
}
echo "</ul>";

echo "<h3>Server Context</h3>";
echo "DOCUMENT_ROOT: " . $_SERVER['DOCUMENT_ROOT'] . "<br>";
echo "__DIR__: " . __DIR__ . "<br>";
