<?php
/**
 * Cron Script to trigger Morning Mileage Sync
 * Run this via Windows Task Scheduler at 4:00 AM daily.
 * Command: php C:\xampp\htdocs\rapair-management\server\cron_morning_mileage.php
 */

define('ROOT_DIR', __DIR__);
require_once __DIR__ . '/app/config/config.php';
require_once __DIR__ . '/app/core/Database.php';
require_once __DIR__ . '/app/core/Controller.php';
require_once __DIR__ . '/app/core/Model.php';
require_once __DIR__ . '/app/controllers/VehicleSyncController.php';

class CronSyncController extends VehicleSyncController {
    public function success($data = [], $message = "") {
        echo "[SUCCESS] $message\n";
        print_r($data);
    }
    public function error($message = "", $code = 400) {
        echo "[ERROR] $message\n";
    }
    protected function requirePermission($permission) {
        // Bypass permission check for local cron
        return true;
    }
}

echo "Starting morning mileage fetch...\n";
$controller = new CronSyncController();
$controller->morning_fetch();
echo "Done.\n";
