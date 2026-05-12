<?php
$dir = __DIR__ . '/../nexus-portal-ui/src';
$it = new RecursiveDirectoryIterator($dir);
foreach (new RecursiveIteratorIterator($it) as $file) {
    if ($file->getExtension() == 'tsx' || $file->getExtension() == 'ts') {
        $path = $file->getRealPath();
        $content = file_get_contents($path);
        
        // Find patterns like `${API_BASE}/something' and replace ' with `
        $pattern = '/\$\{API_BASE\}([^\'"`]*)\'/';
        if (preg_match($pattern, $content)) {
            echo "Fixing quotes in $path\n";
            $content = preg_replace($pattern, '${API_BASE}$1`', $content);
            file_put_contents($path, $content);
        }
    }
}
echo "Done!\n";
