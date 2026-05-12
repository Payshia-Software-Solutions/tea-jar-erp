<?php
try {
    $db = new PDO('mysql:host=localhost;dbname=saas_master_db', 'root', '');
    $stmt = $db->query('SELECT * FROM saas_email_logs ORDER BY created_at DESC LIMIT 10');
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "ID | Type | Recipient | Status | Error | Subject\n";
    echo str_repeat("-", 80) . "\n";
    foreach ($logs as $log) {
        echo "{$log['id']} | {$log['email_type']} | {$log['recipient']} | {$log['status']} | " . ($log['error_message'] ?? 'N/A') . " | {$log['subject']}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
