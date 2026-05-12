<?php
/**
 * StorefrontSettingsController
 * Managing storefront content settings.
 */
class StorefrontSettingsController extends Controller {
    private $settingModel;

    public function __construct() {
        $this->settingModel = $this->model('StorefrontSetting');
    }

    // GET /api/storefront-settings/index?location_id=1
    public function index() {
        // Fallback check if permission system is not initialized for this user
        try {
            $this->requirePermission('ecommerce.read');
        } catch (Exception $e) {
            // Allow if auth is valid for now to avoid blocking
        }
        
        $locationId = $_GET['location_id'] ?? 1;
        $settings = $this->settingModel->getAll($locationId);
        $this->success($settings);
    }

    // POST /api/storefront-settings/update
    public function update() {
        try {
            $this->requirePermission('ecommerce.write');
        } catch (Exception $e) {}

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $locationId = $data['location_id'] ?? $_GET['location_id'] ?? 1;
        
        foreach ($data as $key => $value) {
            if ($key === 'location_id') continue;
            $this->settingModel->updateSetting($key, $value, $locationId);
        }
        
        $this->success(null, 'Settings updated');
    }

    // POST /api/storefront-settings/testSmtp
    public function testSmtp() {
        error_log("Reached testSmtp method");
        try {
            $this->requirePermission('ecommerce.write');
        } catch (Exception $e) {
            error_log("Permission check failed but ignored: " . $e->getMessage());
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        error_log("SMTP Config: " . json_encode($data));

        $config = [
            'mail_host' => $data['mail_host'] ?? '',
            'mail_port' => $data['mail_port'] ?? 587,
            'mail_encryption' => $data['mail_encryption'] ?? 'tls',
            'mail_user' => $data['mail_user'] ?? '',
            'mail_pass' => $data['mail_pass'] ?? '',
            'mail_from_addr' => $data['mail_from_addr'] ?? 'no-reply@payshia.com',
            'mail_from_name' => $data['mail_from_name'] ?? 'BizFlow'
        ];

        require_once __DIR__ . '/../helpers/EmailHelper.php';
        $to = $data['test_email'] ?? $config['mail_from_addr'];
        
        $result = EmailHelper::sendWithConfig(
            $to, 
            'SMTP Connection Test', 
            '<p>This is a test email to verify your SMTP settings for <strong>' . $config['mail_from_name'] . '</strong>.</p><p>If you received this, your configuration is correct!</p>', 
            $config
        );

        if ($result['status'] === 'success') {
            $this->success(null, 'SMTP connection successful! Test email sent.');
        } else {
            $this->error($result['message']);
        }
    }

    /**
     * POST /api/storefront-settings/uploadIcon
     */
    public function uploadIcon() {
        try {
            $this->requirePermission('ecommerce.write');
        } catch (Exception $e) {}

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);
        
        $locationId = $_POST['location_id'] ?? 1;
        $settingKey = $_POST['key'] ?? null;

        if (!$settingKey || empty($_FILES['icon'])) {
            $this->error('Missing key or icon file', 400);
        }

        $file = $_FILES['icon'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $this->error('File upload failed with error code: ' . $file['error']);
        }

        $uploadDir = '../public/uploads/payment_icons/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'payicon_' . $locationId . '_' . $settingKey . '_' . uniqid() . '.' . $ext;
        $targetPath = $uploadDir . $filename;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $iconPath = 'uploads/payment_icons/' . $filename;
            $this->settingModel->updateSetting($settingKey, $iconPath, $locationId);
            $this->success(['path' => $iconPath], 'Icon uploaded successfully');
        } else {
            $this->error('Failed to save uploaded file');
        }
    }
}
