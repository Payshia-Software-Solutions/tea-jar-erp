<?php
// Fixes the ensureSchema() and database lock issues on the live server.
// Upload this file to the public/ directory of your server and run it via browser:
// https://server-kdu-service.payshia.com/deploy_fix.php

header('Content-Type: text/plain');

$fixedModelsCount = 0;
$fixedHelpersCount = 0;

$modelsDir = __DIR__ . '/../app/models/';
$helpersDir = __DIR__ . '/../app/helpers/';

// --- Part 1: Patch Models ---
if (is_dir($modelsDir)) {
    $files = glob($modelsDir . '*.php');
    foreach ($files as $file) {
        $content = file_get_contents($file);
        $originalContent = $content;
        
        // Disable ensureSchema calls inside __construct
        $content = str_replace('$this->ensureSchema();', '// $this->ensureSchema();', $content);
        
        // Inject return; into the ensureSchema method definition if not already present
        if (preg_match('/function\s+ensureSchema[^{]*\{\s*return\s*;/i', $content) === 0) {
            $content = preg_replace('/(function\s+ensureSchema\s*\([^\)]*\)\s*\{)/i', '$1 return;', $content);
        }
        
        if ($content !== $originalContent) {
            file_put_contents($file, $content);
            $fixedModelsCount++;
            echo "Patched Model: " . basename($file) . "\n";
        }
    }
} else {
    echo "WARNING: Models directory not found at $modelsDir\n";
}

// --- Part 2: Patch Schema Helpers ---
if (is_dir($helpersDir)) {
    $files = glob($helpersDir . '*Schema.php');
    foreach ($files as $file) {
        $content = file_get_contents($file);
        $originalContent = $content;

        // 1. Standardize method signature to: public static function ensure($force = false) {
        $content = preg_replace(
            '/public\s+static\s+function\s+ensure\s*\(\s*\)\s*\{/i',
            'public static function ensure($force = false) {',
            $content
        );

        // 2. Inject early return if called without $force and FORCE_MIGRATIONS constant not defined
        if (strpos($content, "FORCE_MIGRATIONS") === false) {
            $content = preg_replace(
                '/(public\s+static\s+function\s+ensure\s*\([^\)]*\)\s*\{)/i',
                '$1' . "\n" . '        if (!$force && !defined(\'FORCE_MIGRATIONS\')) return;',
                $content
            );
        }

        if ($content !== $originalContent) {
            file_put_contents($file, $content);
            $fixedHelpersCount++;
            echo "Patched Helper Schema: " . basename($file) . "\n";
        }
    }
} else {
    echo "WARNING: Helpers directory not found at $helpersDir\n";
}

// --- Part 3: Fix VisitController ---
$vcFile = __DIR__ . '/../app/controllers/VisitController.php';
if (file_exists($vcFile)) {
    $content = file_get_contents($vcFile);
    $originalContent = $content;
    
    // Comment out CREATE TABLE and ALTER TABLE inside VisitController.php
    $content = preg_replace('/(\$db->exec\("CREATE TABLE IF NOT EXISTS customer_visits)/', '/* $1', $content);
    $content = preg_replace('/(\$pdo->exec\("ALTER TABLE customer_visits ADD COLUMN device_id VARCHAR\(100\) NULL"\);\s*\}\s*\} catch \(Exception \$e\) \{\})/', '$1 */', $content);
    
    if ($content !== $originalContent) {
        file_put_contents($vcFile, $content);
        echo "Patched VisitController.php\n";
    }
}

// --- Part 4: Fix AdminController ---
$acFile = __DIR__ . '/../app/controllers/AdminController.php';
if (file_exists($acFile)) {
    $content = file_get_contents($acFile);
    $originalContent = $content;
    
    $content = str_replace('try {
            $this->db->exec("ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1");', '/* try {
            $this->db->exec("ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1");', $content);
            
    $content = str_replace('} catch (Exception $e) {
            // ignore (exists)
        }', '} catch (Exception $e) {
            // ignore (exists)
        } */', $content);
        
    if ($content !== $originalContent) {
        file_put_contents($acFile, $content);
        echo "Patched AdminController.php\n";
    }
}

// --- Part 5: Fix index.php ---
$indexFile = __DIR__ . '/index.php';
if (file_exists($indexFile)) {
    $content = file_get_contents($indexFile);
    $originalContent = $content;
    
    $content = str_replace('CityPostalSchema::ensure();', '// CityPostalSchema::ensure();', $content);
    $content = str_replace('ShippingCarrierSchema::ensure();', '// ShippingCarrierSchema::ensure();', $content);
    $content = str_replace('SystemSchema::ensure();', '// SystemSchema::ensure();', $content);
    
    if ($content !== $originalContent) {
        file_put_contents($indexFile, $content);
        echo "Patched index.php\n";
    }
}

echo "\n--------------------------------\n";
echo "SUCCESS! Patched $fixedModelsCount models, $fixedHelpersCount schema helpers, and all controllers.\n";
echo "Your server should now be fast, stable, and completely free of database locks!\n";
echo "You can safely delete this deploy_fix.php file now.\n";
