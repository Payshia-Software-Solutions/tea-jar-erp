<?php
foreach (glob('c:/xampp/htdocs/rapair-management/server/app/models/*.php') as $file) {
    $content = file_get_contents($file);
    // Find 'function ensureSchema() {' or 'function ensureSchema($force) {' etc.
    // and inject 'return;' immediately after it
    $newContent = preg_replace('/(function\s+ensureSchema\s*\([^\)]*\)\s*\{)/i', '$1 return;', $content);
    if ($content !== $newContent) {
        file_put_contents($file, $newContent);
        echo "Fixed ensureSchema in " . basename($file) . "\n";
    }
}
