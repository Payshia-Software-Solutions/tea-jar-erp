<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Services\ExchangeRateService;

class SettingsController extends Controller {
    
    private function checkAuth() {
        if (!isset($_SESSION['admin_id'])) {
            return $this->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }
        return true;
    }

    public function getExchangeRates() {
        if ($this->checkAuth() !== true) return;
        $rates = ExchangeRateService::getAll();
        $sources = ExchangeRateService::getSources();
        
        $db = new \App\Core\Database();
        $db->query("SELECT setting_value FROM saas_settings WHERE setting_key = 'exchange_rate_source'");
        $activeSource = $db->single()->setting_value ?? 'exchangerate-api';

        return $this->json([
            'status' => 'success', 
            'data' => [
                'rates' => $rates,
                'sources' => $sources,
                'active_source' => $activeSource
            ]
        ]);
    }

    public function updateSyncSource() {
        if ($this->checkAuth() !== true) return;
        $data = json_decode(file_get_contents('php://input'), true);
        $source = $data['source'] ?? null;
        if (!$source) return $this->json(['status' => 'error', 'message' => 'Source required'], 400);

        if (ExchangeRateService::setSource($source)) {
            return $this->json(['status' => 'success', 'message' => 'Sync source updated']);
        }
        return $this->json(['status' => 'error', 'message' => 'Failed to update source'], 500);
    }

    public function updateExchangeRate() {
        if ($this->checkAuth() !== true) return;
        
        $data = json_decode(file_get_contents('php://input'), true);
        $code = $data['currency_code'] ?? null;
        $rate = $data['rate'] ?? null;

        if (!$code || !$rate) {
            return $this->json(['status' => 'error', 'message' => 'Code and Rate required'], 400);
        }

        if (ExchangeRateService::updateRate($code, $rate)) {
            return $this->json(['status' => 'success', 'message' => 'Rate updated']);
        }
        return $this->json(['status' => 'error', 'message' => 'Failed to update rate'], 500);
    }

    public function resetExchangeRate() {
        if ($this->checkAuth() !== true) return;
        $data = json_decode(file_get_contents('php://input'), true);
        $code = $data['currency_code'] ?? null;
        if (!$code) return $this->json(['status' => 'error', 'message' => 'Code required'], 400);

        if (ExchangeRateService::resetRate($code)) {
            // Force a sync to get the market rate immediately
            ExchangeRateService::getRates(true);
            return $this->json(['status' => 'success', 'message' => 'Rate reset to market']);
        }
        return $this->json(['status' => 'error', 'message' => 'Failed to reset rate'], 500);
    }

    public function previewSync() {
        if ($this->checkAuth() !== true) return;
        $summary = ExchangeRateService::previewSync();
        return $this->json(['status' => 'success', 'data' => $summary]);
    }

    public function applySync() {
        if ($this->checkAuth() !== true) return;
        $data = json_decode(file_get_contents('php://input'), true);
        $items = $data['items'] ?? [];
        
        $count = ExchangeRateService::applySync($items);
        return $this->json(['status' => 'success', 'message' => "Successfully applied $count rate updates"]);
    }

    public function getCompanyInfo() {
        if ($this->checkAuth() !== true) return;
        $db = new \App\Core\Database();
        $db->query("SELECT setting_key, setting_value FROM saas_settings WHERE setting_key LIKE 'company_%'");
        $results = $db->resultSet();
        $settings = [];
        foreach ($results as $row) {
            $settings[$row->setting_key] = $row->setting_value;
        }
        return $this->json(['status' => 'success', 'data' => $settings]);
    }

    public function updateCompanyInfo() {
        if ($this->checkAuth() !== true) return;
        $data = json_decode(file_get_contents('php://input'), true);
        
        $db = new \App\Core\Database();
        foreach ($data as $key => $val) {
            if (strpos($key, 'company_') === 0) {
                $db->query("UPDATE saas_settings SET setting_value = :val WHERE setting_key = :key");
                $db->bind(':val', $val);
                $db->bind(':key', $key);
                $db->execute();
            }
        }
        return $this->json(['status' => 'success', 'message' => 'Company settings updated']);
    }

    public function getMailSettings() {
        if ($this->checkAuth() !== true) return;
        $db = new \App\Core\Database();
        $db->query("SELECT setting_key, setting_value FROM saas_settings WHERE setting_key LIKE 'smtp_%'");
        $results = $db->resultSet();
        $settings = [];
        foreach ($results as $row) {
            $settings[$row->setting_key] = $row->setting_value;
        }
        
        // Ensure defaults if empty
        $defaults = [
            'smtp_host' => \App\Core\Config::SMTP_HOST,
            'smtp_port' => \App\Core\Config::SMTP_PORT,
            'smtp_user' => \App\Core\Config::SMTP_USER,
            'smtp_pass' => \App\Core\Config::SMTP_PASS,
            'smtp_encryption' => \App\Core\Config::SMTP_PORT == 465 ? 'ssl' : 'tls',
            'smtp_from_name' => \App\Core\Config::SMTP_FROM_NAME,
            'smtp_from_email' => \App\Core\Config::SMTP_FROM_EMAIL,
            'smtp_global_cc' => 'accounts@nebulync.com',
            'smtp_global_bcc' => 'thilinaruwan112@gmail.com',
        ];
        
        foreach ($defaults as $key => $val) {
            if (!isset($settings[$key])) $settings[$key] = $val;
        }

        return $this->json(['status' => 'success', 'data' => $settings]);
    }

