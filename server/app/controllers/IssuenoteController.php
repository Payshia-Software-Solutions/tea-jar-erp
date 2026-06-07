<?php
/**
 * Issue Note Controller
 * Endpoints:
 * - GET  /api/issuenote/list
 * - GET  /api/issuenote/get/{id}
 * - POST /api/issuenote/create
 * - POST /api/issuenote/commit/{id}
 * - POST /api/issuenote/cancel/{id}
 */
class IssuenoteController extends Controller {
    private $model;
    private $audit;

    public function __construct() {
        $this->model = $this->model('IssueNote');
        $this->audit = $this->model('AuditLog');
    }

    private function allowedLocationIds($u) {
        if ($this->isAdmin($u)) {
            $db = new Database();
            $db->query("SELECT id FROM service_locations ORDER BY id ASC");
            $rows = $db->resultSet() ?: [];
            return array_map(function($r) { return (int)$r->id; }, $rows);
        }
        $ids = $u['allowed_location_ids'] ?? null;
        $out = [];
        if (is_array($ids)) {
            foreach ($ids as $id) {
                $id = (int)$id;
                if ($id > 0) $out[] = $id;
            }
        }
        if (count($out) === 0) {
            $out = [isset($u['location_id']) ? (int)$u['location_id'] : 1];
        }
        return array_values(array_unique($out));
    }

    public function list() {
        $u = $this->requirePermission('parts.read'); // Let's use parts/inventory level read permission
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        $locs = $this->allowedLocationIds($u);
        
        $q = isset($_GET['q']) ? $_GET['q'] : '';
        $rows = $this->model->list($q, $locs);
        $this->success($rows);
    }

    public function get($id = null) {
        $u = $this->requirePermission('parts.read');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$id) $this->error('Issue Note ID required', 400);
        $res = $this->model->getById((int)$id);
        if (!$res) $this->error('Issue Note not found', 404);
        $this->success($res);
    }

    public function create() {
        $u = $this->requirePermission('parts.write');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        if (!isset($data['location_id'])) {
            $data['location_id'] = $this->currentLocationId($u);
        }
        
        $userId = isset($u['sub']) ? (int)$u['sub'] : null;
        $id = $this->model->create($data, $userId);
        if (is_array($id) && isset($id['error'])) {
            $this->error($id['error'], 400);
            return;
        }
        if (!$id) {
            $this->error('Failed to create issue note', 400);
            return;
        }

        $this->audit->write([
            'user_id' => $userId,
            'location_id' => null,
            'action' => 'create',
            'entity' => 'issue_notes',
            'entity_id' => (int)$id,
            'method' => $_SERVER['REQUEST_METHOD'] ?? '',
            'path' => $_SERVER['REQUEST_URI'] ?? '',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'details' => json_encode(['issue_note_id' => (int)$id]),
        ]);

        $this->success(['id' => (int)$id], 'Issue Note created');
    }

    public function commit($id = null) {
        $u = $this->requirePermission('parts.write');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$id) $this->error('Issue Note ID required', 400);
        $userId = isset($u['sub']) ? (int)$u['sub'] : null;
        
        $res = $this->model->issue((int)$id, $userId);
        if ($res === true) {
            $this->audit->write([
                'user_id' => $userId,
                'location_id' => null,
                'action' => 'issue',
                'entity' => 'issue_notes',
                'entity_id' => (int)$id,
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['issue_note_id' => (int)$id]),
            ]);
            $this->success(['id' => (int)$id], 'Issue Note completed');
            return;
        }
        if (is_array($res) && isset($res['error'])) {
            $this->error($res['error'], 400);
            return;
        }
        $this->error('Commit failed', 400);
    }

    public function cancel($id = null) {
        $u = $this->requirePermission('parts.write');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$id) $this->error('Issue Note ID required', 400);
        $userId = isset($u['sub']) ? (int)$u['sub'] : null;

        $res = $this->model->cancel((int)$id, $userId);
        if ($res === true) {
            $this->audit->write([
                'user_id' => $userId,
                'location_id' => null,
                'action' => 'cancel',
                'entity' => 'issue_notes',
                'entity_id' => (int)$id,
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['issue_note_id' => (int)$id]),
            ]);
            $this->success(['id' => (int)$id], 'Issue Note cancelled');
            return;
        }
        if (is_array($res) && isset($res['error'])) {
            $this->error($res['error'], 400);
            return;
        }
        $this->error('Cancel failed', 400);
    }
}
