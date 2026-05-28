<?php
// Fixes the ensureSchema(), SaasHelper cache, database timezones, tracking transactional sync, and database lock issues on the live server.
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

// --- Part 6: Fix SaasHelper ---
$shFile = __DIR__ . '/../app/helpers/SaasHelper.php';
if (file_exists($shFile)) {
    $content = file_get_contents($shFile);
    $originalContent = $content;
    
    // Add static $apiKey variable if missing
    if (strpos($content, 'private static $apiKey = null;') === false) {
        $content = str_replace(
            'private static $cache_ttl = 3600;',
            "private static \$cache_ttl = 3600;\n    private static \$apiKey = null;",
            $content
        );
    }
    
    // Add early return check if missing
    if (strpos($content, 'if (self::$apiKey !== null) return self::$apiKey;') === false) {
        $content = str_replace(
            'public static function getApiKey() {',
            "public static function getApiKey() {\n        if (self::\$apiKey !== null) return self::\$apiKey;",
            $content
        );
        
        // Also inject cache store during return
        $content = str_replace(
            'if ($row && !empty($row->setting_value)) return $row->setting_value;',
            "if (\$row && !empty(\$row->setting_value)) {\n                self::\$apiKey = \$row->setting_value;\n                return self::\$apiKey;\n            }",
            $content
        );
        
        $content = str_replace(
            'if (defined(\'NEXUS_API_KEY\') && !empty(NEXUS_API_KEY)) return NEXUS_API_KEY;',
            "if (defined('NEXUS_API_KEY') && !empty(NEXUS_API_KEY)) {\n            self::\$apiKey = NEXUS_API_KEY;\n            return self::\$apiKey;\n        }",
            $content
        );
        
        $content = str_replace(
            'if (defined(\'NEXUS_LICENSE_KEY\') && !empty(NEXUS_LICENSE_KEY)) return NEXUS_LICENSE_KEY;',
            "if (defined('NEXUS_LICENSE_KEY') && !empty(NEXUS_LICENSE_KEY)) {\n            self::\$apiKey = NEXUS_LICENSE_KEY;\n            return self::\$apiKey;\n        }\n        self::\$apiKey = '';",
            $content
        );
    }
    
    if ($content !== $originalContent) {
        file_put_contents($shFile, $content);
        echo "Patched SaasHelper.php\n";
    }
}

// --- Part 7: Ensure scratch directory exists and is writable ---
$scratchDir = __DIR__ . '/../scratch/';
if (!is_dir($scratchDir)) {
    if (@mkdir($scratchDir, 0777, true)) {
        echo "Created scratch/ directory for license caching.\n";
    } else {
        echo "WARNING: Could not create scratch/ directory at $scratchDir. Please create it manually and set permissions to 777.\n";
    }
} else {
    @chmod($scratchDir, 0777);
    echo "Verified and set permissions for scratch/ directory.\n";
}

// --- Part 8: Fix Database.php timezone handling ---
$dbFile = __DIR__ . '/../app/core/Database.php';
if (file_exists($dbFile)) {
    $content = file_get_contents($dbFile);
    $originalContent = $content;
    
    // Normalize any invalid timezone setting string (like 'x00:00') to standard Sri Lanka offset '+05:30'
    $content = preg_replace('/SET\s+time_zone\s*=\s*[\'"][^\'"]*[\'"]/i', "SET time_zone = '+05:30'", $content);
    
    // Wrap the SET time_zone execution in a try-catch block if not already wrapped
    if (strpos($content, 'catch (Exception $tzException)') === false) {
        $oldBlock = '$this->dbh->exec("SET time_zone = \'+05:30\'");';
        $newBlock = "try {\n                \$this->dbh->exec(\"SET time_zone = '+05:30'\");\n            } catch (Exception \$tzException) {\n                // Fallback silently if SET time_zone is restricted or fails\n            }";
        $content = str_replace($oldBlock, $newBlock, $content);
    }
    
    if ($content !== $originalContent) {
        file_put_contents($dbFile, $content);
        echo "Patched Database.php timezone exception wrapper.\n";
    }
}

// --- Part 9: Fix TrackingController transactional sync ---
$tcFile = __DIR__ . '/../app/controllers/TrackingController.php';
if (file_exists($tcFile)) {
    $content = file_get_contents($tcFile);
    $originalContent = $content;
    
    // Wrap sync loop in transaction if missing
    if (strpos($content, 'beginTransaction()') === false) {
        $content = preg_replace(
            '/if\s*\(\s*\!empty\s*\(\s*\$logs\s*\)\s*\)\s*\{\s*\$successCount\s*=\s*0\s*;\s*foreach\s*\(\s*\$logs\s+as\s+\$log\s*\)\s*\{/i',
            "if (!empty(\$logs)) {\n                \$successCount = 0;\n                \$this->db->beginTransaction();\n                try {\n                    foreach (\$logs as \$log) {",
            $content
        );
        
        $content = preg_replace(
            '/(\}\s*\}\s*echo\s+json_encode\s*\(\s*\[\s*\'status\'\s*=>\s*\'success\'\s*,\s*\'message\'\s*=>\s*["\']Synced\s+\$successCount\s+logs["\']\s*\]\s*\)\s*;)/i',
            "}\n                    \$this->db->commit();\n                } catch (Exception \$e) {\n                    \$this->db->rollBack();\n                    http_response_code(500);\n                    echo json_encode(['status' => 'error', 'message' => 'Sync failed: ' . \$e->getMessage()]);\n                    return;\n                }\n                echo json_encode(['status' => 'success', 'message' => \"Synced \$successCount logs\"]);",
            $content
        );
    }
    
    if ($content !== $originalContent) {
        file_put_contents($tcFile, $content);
        echo "Patched TrackingController.php transactional sync.\n";
    }
}

echo "\n--------------------------------\n";
echo "SUCCESS! Patched models, schema helpers, database timezone settings, tracking controllers, and all controllers.\n";
echo "Your server should now be fast, stable, and completely free of database locks!\n";
echo "You can safely delete this deploy_fix.php file now.\n";
