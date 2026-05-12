<?php
/**
 * PartController - Item master + stock adjustments.
 */
class PartController extends Controller {
    private $partModel;
    private $auditModel;

    public function __construct() {
        $this->partModel = $this->model('Part');
        $this->auditModel = $this->model('AuditLog');
        require_once '../app/helpers/InventorySchema.php';
        InventorySchema::ensure();
    }

    // GET /api/part/list?q=
    public function list() {
        $u = $this->requirePermission('parts.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') $this->error('Method Not Allowed', 405);
        $q = $_GET['q'] ?? '';
        $sid = isset($_GET['supplier_id']) ? (int)$_GET['supplier_id'] : 0;
        
        $locId = $this->currentLocationId($u);
        if ($locId > 0) {
            $rows = $this->partModel->listLocationBalances($locId, $q);
        } else {
            $rows = $this->partModel->list($q, $sid > 0 ? $sid : null);
        }
        
        $this->success($rows);
    }

    // GET /api/part/get/1
    public function get($id = null) {
        $this->requirePermission('parts.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') $this->error('Method Not Allowed', 405);
        if (!$id) $this->error('Part ID required', 400);
        $row = $this->partModel->getById($id);
        if (!$row) $this->error('Not found', 404);
        $this->success($row);
    }

    // POST /api/part/create
    public function create() {
        $u = $this->requirePermission('parts.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        $name = isset($data['part_name']) ? trim((string)$data['part_name']) : trim((string)($data['name'] ?? ''));
        $price = $data['price'] ?? null;
        if ($name === '' || $price === null) $this->error('Missing required fields', 400);

        $supplierIds = isset($data['supplier_ids']) && is_array($data['supplier_ids']) ? $data['supplier_ids'] : [];

        $payload = [
            'sku' => isset($data['sku']) && trim((string)$data['sku']) !== '' ? trim((string)$data['sku']) : null,
            'part_number' => isset($data['part_number']) && trim((string)$data['part_number']) !== '' ? trim((string)$data['part_number']) : null,
            'barcode_number' => isset($data['barcode_number']) && trim((string)$data['barcode_number']) !== '' ? trim((string)$data['barcode_number']) : null,
            'part_name' => $name,
            'unit' => isset($data['unit']) ? trim((string)$data['unit']) : null,
            'brand_id' => $data['brand_id'] ?? null,
            'stock_quantity' => $data['stock_quantity'] ?? 0,
            'cost_price' => $data['cost_price'] ?? null,
            'price' => $price,
            'reorder_level' => $data['reorder_level'] ?? null,
            'is_active' => $data['is_active'] ?? 1,
            'is_fifo' => $data['is_fifo'] ?? 0,
            'is_expiry' => $data['is_expiry'] ?? 0,
            'image_filename' => $data['image_filename'] ?? null,
            'item_type' => $data['item_type'] ?? 'Part',
            'recipe_type' => $data['recipe_type'] ?? 'Standard',
            'default_location_id' => $data['default_location_id'] ?? null,
            'allowed_locations' => $data['allowed_locations'] ?? null,
            'collection_ids' => $data['collection_ids'] ?? [],
            'wholesale_price' => $data['wholesale_price'] ?? null,
            'min_selling_price' => $data['min_selling_price'] ?? null,
            'price_2' => $data['price_2'] ?? null,
            'net_weight_kg' => $data['net_weight_kg'] ?? 0,
            'gross_weight_kg' => $data['gross_weight_kg'] ?? 0,
            'units_per_carton' => $data['units_per_carton'] ?? 1,
            'packing_type' => $data['packing_type'] ?? null,
            'hs_code' => $data['hs_code'] ?? null,
            'carton_length_cm' => $data['carton_length_cm'] ?? 0,
            'carton_width_cm' => $data['carton_width_cm'] ?? 0,
            'carton_height_cm' => $data['carton_height_cm'] ?? 0,
            'volume_cbm' => $data['volume_cbm'] ?? 0,
            'carton_tare_weight_kg' => $data['carton_tare_weight_kg'] ?? 0,
            'is_online' => $data['is_online'] ?? 0,
            'public_description' => $data['public_description'] ?? null,
        ];

        $newId = $this->partModel->create($payload, (int)$u['sub']);
        if ($newId) {
            // Save supplier mapping (optional)
            $this->partModel->setSuppliers((int)$newId, $supplierIds, (int)$u['sub']);

            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'location_id' => $this->currentLocationId($u),
                'action' => 'create',
                'entity' => 'part',
                'entity_id' => null,
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['part_name' => $name]),
            ]);
            $this->success(['id' => (int)$newId], 'Part created');
        }
        $this->error('Failed to create part', 500);
    }

    // POST /api/part/update/1
    public function update($id = null) {
        $u = $this->requirePermission('parts.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);
        if (!$id) $this->error('Part ID required', 400);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        $existing = $this->partModel->getById($id);
        if (!$existing) $this->error('Part not found', 404);

        $name = isset($data['part_name']) ? trim((string)$data['part_name']) : (isset($data['name']) ? trim((string)$data['name']) : $existing->part_name);
        $price = $data['price'] ?? $existing->price;
        if ($name === '' || $price === null) $this->error('Missing required fields', 400);

        $supplierIds = isset($data['supplier_ids']) && is_array($data['supplier_ids']) ? $data['supplier_ids'] : (isset($existing->supplier_ids) ? $existing->supplier_ids : []);

        $payload = [
            'sku' => isset($data['sku']) ? (trim((string)$data['sku']) !== '' ? trim((string)$data['sku']) : null) : $existing->sku,
            'part_number' => isset($data['part_number']) ? (trim((string)$data['part_number']) !== '' ? trim((string)$data['part_number']) : null) : $existing->part_number,
            'barcode_number' => isset($data['barcode_number']) ? (trim((string)$data['barcode_number']) !== '' ? trim((string)$data['barcode_number']) : null) : $existing->barcode_number,
            'part_name' => $name,
            'unit' => isset($data['unit']) ? trim((string)$data['unit']) : $existing->unit,
            'brand_id' => array_key_exists('brand_id', $data) ? $data['brand_id'] : $existing->brand_id,
            'cost_price' => array_key_exists('cost_price', $data) ? $data['cost_price'] : $existing->cost_price,
            'price' => $price,
            'reorder_level' => array_key_exists('reorder_level', $data) ? $data['reorder_level'] : $existing->reorder_level,
            'is_active' => isset($data['is_active']) ? $data['is_active'] : $existing->is_active,
            'is_fifo' => isset($data['is_fifo']) ? $data['is_fifo'] : $existing->is_fifo,
            'is_expiry' => isset($data['is_expiry']) ? $data['is_expiry'] : $existing->is_expiry,
            'image_filename' => array_key_exists('image_filename', $data) ? $data['image_filename'] : $existing->image_filename,
            'item_type' => $data['item_type'] ?? $existing->item_type,
            'recipe_type' => $data['recipe_type'] ?? $existing->recipe_type,
            'default_location_id' => array_key_exists('default_location_id', $data) ? $data['default_location_id'] : $existing->default_location_id,
            'allowed_locations' => array_key_exists('allowed_locations', $data) ? $data['allowed_locations'] : $existing->allowed_locations,
            'collection_ids' => $data['collection_ids'] ?? ($existing->collection_ids ?? []),
            'wholesale_price' => array_key_exists('wholesale_price', $data) ? $data['wholesale_price'] : $existing->wholesale_price,
            'min_selling_price' => array_key_exists('min_selling_price', $data) ? $data['min_selling_price'] : $existing->min_selling_price,
            'price_2' => array_key_exists('price_2', $data) ? $data['price_2'] : $existing->price_2,
            'net_weight_kg' => $data['net_weight_kg'] ?? $existing->net_weight_kg,
            'gross_weight_kg' => $data['gross_weight_kg'] ?? $existing->gross_weight_kg,
            'units_per_carton' => $data['units_per_carton'] ?? $existing->units_per_carton,
            'packing_type' => array_key_exists('packing_type', $data) ? $data['packing_type'] : $existing->packing_type,
            'hs_code' => array_key_exists('hs_code', $data) ? $data['hs_code'] : $existing->hs_code,
            'carton_length_cm' => $data['carton_length_cm'] ?? $existing->carton_length_cm,
            'carton_width_cm' => $data['carton_width_cm'] ?? $existing->carton_width_cm,
            'carton_height_cm' => $data['carton_height_cm'] ?? $existing->carton_height_cm,
            'volume_cbm' => $data['volume_cbm'] ?? $existing->volume_cbm,
            'carton_tare_weight_kg' => $data['carton_tare_weight_kg'] ?? $existing->carton_tare_weight_kg,
            'is_online' => isset($data['is_online']) ? $data['is_online'] : $existing->is_online,
            'out_of_stock' => isset($data['out_of_stock']) ? $data['out_of_stock'] : ($existing->out_of_stock ?? 0),
            'public_description' => array_key_exists('public_description', $data) ? $data['public_description'] : $existing->public_description,
        ];

        if ($this->partModel->update($id, $payload, (int)$u['sub'])) {
            // Save supplier mapping (optional)
            $this->partModel->setSuppliers((int)$id, $supplierIds, (int)$u['sub']);

            // Save attributes (Specifications)
            if (isset($data['attributes']) && is_array($data['attributes'])) {
                require_once '../app/models/PartAttribute.php';
                $attrModel = new PartAttribute();
                $attrModel->syncPartAttributes($id, $data['attributes']);
            }

            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'location_id' => $this->currentLocationId($u),
                'action' => 'update',
                'entity' => 'part',
                'entity_id' => (int)$id,
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['part_name' => $name]),
            ]);
            $this->success(null, 'Part updated');
        }
        $this->error('Failed to update part', 500);
    }

    // POST /api/part/set_image/1
    public function set_image($id = null) {
        $u = $this->requirePermission('parts.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);
        if (!$id) $this->error('Part ID required', 400);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $fn = isset($data['image_filename']) ? trim((string)$data['image_filename']) : trim((string)($data['filename'] ?? ''));
        if ($fn === '') $this->error('Filename is required', 400);
        if ($this->partModel->setImage($id, $fn, (int)$u['sub'])) {
            $this->success(null, 'Image set');
        }
        $this->error('Failed to set image', 500);
    }

    // DELETE /api/part/delete/1
    public function delete($id = null) {
        $u = $this->requirePermission('parts.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') $this->error('Method Not Allowed', 405);
        if (!$id) $this->error('Part ID required', 400);
        if ($this->partModel->delete($id)) {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'location_id' => $this->currentLocationId($u),
                'action' => 'delete',
                'entity' => 'part',
                'entity_id' => (int)$id,
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => null,
            ]);
            $this->success(null, 'Part deleted');
        }
        $this->error('Failed to delete part', 500);
    }

    // POST /api/part/adjust_stock
    public function adjust_stock() {
        $u = $this->requirePermission('stock.adjust');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $partId = (int)($data['part_id'] ?? $data['partId'] ?? 0);
        $qty = (int)($data['qty_change'] ?? $data['qtyChange'] ?? 0);
        $notes = isset($data['notes']) ? trim((string)$data['notes']) : null;
        if ($partId <= 0 || $qty === 0) $this->error('Invalid adjustment', 400);

        $locId = $this->currentLocationId($u);
        $ok = $this->partModel->adjustStock($partId, $qty, $notes, (int)$u['sub'], $locId);
        if ($ok) $this->success(null, 'Stock adjusted');
        $this->error('Stock adjustment failed (insufficient stock or invalid part)', 400);
    }

    // GET /api/part/movements/1
    public function movements($id = null) {
        $this->requirePermission('stock.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') $this->error('Method Not Allowed', 405);
        if (!$id) $this->error('Part ID required', 400);
        $locId = isset($_GET['location_id']) ? (int)$_GET['location_id'] : 0;

        // Optional date range (YYYY-MM-DD). Defaults handled by UI.
        $from = isset($_GET['from']) ? trim((string)$_GET['from']) : '';
        $to = isset($_GET['to']) ? trim((string)$_GET['to']) : '';
        $fromDt = null;
        $toDt = null;
        if ($from !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) $fromDt = $from . ' 00:00:00';
        if ($to !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) $toDt = $to . ' 23:59:59';

        $rows = $this->partModel->listMovements($id, $_GET['limit'] ?? 200, $locId, $fromDt, $toDt);
        $this->success($rows);
    }

    // GET /api/part/location_balances?location_id=1&q=
    public function location_balances() {
        $this->requirePermission('stock.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') $this->error('Method Not Allowed', 405);
        $locId = isset($_GET['location_id']) ? (int)$_GET['location_id'] : 0;
        if ($locId <= 0) $this->error('location_id is required', 400);
        $q = $_GET['q'] ?? '';
        $rows = $this->partModel->listLocationBalances($locId, $q);
        $this->success($rows);
    }

    // GET /api/part/location_stock/1?location_id=2
    // Used by Stock Transfers UI to show stock available at the selected source location.
    public function location_stock($id = null) {
        // Stock visibility is part of reporting; transfers also use this endpoint.
        $this->requirePermission('stock.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') $this->error('Method Not Allowed', 405);
        if (!$id) $this->error('Part ID required', 400);
        $locId = isset($_GET['location_id']) ? (int)$_GET['location_id'] : 0;
        if ($locId <= 0) $this->error('location_id is required', 400);
        $row = $this->partModel->getLocationStock((int)$id, $locId);
        if (!$row) $this->error('Not found', 404);
        $this->success($row);
    }

    // GET /api/part/adjustments?part_id=1&limit=200
    // Lists stock adjustment records from stock_movements.
    public function adjustments() {
        $this->requirePermission('stock.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') $this->error('Method Not Allowed', 405);

        InventorySchema::ensure();

        $partId = isset($_GET['part_id']) ? (int)$_GET['part_id'] : 0;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 200;
        if ($limit <= 0) $limit = 200;
        if ($limit > 1000) $limit = 1000;

        $db = new Database();
        $sql = "
            SELECT sm.id,
                   sm.part_id,
                   p.part_name,
                   p.sku,
                   sm.qty_change,
                   sm.notes,
                   sm.created_at,
                   sm.created_by,
                   u.name AS created_by_name
            FROM stock_movements sm
            INNER JOIN parts p ON p.id = sm.part_id
            LEFT JOIN users u ON u.id = sm.created_by
            WHERE sm.movement_type = 'ADJUSTMENT'
        ";
        if ($partId > 0) {
            $sql .= " AND sm.part_id = :pid ";
        }
        $sql .= " ORDER BY sm.id DESC LIMIT {$limit}";

        $db->query($sql);
        if ($partId > 0) {
            $db->bind(':pid', $partId);
        }
        $rows = $db->resultSet();
        $this->success($rows);
    }

    // GET /api/part/batches/1
    public function batches($id = null) {
        $this->requirePermission('parts.read');
        if (!$id) $this->error('Part ID required', 400);
        
        require_once '../app/models/InventoryBatch.php';
        $batchModel = new InventoryBatch();
        $locationId = (int)($_GET['location_id'] ?? 1);
        
        $rows = $batchModel->getAvailableBatches($id, $locationId);
        $this->success($rows);
    }

    // POST /api/part/gallery/update/1
    public function gallery_update($id = null) {
        $this->requirePermission('parts.write');
        if (!$id) $this->error('Part ID required', 400);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $images = $data['images'] ?? [];
        
        require_once '../app/models/PartImage.php';
        $imgModel = new PartImage();
        if ($imgModel->syncGallery($id, $images)) {
            $this->success(null, 'Gallery updated');
        }
        $this->error('Failed to update gallery');
    }

    // DELETE /api/part/gallery/delete/1
    public function gallery_delete($id = null) {
        $u = $this->requirePermission('parts.write');
        if (!$id) $this->error('ID required', 400);
        
        require_once '../app/models/PartImage.php';
        $imgModel = new PartImage();
        if ($imgModel->delete($id)) {
            $this->success(null, 'Image deleted');
        }
        $this->error('Failed to delete image');
    }

    // POST /api/part/bulk_update_discount
    public function bulk_update_discount() {
        $u = $this->requirePermission('parts.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        
        $ids = $data['ids'] ?? [];
        $type = $data['discount_type'] ?? 'None';
        $value = $data['discount_value'] ?? 0;
        
        if (empty($ids)) $this->error('Product IDs are required', 400);
        
        if ($this->partModel->bulkUpdateDiscount($ids, $type, $value)) {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'location_id' => $this->currentLocationId($u),
                'action' => 'bulk_update_discount',
                'entity' => 'part',
                'entity_id' => null,
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['count' => count($ids), 'type' => $type, 'value' => $value]),
            ]);
            $this->success(null, 'Discounts updated for ' . count($ids) . ' products');
        }
        $this->error('Failed to update discounts');
    }
}
