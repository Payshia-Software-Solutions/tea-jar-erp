<?php
/**
 * Public Content Controller
 * Provides public API access to storefront content (Banners, Top Bar, Hero).
 */
class PubliccontentController extends Controller {
    private $apiClientModel;
    private $settingModel;

    public function __construct() {
        $this->apiClientModel = $this->model('ApiClient');
        $this->settingModel = $this->model('StorefrontSetting');
    }

    private function handlePublicCors() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Allow-Headers: X-API-Key, Content-Type');
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            header('Access-Control-Allow-Origin: *');
            http_response_code(204);
            exit;
        }
        header('Access-Control-Allow-Origin: *');
    }

    /**
     * GET /api/publiccontent/settings
     * Returns storefront content settings grouped by section.
     */
    public function settings() {
        $this->handlePublicCors();
        
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        $client = $this->apiClientModel->getByKey($apiKey);
        $locationId = $client->location_id ?? 1;

        $settings = $this->settingModel->getGrouped($locationId);
        
        // Add Taxes and Inclusive preference
        require_once '../app/models/Tax.php';
        require_once '../app/models/ServiceLocation.php';
        $taxModel = new Tax();
        $locModel = new ServiceLocation();
        
        $location = $locModel->getById($locationId);
        $taxIds = !empty($location->allowed_taxes_json) ? json_decode($location->allowed_taxes_json, true) : [];
        $taxes = $taxModel->getByIds($taxIds);
        
        $settings['taxes'] = $taxes;
        $settings['tax_inclusive'] = ($settings['ecom_tax_inclusive'] ?? '0') === '1';

        $this->success($settings);
    }
}
