<?php
require_once 'config/config.php';
require_once 'app/core/Database.php';
require_once 'app/core/Model.php';
require_once 'app/models/SystemSetting.php';

try {
    $settingModel = new SystemSetting();
    
    // Default fleet manager email (change this to your actual email)
    $settingModel->update('fleet_manager_email', 'fleet.manager@example.com');
    $settingModel->update('fleet_alert_days', '14'); // Default alert window
    
    echo "Fleet alert settings initialized successfully.\n";
    echo "Default recipient: fleet.manager@example.com (Please update this in System Settings)\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
