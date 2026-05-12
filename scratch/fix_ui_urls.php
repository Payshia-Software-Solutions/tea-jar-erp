<?php
$dir = __DIR__ . '/../nexus-portal-ui/src';
$it = new RecursiveDirectoryIterator($dir);
foreach (new RecursiveIteratorIterator($it) as $file) {
    if ($file->getExtension() == 'tsx' || $file->getExtension() == 'ts') {
        $path = $file->getRealPath();
        $content = file_get_contents($path);
        
        $old_line = "const API_BASE = 'http://localhost/rapair-management/nexus-portal-server/public/api';";
        $new_line = "import { API_BASE } from '@/config';";
        
        if (strpos($content, $old_line) !== false) {
            echo "Updating $path\n";
            $content = str_replace($old_line, "", $content);
            // Insert import at the top (after "use client" if present)
            if (strpos($content, '"use client";') !== false) {
                $content = str_replace('"use client";', '"use client";' . "\n" . $new_line, $content);
            } else {
                $content = $new_line . "\n" . $content;
            }
            file_put_contents($path, $content);
        }
        
        // Also handle cases where it's a direct fetch URL
        $old_url = 'http://localhost/rapair-management/nexus-portal-server/public/api';
        if (strpos($content, $old_url) !== false) {
            echo "Replacing direct URL in $path\n";
            // Check if API_BASE is imported or defined
            if (strpos($content, 'API_BASE') === false) {
                if (strpos($content, '"use client";') !== false) {
                    $content = str_replace('"use client";', '"use client";' . "\n" . $new_line, $content);
                } else {
                    $content = $new_line . "\n" . $content;
                }
            }
            $content = str_replace("'".$old_url, '`${API_BASE}', $content);
            $content = str_replace('"'.$old_url, '`${API_BASE}', $content);
            file_put_contents($path, $content);
        }

        // Handle the 'public' base URL for logos
        $old_public = 'http://localhost/rapair-management/nexus-portal-server/public/';
        if (strpos($content, $old_public) !== false) {
             echo "Replacing public URL in $path\n";
             $new_config_import = "import { API_BASE, SITE_URL } from '@/config';";
             if (strpos($content, 'API_BASE') !== false) {
                 $content = str_replace("import { API_BASE } from '@/config';", $new_config_import, $content);
             } else {
                if (strpos($content, '"use client";') !== false) {
                    $content = str_replace('"use client";', '"use client";' . "\n" . $new_config_import, $content);
                } else {
                    $content = $new_config_import . "\n" . $content;
                }
             }
             // Actually, API_BASE has /api at the end. We might need a separate BASE_URL.
             // For now let's just use a string replacement that's safer.
             $content = str_replace($old_public, '${API_BASE.replace("/api", "")}/', $content);
             file_put_contents($path, $content);
        }
    }
}
echo "Done!\n";
