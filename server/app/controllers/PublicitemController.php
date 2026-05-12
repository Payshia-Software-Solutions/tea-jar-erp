<?php
/**
 * Public Item Controller
 * Provides public API access to inventory items using API Key authentication.
 */
class PublicitemController extends Controller {
    private $itemModel;
    private $apiClientModel;

    public function __construct() {
        $this->itemModel = $this->model('Part');
        $this->apiClientModel = $this->model('ApiClient');
    }

    /**
     * Handles dynamic CORS based on multi-client domains.
     */
    private function handlePublicCors() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        
        // Basic preflight response - we'll let the actual request validation handle the logic
        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Allow-Headers: X-API-Key, Content-Type');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            // Check if origin is allowed for this key (if key provided)
            if (!empty($apiKey) && !empty($origin)) {
                if ($this->apiClientModel->validate($apiKey, $origin)) {
                    header('Access-Control-Allow-Origin: ' . $origin);
                    http_response_code(204);
                    exit;
                }
            }
            
            // Default preflight if no specific match
            header('Access-Control-Allow-Origin: *');
            http_response_code(204);
            exit;
        }

        // For actual requests, validate and set Origin header
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
     * GET /api/publicitem/inventory
     * Lists active products for a specific location.
     */
    public function inventory() {
        $this->handlePublicCors();
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
        }

        $this->validatePublicApiKey();

        $locationId = isset($_GET['location_id']) ? (int)$_GET['location_id'] : 0;
        if ($locationId <= 0) $this->error('Location ID is required', 400);

        $collectionId = isset($_GET['collection_id']) ? (int)$_GET['collection_id'] : null;
        $categoryId = isset($_GET['category_id']) ? (int)$_GET['category_id'] : null;

        // Fetch items for this location
        $items = $this->itemModel->listLocationBalances($locationId);
        
        require_once '../app/models/PartAttribute.php';
        $attrModel = new PartAttribute();

        $contentUrl = defined('CONTENT_BASE_URL') ? CONTENT_BASE_URL : 'https://content-provider.payshia.com/service-center-system/';
        $itemsDir = defined('CONTENT_ITEMS_DIR') ? CONTENT_ITEMS_DIR : 'items';
        $imageBaseUrl = rtrim($contentUrl, '/') . '/' . trim($itemsDir, '/') . '/';

        $sanitized = [];
        foreach ($items as $item) {
            // Only online enabled items
            if ((int)($item->is_online ?? 0) !== 1) continue;
            if ((int)$item->is_active !== 1) continue;

            // Optional collection filtering
            if ($collectionId !== null) {
                if (!in_array($collectionId, $item->collection_ids ?? [])) continue;
            }

            // Optional category filtering
            if ($categoryId !== null && (int)$item->item_category_id !== $categoryId) continue;

            $sanitizedGallery = array_map(function($img) use ($imageBaseUrl) {
                return [
                    'id' => (int)$img->id,
                    'image_url' => $imageBaseUrl . $img->filename,
                    'label' => (string)($img->label ?? '')
                ];
            }, $item->gallery ?: []);

            $sanitized[] = [
                'id' => (int)$item->id,
                'name' => (string)$item->part_name,
                'slug' => (string)($item->slug ?? ''),
                'sku' => (string)$item->sku,
                'price' => (float)$item->price,
                'discount_type' => (string)($item->discount_type ?? 'None'),
                'discount_value' => (float)($item->discount_value ?? 0),
                'brand' => (string)($item->brand_name ?? 'Generic'),
                'item_type' => (string)$item->item_type,
                'is_in_stock' => (float)$item->stock_quantity > 0,
                'stock_qty' => (float)$item->stock_quantity,
                'image_url' => !empty($item->image_filename) ? $imageBaseUrl . $item->image_filename : null,
                'gallery' => $sanitizedGallery,
                'category_ids' => $item->collection_ids ?? [],
                'attributes' => $attrModel->getPartAttributesGrouped($item->id)
            ];
        }

        $this->success(array_values($sanitized));
    }

    /**
     * GET /api/publicitem/get/{id}
     * Returns detailed sanitized data for one product.
     */
    public function get($id) {
        $this->handlePublicCors();
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
        }

        $this->validatePublicApiKey();

        $locationId = isset($_GET['location_id']) ? (int)$_GET['location_id'] : 0;
        // Optional for single item but recommended
        
        if (is_numeric($id)) {
            $item = $this->itemModel->getById($id);
        } else {
            $item = $this->itemModel->getBySlug($id);
        }
        if (!$item || (int)$item->is_active === 0 || (isset($item->is_online) && (int)$item->is_online !== 1)) {
            $this->error('Product not found', 404);
        }

        // If location provided, get location-specific stock
        if ($locationId > 0) {
            $balance = $this->itemModel->getLocationStock($item->id, $locationId);
            $item->stock_quantity = $balance ? $balance->available : 0;
        }

        $contentUrl = defined('CONTENT_BASE_URL') ? CONTENT_BASE_URL : 'https://content-provider.payshia.com/service-center-system/';
        $itemsDir = defined('CONTENT_ITEMS_DIR') ? CONTENT_ITEMS_DIR : 'items';
        $imageBaseUrl = rtrim($contentUrl, '/') . '/' . trim($itemsDir, '/') . '/';

        require_once '../app/models/PartAttribute.php';
        $attrModel = new PartAttribute();

        $sanitized = [
            'id' => (int)$item->id,
            'name' => (string)$item->part_name,
            'slug' => (string)($item->slug ?? ''),
            'sku' => (string)$item->sku,
            'part_number' => (string)$item->part_number,
            'description' => (string)$item->public_description, 
            'price' => (float)$item->price,
            'discount_type' => (string)($item->discount_type ?? 'None'),
            'discount_value' => (float)($item->discount_value ?? 0),
            'brand' => (string)($item->brand_name ?? 'Generic'),
            'item_type' => (string)$item->item_type,
            'unit' => (string)$item->unit,
            'is_in_stock' => (float)$item->stock_quantity > 0,
            'stock_qty' => (float)$item->stock_quantity,
            'image_url' => !empty($item->image_filename) ? $imageBaseUrl . $item->image_filename : null,
            'gallery' => array_map(function($img) use ($imageBaseUrl) {
                return [
                    'id' => (int)$img->id,
                    'image_url' => $imageBaseUrl . $img->filename,
                    'label' => (string)$img->label
                ];
            }, $item->gallery ?: []),
            'collections' => array_map(function($c) {
                return ['id' => $c->id, 'name' => $c->name];
            }, $item->collections ?: []),
            'attributes' => $attrModel->getPartAttributesGrouped($item->id)
        ];

        $this->success($sanitized);
    }

    /**
     * GET /api/publicitem/sync_slugs
     * Maintenance tool to initialize slugs for existing products.
     */
    public function sync_slugs() {
        $this->handlePublicCors();
        $count = $this->itemModel->syncSlugs();
        $this->success(['count' => $count], "Slugs synced");
    }
}
