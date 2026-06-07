<?php
/**
 * GrnController - Goods Receive Notes
 */
class GrnController extends Controller {
    private $grnModel;
    private $auditModel;

    public function __construct() {
        $this->grnModel = $this->model('GoodsReceiveNote');
        $this->auditModel = $this->model('AuditLog');
    }

    // GET /api/grn/list?q=
    public function list() {
        $u = $this->requirePermission('grn.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') $this->error('Method Not Allowed', 405);
        
        $locId = $this->currentLocationId($u);
        $reqLoc = $_SERVER['HTTP_X_LOCATION_ID'] ?? null;
        if ($reqLoc === 'all') {
            $locId = 0;
        } elseif ((int)$reqLoc > 0) {
            $locId = (int)$reqLoc;
        }

        $rows = $this->grnModel->list($_GET['q'] ?? '', $locId);
        $this->success($rows);
    }

    // GET /api/grn/get/1
    public function get($id = null) {
        $u = $this->requirePermission('grn.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') $this->error('Method Not Allowed', 405);
        if (!$id) $this->error('GRN ID required', 400);
        $locId = $this->currentLocationId($u);
        $row = $this->grnModel->getById($id, $locId);
        if (!$row) $this->error('Not found', 404);
        $this->success($row);
    }

    // POST /api/grn/create
    public function create() {
        $u = $this->requirePermission('grn.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $locId = $this->currentLocationId($u);

        // If linked to a PO, GRN must be recorded under the PO's location (read-only in UI).
        $poId = isset($data['purchase_order_id']) ? (int)$data['purchase_order_id'] : null;
        if ($poId) {
            try {
                $db = new Database();
                $db->query("SELECT location_id FROM purchase_orders WHERE id = :id LIMIT 1");
                $db->bind(':id', (int)$poId);
                $row = $db->single();
                $poLocId = (int)($row->location_id ?? 0);
                if ($poLocId > 0) {
                    // Non-admin users must be assigned to this location.
                    if (!$this->isAdmin($u)) {
                        $allowed = $u['allowed_location_ids'] ?? null;
                        $allowedIds = is_array($allowed) ? array_map('intval', $allowed) : [];
                        if (!in_array($poLocId, $allowedIds, true) && (int)($u['location_id'] ?? 0) !== $poLocId) {
                            $this->error('Forbidden', 403);
                        }
                    }
                    $locId = $poLocId;
                }
            } catch (Exception $e) {
                // ignore; model will still validate PO existence/status.
            }
        }
        $grnId = $this->grnModel->create($data, (int)$u['sub'], $locId);
        if ($grnId) {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'location_id' => $this->currentLocationId($u),
                'action' => 'create',
                'entity' => 'grn',
                'entity_id' => (int)$grnId,
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['supplier_id' => $data['supplier_id'] ?? null, 'purchase_order_id' => $data['purchase_order_id'] ?? null]),
            ]);
            $this->success(['id' => (int)$grnId], 'GRN created');
        }
        $this->error('Failed to create GRN', 400);
    }
    // POST /api/grn/cancel/1
    public function cancel($id = null) {
        $u = $this->requirePermission('grn.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);
        if (!$id) $this->error('GRN ID required', 400);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $reason = $data['reason'] ?? 'Cancelled by user';
        $locId = $this->currentLocationId($u);

        if ($this->grnModel->cancel($id, $reason, (int)$u['sub'], $locId)) {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'location_id' => $locId,
                'action' => 'cancel',
                'entity' => 'grn',
                'entity_id' => (int)$id,
                'method' => 'POST',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['reason' => $reason]),
            ]);
            $this->success(null, 'GRN cancelled');
        }
        $this->error('Failed to cancel GRN', 400);
    }
}
