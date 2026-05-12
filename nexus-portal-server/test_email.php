<?php
require_once __DIR__ . '/app/Core/Config.php';
require_once __DIR__ . '/app/Core/Mailer.php';
require_once __DIR__ . '/vendor/autoload.php';

// Mock session
if (session_status() === PHP_SESSION_NONE) session_start();
$_SESSION['admin_id'] = 1;

use App\Core\Mailer;
use App\Core\Config;


echo "Starting email test...\n";
echo "SMTP Host: " . Config::SMTP_HOST . "\n";
echo "SMTP Port: " . Config::SMTP_PORT . "\n";
echo "SMTP User: " . Config::SMTP_USER . "\n";

$to = 'thilinaruwan112@gmail.com';
$name = 'Thilina';
$subject = 'Test Email from Nexus ERP';
$body = 'This is a test email to verify SMTP settings.';

$result = Mailer::sendCustomEmail($to, $name, $subject, $body);

if ($result) {
    echo "Email sent successfully!\n";
} else {
    echo "Email failed to send.\n";
    // Since we don't have direct access to the error unless we modify Mailer.php
    // I will modify Mailer.php to echo error for debugging.
}
