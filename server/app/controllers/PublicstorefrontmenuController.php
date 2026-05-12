<?php
/**
 * Public Storefront Menu Controller
 * Provides public API access to storefront navigation menus using API Key authentication.
 */
class PublicstorefrontmenuController extends Controller {
    private $menuModel;
    private $apiClientModel;

    public function __construct() {
        $this->menuModel = $this->model('StorefrontMenu');
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
     */
    private function validatePublicApiKey() {
        $this->handlePublicCors();
        $headerKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if (empty($headerKey)) {
            $this->error('API Key required', 401);
        }

        if (!$this->apiClientModel->validate($headerKey, $origin)) {
            $this->error('Access Denied: Invalid Key or unauthorized Domain', 403);
        }
    }

    /**
     * GET /api/publicstorefrontmenu/menus
     * Fetches the navigation menu tree for a specific location.
     */
    public function menus() {
        $this->handlePublicCors();
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
        }

        $this->validatePublicApiKey();

        $locationId = isset($_GET['location_id']) ? (int)$_GET['location_id'] : 0;
        if ($locationId <= 0) {
            // If location_id is not provided, we might want to return global menus (location_id IS NULL)
            // But usually, public storefronts are linked to a location.
            // Let's allow null to return global menus.
            $locationId = null;
        }

        $tree = $this->menuModel->getTree(true, $locationId);
        
        $this->success($this->sanitizeMenuTree($tree));
    }

    private function sanitizeMenuTree($items) {
        $sanitized = [];
        foreach ($items as $item) {
            $sanitizedItem = [
                'id' => (int)$item->id,
                'label' => (string)$item->label,
                'link_type' => (string)$item->link_type,
                'link_value' => (string)$item->link_value,
                'is_mega_menu' => (int)($item->is_mega_menu ?? 0) === 1,
                'children' => []
            ];

            if (!empty($item->children)) {
                $sanitizedItem['children'] = $this->sanitizeMenuTree($item->children);
            }

            $sanitized[] = $sanitizedItem;
        }
        return $sanitized;
    }
}
