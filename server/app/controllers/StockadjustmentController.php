<?php
/**
 * StockAdjustmentController (batch adjustments - direct committed ledger viewer)
 *
 * Endpoints:
 * - GET  /api/stockadjustment/list?q=
 * - GET  /api/stockadjustment/get/{id}
 * - POST /api/stockadjustment/create
 */
class StockadjustmentController extends Controller {
    private $model;
    private $auditModel;

    public function __construct() {
        InventorySchema::ensure(true);
        $this->model = $this->model('StockAdjustment');
        $this->auditModel = $this->model('AuditLog');
    }

    public function list() {
        $u = $this->requirePermission('stock.read');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') $this->error('Method Not Allowed', 405);
        $locId = $this->currentLocationId($u);
        $rows = $this->model->list($_GET['q'] ?? '', $locId);
        $this->success($rows);
    }

    public function get($id = null) {
        $u = $this->requirePermission('stock.read');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') $this->error('Method Not Allowed', 405);
        if (!$id) $this->error('Adjustment ID required', 400);
        $locId = $this->currentLocationId($u);
        $row = $this->model->getById($id, $locId);
        if (!$row) $this->error('Not found', 404);
        $this->success($row);
    }

    public function create() {
        $u = $this->requirePermission('stock.read');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') $this->error('Method Not Allowed', 405);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $locId = $this->currentLocationId($u);
        if (isset($_GET['location_id']) && (int)$_GET['location_id'] > 0) {
            $locId = (int)$_GET['location_id'];
        } elseif (isset($data['location_id']) && (int)$data['location_id'] > 0) {
            $locId = (int)$data['location_id'];
        }
        $res = $this->model->create($data, (int)$u['sub'], $locId);
        if (is_array($res) && isset($res['error'])) {
            $this->error($res['error'], 400);
        }
        if ($res) {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'location_id' => $this->currentLocationId($u),
                'action' => 'create',
                'entity' => 'stock_adjustment',
                'entity_id' => (int)$res,
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['line_count' => is_array($data['items'] ?? null) ? count($data['items']) : 0]),
            ]);
            $this->success(['id' => (int)$res], 'Adjustment created');
        }
        $this->error('Failed to create adjustment', 400);
    }
}