    public function updateMailSettings() {
        if ($this->checkAuth() !== true) return;
        $data = json_decode(file_get_contents('php://input'), true);
        
        $db = new \App\Core\Database();
        foreach ($data as $key => $val) {
            if (strpos($key, 'smtp_') === 0) {
                // Check if exists first
                $db->query("SELECT setting_key FROM saas_settings WHERE setting_key = :key");
                $db->bind(':key', $key);
                if ($db->single()) {
                    $db->query("UPDATE saas_settings SET setting_value = :val WHERE setting_key = :key");
                } else {
                    $db->query("INSERT INTO saas_settings (setting_key, setting_value) VALUES (:key, :val)");
                }
                $db->bind(':val', $val);
                $db->bind(':key', $key);
                $db->execute();
            }
        }
        return $this->json(['status' => 'success', 'message' => 'Mail server settings updated']);
    }

    public function testMailConnection() {
        if ($this->checkAuth() !== true) return;
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Use provided settings or fallback to current
        $host = $data['smtp_host'] ?? \App\Core\Config::SMTP_HOST;
        $port = $data['smtp_port'] ?? \App\Core\Config::SMTP_PORT;
        $user = $data['smtp_user'] ?? \App\Core\Config::SMTP_USER;
        $pass = $data['smtp_pass'] ?? \App\Core\Config::SMTP_PASS;
        $encryption = $data['smtp_encryption'] ?? ($port == 465 ? 'ssl' : 'tls');
        $fromName = $data['smtp_from_name'] ?? \App\Core\Config::SMTP_FROM_NAME;
        $fromEmail = $data['smtp_from_email'] ?? \App\Core\Config::SMTP_FROM_EMAIL;

        try {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host       = $host;
            $mail->SMTPAuth   = true;
            $mail->Username   = $user;
            $mail->Password   = $pass;
            $mail->SMTPAutoTLS = true; 
            if ($encryption == 'ssl' || $port == 465) {
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
            } else {
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            }
            $mail->Port       = $port;
            $mail->setFrom($fromEmail, $fromName);

            // Bypass SSL verification for local/XAMPP compatibility
            $mail->SMTPOptions = [
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                ]
            ];

            $mail->addAddress($user); // Send to self as test
            $mail->Subject = "SMTP Test Connection - Nexus Portal";
            $mail->Body    = "If you receive this email, your SMTP settings are configured correctly.\n\nTimestamp: " . date('Y-m-d H:i:s');
            
            $mail->send();
            return $this->json(['status' => 'success', 'message' => 'Connection successful! Test email sent to ' . $user]);
        } catch (\Exception $e) {
            return $this->json(['status' => 'error', 'message' => 'Connection failed: ' . $e->getMessage()], 500);
        }
    }

    public function getAvailableLogos() {
        if ($this->checkAuth() !== true) return;
        
        $serverPublic = realpath(__DIR__ . '/../../public');
        $uiPublic = realpath(__DIR__ . '/../../../nexus-portal-ui/public');
        
        $logos = [];
        $seen = [];
        
        $scanDirs = [
            ['path' => $serverPublic . '/logos', 'prefix' => 'logos/'],
            ['path' => $serverPublic, 'prefix' => ''],
            ['path' => $uiPublic, 'prefix' => 'ui/']
        ];
        
        $logoObjects = [];
        foreach ($scanDirs as $dir) {
            if ($dir['path'] && is_dir($dir['path'])) {
                $files = scandir($dir['path']);
                foreach ($files as $file) {
                    if (in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), ['png', 'jpg', 'jpeg', 'svg', 'webp'])) {
                        $fullValue = $dir['prefix'] . $file;
                        $fullPath = $dir['path'] . DIRECTORY_SEPARATOR . $file;
                        if (!isset($seen[$file])) {
                            $logoObjects[] = [
                                'value' => $fullValue,
                                'mtime' => filemtime($fullPath)
                            ];
                            $seen[$file] = true;
                        }
                    }
                }
            }
        }
        
        // Sort by modification time descending
        usort($logoObjects, function($a, $b) {
            return $b['mtime'] - $a['mtime'];
        });
        
        $logos = array_column($logoObjects, 'value');
        
        return $this->json(['status' => 'success', 'data' => $logos]);
    }
}
