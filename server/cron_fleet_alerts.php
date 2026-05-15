<?php
/**
 * Cron Job: Fleet Compliance Alerts
 * This script checks for expiring vehicle documents and sends an automated email report to the fleet manager.
 * Suggested schedule: Weekly (e.g., Every Monday at 8:00 AM)
 */

define('IN_CRON', true);
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/app/core/Database.php';
require_once __DIR__ . '/app/core/Model.php';
require_once __DIR__ . '/app/models/SystemSetting.php';
require_once __DIR__ . '/app/models/VehicleDocument.php';
require_once __DIR__ . '/app/helpers/EmailHelper.php';

// Composer autoloader for PHPMailer
require_once __DIR__ . '/vendor/autoload.php';

try {
    $db = new Database();
    $settingModel = new SystemSetting();
    $docModel = new VehicleDocument();

    // 1. Get configuration
    $adminEmail = $settingModel->get('fleet_manager_email', $settingModel->get('mail_from_addr', 'admin@example.com'));
    $alertDays = (int)$settingModel->get('fleet_alert_days', 14); // Notify 14 days before

    echo "Checking for documents expiring within $alertDays days...\n";

    // 2. Fetch expiring documents
    $expiring = $docModel->getExpiring($alertDays);

    if (empty($expiring)) {
        echo "No expiring documents found. Skipping email.\n";
        exit;
    }

    echo "Found " . count($expiring) . " expiring documents. Preparing email...\n";

    // 3. Prepare Email Content
    $subject = "Fleet Compliance Alert: Upcoming Document Expiries";
    
    $html = "
    <h2>Fleet Compliance Alert</h2>
    <p>The following vehicle documents are expiring within the next <b>$alertDays days</b>. Please take necessary actions to renew them to avoid operational disruptions.</p>
    
    <div style='overflow-x:auto; margin-top: 20px;'>
        <table style='width:100%; border-collapse: collapse; font-size: 14px;'>
            <thead>
                <tr style='background-color: #f1f5f9; text-align: left;'>
                    <th style='padding: 12px; border: 1px solid #e2e8f0;'>Vehicle</th>
                    <th style='padding: 12px; border: 1px solid #e2e8f0;'>Document Type</th>
                    <th style='padding: 12px; border: 1px solid #e2e8f0;'>Expiry Date</th>
                    <th style='padding: 12px; border: 1px solid #e2e8f0;'>Status</th>
                </tr>
            </thead>
            <tbody>";

    foreach ($expiring as $doc) {
        $expiryDate = new DateTime($doc->expiry_date);
        $today = new DateTime();
        $diff = $today->diff($expiryDate)->days;
        $status = $diff <= 0 ? "EXPIRED" : "Expiring in $diff days";
        $color = $diff <= 0 ? "#ef4444" : "#f59e0b";

        $html .= "
        <tr>
            <td style='padding: 12px; border: 1px solid #e2e8f0;'>
                <b>{$doc->make} {$doc->model}</b><br>
                <span style='font-size: 11px; color: #64748b;'>VIN: {$doc->vin}</span>
            </td>
            <td style='padding: 12px; border: 1px solid #e2e8f0;'>{$doc->document_type}</td>
            <td style='padding: 12px; border: 1px solid #e2e8f0;'>{$expiryDate->format('M d, Y')}</td>
            <td style='padding: 12px; border: 1px solid #e2e8f0; color: $color; font-weight: bold;'>$status</td>
        </tr>";
    }

    $html .= "
            </tbody>
        </table>
    </div>
    
    <p style='margin-top: 30px;'>
        <a href='" . str_replace('/server', '/front-end/master-data/vehicles', URLROOT) . "' 
           style='display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;'>
           Manage Fleet Documents
        </a>
    </p>";

    // 4. Send Email
    $result = EmailHelper::send($adminEmail, $subject, $html);

    if ($result['status'] === 'success') {
        echo "Alert email sent successfully to $adminEmail.\n";
    } else {
        echo "Failed to send email: " . $result['message'] . "\n";
    }

} catch (Exception $e) {
    echo "CRITICAL ERROR: " . $e->getMessage() . "\n";
}
