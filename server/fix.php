<?php
foreach (glob('c:/xampp/htdocs/rapair-management/server/app/models/*.php') as $file) {
    $content = file_get_contents($file);
    $content = str_replace('$this->ensureSchema();', '// $this->ensureSchema();', $content);
    file_put_contents($file, $content);
    echo "Fixed " . basename($file) . "\n";
}
