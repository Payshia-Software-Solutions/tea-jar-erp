<?php
/**
 * Public Location Controller
 * Provides public API access to location-specific settings (e.g. Analytics, Pixel).
 */
class PubliclocationController extends Controller {
    private $locationModel;
    private $apiClientModel;

    public function __construct() {
        $this->locationModel = $this->model('ServiceLocation');
        $this->apiClientModel = $this->model('ApiClient');
    }

    /**
     * Handles dynamic CORS based on multi-client domains.
     */
    private function handlePublicCors() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        
        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Allow-Headers: X-API-Key, Content-Type');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            if (!empty($apiKey) && !empty($origin)) {
                if ($this->apiClientModel->validate($apiKey, $origin)) {
                    header('Access-Control-Allow-Origin: ' . $origin);
                    http_response_code(204);
                    exit;
                }
            }
            header('Access-Control-Allow-Origin: *');
            http_response_code(204);
            exit;
        }

        if (!empty($origin) && !empty($apiKey)) {
            if ($this->apiClientModel->validate($apiKey, $origin)) {
                header('Access-Control-Allow-Origin: ' . $origin);
            }
        } else {
            header('Access-Control-Allow-Origin: *');
        }
    }

    /**
     * Internal helper to validate the X-API-Key and its Domain.
     * Returns the API client record if valid.
     */
    private function validatePublicApiKey() {
        $this->handlePublicCors();

        $headerKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if (empty($headerKey)) {
            $this->error('API Key required', 401);
        }

        // Validate and get client info
        $client = $this->apiClientModel->getByKey($headerKey);

        if (!$client) {
            $this->error('Access Denied: Invalid Key', 403);
        }

        // Domain validation (logic copied from ApiClient model for consistency here)
        $targetDomain = rtrim(strtolower($client->domain), '/');
        $requestOrigin = rtrim(strtolower($origin), '/');

        if ($targetDomain !== '*' && $targetDomain !== $requestOrigin) {
             $this->error('Access Denied: Unauthorized Domain', 403);
        }

        return $client;
    }

    /**
     * GET /api/publiclocation/settings
     * Returns analytics and pixel codes for the location associated with the API key.
     */
    public function settings() {
        $this->handlePublicCors();
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
        }

        $client = $this->validatePublicApiKey();
        
        $requestedLocId = isset($_GET['location_id']) ? (int)$_GET['location_id'] : 0;
        $locId = $requestedLocId > 0 ? $requestedLocId : $client->location_id;

        if (empty($locId)) {
            $this->error('API Client is not linked to any location', 400);
        }

        require_once '../app/models/Tax.php';
        require_once '../app/models/StorefrontSetting.php';
        $taxModel = new Tax();
        $settingsModel = new StorefrontSetting();

        $location = $this->locationModel->getById($locId);
        if (!$location) {
            $this->error('Location not found', 404);
        }

        $taxIds = !empty($location->allowed_taxes_json) ? json_decode($location->allowed_taxes_json, true) : [];
        $taxes = $taxModel->getByIds($taxIds);
        $settings = $settingsModel->getAll($locId);

        $this->success([
            'location_id' => (int)$location->id,
            'location_name' => (string)$location->name,
            'google_analytics_code' => (string)$location->google_analytics_code,
            'facebook_pixel_code' => (string)$location->facebook_pixel_code,
            'taxes' => $taxes,
            'tax_inclusive' => ($settings['ecom_tax_inclusive'] ?? '0') === '1',
            'kiosk_settings' => [
                'welcome_title' => $settings['kiosk_welcome_title'] ?? 'Welcome to Your Stay',
                'welcome_subtitle' => $settings['kiosk_welcome_subtitle'] ?? 'Select a service below to elevate your experience',
                'dining_title' => $settings['kiosk_dining_title'] ?? 'Order Products',
                'dining_subtitle' => $settings['kiosk_dining_subtitle'] ?? 'Explore our culinary offerings and order directly to your room.',
                'exp_title' => $settings['kiosk_exp_title'] ?? 'Book an Experience',
                'exp_subtitle' => $settings['kiosk_exp_subtitle'] ?? 'Discover and book spa treatments, tours, and premium services.',
                'logo_url' => $settings['kiosk_logo_url'] ?? '',
            ]
        ]);
    }
}
