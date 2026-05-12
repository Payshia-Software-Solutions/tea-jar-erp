<?php
$dir = __DIR__ . '/../nexus-portal-ui/src';
$it = new RecursiveDirectoryIterator($dir);
foreach (new RecursiveIteratorIterator($it) as $file) {
    if ($file->getExtension() == 'tsx' || $file->getExtension() == 'ts') {
        $path = $file->getRealPath();
        $content = file_get_contents($path);
        
        $lines = explode("\n", $content);
        if (count($lines) < 2) continue;
        
        $line1 = trim($lines[0]);
        $line2 = trim($lines[1]);
        
        // If line 2 is the directive and line 1 is our new import
        if ((strpos($line2, '"use client"') !== false || strpos($line2, "'use client'") !== false) 
            && strpos($line1, "import { API_BASE") !== false) {
            
            echo "Fixing directive order in $path\n";
            $directive = $lines[1];
            $import = $lines[0];
            
            $lines[0] = $directive;
            $lines[1] = $import;
            
            file_put_contents($path, implode("\n", $lines));
        }
    }
}
echo "Done!\n";
