<?php
/**
 * Public Collection Controller
 * Provides public API access to product collections using API Key authentication.
 */
class PubliccollectionController extends Controller {
    private $collectionModel;
    private $apiClientModel;

    public function __construct() {
        $this->collectionModel = $this->model('Collection');
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
     * GET /api/publiccollection/list
     * Lists collections marked as 'show_in_public'.
     */
    public function list() {
        $this->handlePublicCors();

        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
        }

        $this->validatePublicApiKey();

        // Fetch all public collections
        $rows = $this->collectionModel->getAll(true);
        
        $sanitized = array_map(function($row) {
            return [
                'id' => (int)$row->id,
                'name' => (string)$row->name,
            ];
        }, $rows);

        $this->success($sanitized);
    }

    /**
     * GET /api/publiccollection/products/{id}
     * Returns products for a collection, filtered by location and online status.
     */
    public function products($id) {
        $this->handlePublicCors();
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
        }

        $this->validatePublicApiKey();

        $locationId = isset($_GET['location_id']) ? (int)$_GET['location_id'] : 0;
        if ($locationId <= 0) $this->error('Location ID is required', 400);

        require_once '../app/models/Part.php';
        $partModel = new Part();
        $items = $partModel->listLocationBalances($locationId);
        
        $sanitized = [];
        foreach ($items as $item) {
            if ((int)$item->is_active !== 1 || (isset($item->is_online) && (int)$item->is_online !== 1)) continue;

            $cids = $item->collection_ids ? (is_array($item->collection_ids) ? $item->collection_ids : explode(',', (string)$item->collection_ids)) : [];
            if (!in_array($id, $cids)) continue;

            $sanitized[] = [
                'id' => (int)$item->id,
                'name' => (string)$item->part_name,
                'sku' => (string)$item->sku,
                'price' => (float)$item->price,
                'image_url' => !empty($item->image_filename) ? $item->image_filename : null,
                'is_in_stock' => (float)$item->stock_quantity > 0
            ];
        }

        $this->success($sanitized);
    }
}
