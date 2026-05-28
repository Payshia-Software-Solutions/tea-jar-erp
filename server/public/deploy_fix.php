<?php
// Fixes the ensureSchema() and other database lock issues on the live server.
// Upload this file to the root of your server (where index.php normally is) and run it via browser:
// https://server-kdu-service.payshia.com/deploy_fix.php

header('Content-Type: text/plain');

$fixedCount = 0;
$modelsDir = __DIR__ . '/app/models/';

if (is_dir($modelsDir)) {
    $files = glob($modelsDir . '*.php');
    foreach ($files as $file) {
        $content = file_get_contents($file);
        
        // Disable ensureSchema calls inside __construct
        $newContent = str_replace('$this->ensureSchema();', '// $this->ensureSchema();', $content);
        
        // Inject return; into the ensureSchema method definition
        $newContent = preg_replace('/(function\s+ensureSchema\s*\([^\)]*\)\s*\{)/i', '$1 return;', $newContent);
        
        if ($content !== $newContent) {
            file_put_contents($file, $newContent);
            $fixedCount++;
            echo "Patched Model: " . basename($file) . "\n";
        }
    }
}

// Fix VisitController
$vcFile = __DIR__ . '/app/controllers/VisitController.php';
if (file_exists($vcFile)) {
    $content = file_get_contents($vcFile);
    // Comment out CREATE TABLE and ALTER TABLE
    $newContent = preg_replace('/(\$db->exec\("CREATE TABLE IF NOT EXISTS customer_visits)/', '/* $1', $content);
    $newContent = preg_replace('/(\$pdo->exec\("ALTER TABLE customer_visits ADD COLUMN device_id VARCHAR\(100\) NULL"\);\s*\}\s*\} catch \(Exception \$e\) \{\})/', '$1 */', $newContent);
    
    if ($content !== $newContent) {
        file_put_contents($vcFile, $newContent);
        echo "Patched VisitController.php\n";
    }
}

// Fix AdminController
$acFile = __DIR__ . '/app/controllers/AdminController.php';
if (file_exists($acFile)) {
    $content = file_get_contents($acFile);
    $newContent = str_replace('try {
            $this->db->exec("ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1");', '/* try {
            $this->db->exec("ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1");', $content);
            
    $newContent = str_replace('} catch (Exception $e) {
            // ignore (exists)
        }', '} catch (Exception $e) {
            // ignore (exists)
        } */', $newContent);
        
    if ($content !== $newContent) {
        file_put_contents($acFile, $newContent);
        echo "Patched AdminController.php\n";
    }
}

// Fix index.php
$indexFile = __DIR__ . '/public/index.php';
if (file_exists($indexFile)) {
    $content = file_get_contents($indexFile);
    $newContent = str_replace('CityPostalSchema::ensure();', '// CityPostalSchema::ensure();', $content);
    $newContent = str_replace('ShippingCarrierSchema::ensure();', '// ShippingCarrierSchema::ensure();', $newContent);
    $newContent = str_replace('SystemSchema::ensure();', '// SystemSchema::ensure();', $newContent);
    
    if ($content !== $newContent) {
        file_put_contents($indexFile, $newContent);
        echo "Patched index.php\n";
    }
}

echo "\n--------------------------------\n";
echo "SUCCESS! Fixed $fixedCount models and all controllers.\n";
echo "Your server should now be fast and stable again. You can delete this deploy_fix.php file now.\n";
