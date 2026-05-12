<?php
/**
 * Public Classification Controller
 * Provides public API access to item sections, departments, categories, and collections.
 */
class PublicclassificationController extends Controller {
    private $apiClientModel;

    public function __construct() {
        $this->apiClientModel = $this->model('ApiClient');
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
    }

    // GET /api/publicclassification/sections
    public function sections() {
        $this->validatePublicApiKey();
        $model = $this->model('ItemBreakdown');
        $this->success($model->sections());
    }

    // GET /api/publicclassification/departments
    public function departments() {
        $this->validatePublicApiKey();
        $model = $this->model('ItemBreakdown');
        $sectionId = isset($_GET['section_id']) ? (int)$_GET['section_id'] : null;
        $this->success($model->departments($sectionId));
    }

    // GET /api/publicclassification/categories
    public function categories() {
        $this->validatePublicApiKey();
        $model = $this->model('ItemBreakdown');
        $deptId = isset($_GET['department_id']) ? (int)$_GET['department_id'] : null;
        $this->success($model->categories($deptId));
    }

    // GET /api/publicclassification/collections
    public function collections() {
        $this->validatePublicApiKey();
        $model = $this->model('Collection');
        $this->success($model->getAll(true)); // true for show_in_public
    }
}
