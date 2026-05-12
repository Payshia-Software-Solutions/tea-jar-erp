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
        
        if (empty($client->location_id)) {
            $this->error('API Client is not linked to any location', 400);
        }

        $location = $this->locationModel->getById($client->location_id);
        if (!$location) {
            $this->error('Location not found', 404);
        }

        $this->success([
            'location_id' => (int)$location->id,
            'location_name' => (string)$location->name,
            'google_analytics_code' => (string)$location->google_analytics_code,
            'facebook_pixel_code' => (string)$location->facebook_pixel_code
        ]);
    }
}
