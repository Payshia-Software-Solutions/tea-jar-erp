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
        $settings = $this->settingModel->getGrouped();
        $this->success($settings);
    }
}
