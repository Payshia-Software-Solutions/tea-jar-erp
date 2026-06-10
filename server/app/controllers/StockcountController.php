<?php
/**
 * StockcountController (physical stock counting / auditing)
 *
 * Endpoints:
 * - GET  /api/stockcount/list?q=&status=
 * - GET  /api/stockcount/get/{id}
 * - POST /api/stockcount/create
 * - POST /api/stockcount/approve/{id}
 * - POST /api/stockcount/reject/{id}
 */
class StockcountController extends Controller {
    private $model;
    private $auditModel;

    public function __construct() {
        // InventorySchema::ensure();
        $this->model = $this->model('StockCount');
        $this->auditModel = $this->model('AuditLog');
    }

    public function list() {
        $u = $this->requirePermission('stock.read');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') $this->error('Method Not Allowed', 405);
        $locId = $this->currentLocationId($u);
        $status = $_GET['status'] ?? null;
        $rows = $this->model->list($_GET['q'] ?? '', $locId, $status);
        $this->success($rows);
    }

    public function get($id = null) {
        $u = $this->requirePermission('stock.read');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') $this->error('Method Not Allowed', 405);
        if (!$id) $this->error('Count ID required', 400);
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
        $res = $this->model->create($data, (int)$u['sub'], $locId);
        if (is_array($res) && isset($res['error'])) {
            $this->error($res['error'], 400);
        }
        if ($res) {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'location_id' => $this->currentLocationId($u),
                'action' => 'create',
                'entity' => 'stock_count',
                'entity_id' => (int)$res,
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['line_count' => is_array($data['items'] ?? null) ? count($data['items']) : 0]),
            ]);
            $this->success(['id' => (int)$res], 'Stock count sheet created');
        }
        $this->error('Failed to create stock count', 400);
    }

    public function approve($id = null) {
        $u = $this->requirePermission('stock.adjust');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') $this->error('Method Not Allowed', 405);
        if (!$id) $this->error('Count ID required', 400);
        $res = $this->model->approve($id, (int)$u['sub']);
        if (is_array($res) && isset($res['error'])) {
            $this->error($res['error'], 400);
        }
        if ($res) {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'location_id' => $this->currentLocationId($u),
                'action' => 'approve',
                'entity' => 'stock_count',
                'entity_id' => (int)$id,
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['status' => 'Approved']),
            ]);
            $this->success(null, 'Stock count approved and stock adjusted');
        }
        $this->error('Failed to approve stock count', 400);
    }

    public function reject($id = null) {
        $u = $this->requirePermission('stock.adjust');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') $this->error('Method Not Allowed', 405);
        if (!$id) $this->error('Count ID required', 400);
        $res = $this->model->reject($id, (int)$u['sub']);
        if (is_array($res) && isset($res['error'])) {
            $this->error($res['error'], 400);
        }
        if ($res) {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'location_id' => $this->currentLocationId($u),
                'action' => 'reject',
                'entity' => 'stock_count',
                'entity_id' => (int)$id,
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['status' => 'Rejected']),
            ]);
            $this->success(null, 'Stock count rejected');
        }
        $this->error('Failed to reject stock count', 400);
    }
}
