<?php
/**
 * Public Settings Controller
 * Provides public API access to storefront settings (Analytics, Pixel, IPG).
 */
class PublicsettingsController extends Controller {
    private $apiClientModel;
    private $settingModel;

    public function __construct() {
        $this->apiClientModel = $this->model('ApiClient');
        $this->settingModel = $this->model('SystemSetting');
    }

    private function handlePublicCors() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Allow-Headers: X-API-Key, Content-Type');
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            if (!empty($apiKey) && !empty($origin) && $this->apiClientModel->validate($apiKey, $origin)) {
                header('Access-Control-Allow-Origin: ' . $origin);
            } else {
                header('Access-Control-Allow-Origin: *');
            }
            http_response_code(204);
            exit;
        }
        if (!empty($origin) && !empty($apiKey) && $this->apiClientModel->validate($apiKey, $origin)) {
            header('Access-Control-Allow-Origin: ' . $origin);
        } else {
            header('Access-Control-Allow-Origin: *');
        }
    }

    private function validatePublicApiKey() {
        $this->handlePublicCors();
        $headerKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if (empty($headerKey) || !$this->apiClientModel->validate($headerKey, $origin)) {
            $this->error('Unauthorized', 403);
        }
        return $this->apiClientModel->getByKey($headerKey);
    }

    /**
     * GET /api/publicsettings/storefront
     * Returns location-specific and global storefront settings.
     */
    public function storefront() {
        $client = $this->validatePublicApiKey();
        
        $locationId = (int)($client->location_id ?? $_GET['location_id'] ?? 0);
        if ($locationId <= 0) $this->error('Location ID is required', 400);

        $locationModel = $this->model('ServiceLocation');
        $location = $locationModel->getById($locationId);
        
        if (!$location) $this->error('Location not found', 404);

        // Global Settings
        $allSettings = $this->settingModel->getAll();
        
        // Filter only public settings
        $publicSettings = [
            'payhere_merchant_id' => $allSettings['payhere_merchant_id'] ?? '',
            'payhere_is_sandbox' => (int)($allSettings['payhere_is_sandbox'] ?? 1) === 1,
            'currency_code' => $allSettings['currency_code'] ?? 'LKR',
            'store_name' => $allSettings['store_name'] ?? $location->name,
            'contact_email' => $allSettings['contact_email'] ?? '',
            'contact_phone' => $allSettings['contact_phone'] ?? $location->phone,
        ];

        $this->success([
            'location' => [
                'id' => (int)$location->id,
                'name' => (string)$location->name,
                'address' => (string)$location->address,
                'phone' => (string)$location->phone,
                'google_analytics_code' => (string)$location->google_analytics_code,
                'facebook_pixel_code' => (string)$location->facebook_pixel_code
            ],
            'settings' => $publicSettings
        ]);
    }
}
