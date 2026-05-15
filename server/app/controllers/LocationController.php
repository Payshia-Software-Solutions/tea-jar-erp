<?php
/**
 * Location Controller
 *
 * Endpoints:
 * - GET    /api/location/list
 * - GET    /api/location/get/{id}
 * - POST   /api/location/create
 * - POST   /api/location/update/{id}
 * - DELETE /api/location/delete/{id}
 */
class LocationController extends Controller {
    private $locationModel;
    private $auditModel;

    public function __construct() {
        $this->locationModel = $this->model('ServiceLocation');
        $this->auditModel = $this->model('AuditLog');
    }

    public function list() {
        $this->requirePermission('locations.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        $rows = $this->locationModel->getAll();
        $this->success($rows);
    }

    public function get($id = null) {
        $this->requirePermission('locations.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$id) {
            $this->error('Location ID required', 400);
            return;
        }
        $row = $this->locationModel->getById((int)$id);
        if (!$row) {
            $this->error('Location not found', 404);
            return;
        }
        $this->success($row);
    }

    public function create() {
        $u = $this->requirePermission('locations.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $name = trim((string)($data['name'] ?? ''));
        $type = trim((string)($data['location_type'] ?? 'service'));
        if (!in_array($type, ['service','warehouse','fleet','sales','factory','hq'], true)) $type = 'service';
        if ($name === '') {
            $this->error('Name is required', 400);
            return;
        }
        $data['location_type'] = $type;
        
        // Handle tax_ids conversion
        if (isset($data['tax_ids']) && is_array($data['tax_ids'])) {
            $data['allowed_taxes_json'] = json_encode($data['tax_ids']);
        }

        $ok = $this->locationModel->create($data, (int)$u['sub']);
        if (!$ok) {
            $this->error('Failed to create location');
            return;
        }
        $this->auditModel->write([
            'user_id' => (int)$u['sub'],
            'location_id' => null,
            'action' => 'create',
            'entity' => 'service_location',
            'entity_id' => null,
            'method' => $_SERVER['REQUEST_METHOD'] ?? '',
            'path' => $_SERVER['REQUEST_URI'] ?? '',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'details' => json_encode(['name' => $name]),
        ]);
        $this->success(null, 'Location created');
    }

    public function update($id = null) {
        $u = $this->requirePermission('locations.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$id) {
            $this->error('Location ID required', 400);
            return;
        }
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $name = trim((string)($data['name'] ?? ''));
        $type = trim((string)($data['location_type'] ?? 'service'));
        if (!in_array($type, ['service','warehouse','fleet','sales','factory','hq'], true)) $type = 'service';
        if ($name === '') {
            $this->error('Name is required', 400);
            return;
        }
        $data['location_type'] = $type;

        // Handle tax_ids conversion
        if (isset($data['tax_ids']) && is_array($data['tax_ids'])) {
            $data['allowed_taxes_json'] = json_encode($data['tax_ids']);
        }

        $ok = $this->locationModel->update((int)$id, $data, (int)$u['sub']);
        if (!$ok) {
            $this->error('Failed to update location');
            return;
        }
        $this->success(null, 'Location updated');
    }

    public function delete($id = null) {
        $u = $this->requirePermission('locations.write');
        $method = $_SERVER['REQUEST_METHOD'];
        if ($method === 'POST') {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);
            if (isset($data['_method']) && $data['_method'] === 'DELETE') {
                $method = 'DELETE';
            }
        }
        if ($method !== 'DELETE') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$id) {
            $this->error('Location ID required', 400);
            return;
        }
        // Prevent deleting the default location 1 (keeps system stable).
        if ((int)$id === 1) {
            $this->error('Cannot delete default location', 400);
            return;
        }
        $ok = $this->locationModel->delete((int)$id);
        if (!$ok) {
            $this->error('Failed to delete location');
            return;
        }
        $this->auditModel->write([
            'user_id' => (int)$u['sub'],
            'location_id' => null,
            'action' => 'delete',
            'entity' => 'service_location',
            'entity_id' => (int)$id,
            'method' => $method,
            'path' => $_SERVER['REQUEST_URI'] ?? '',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'details' => null,
        ]);
        $this->success(null, 'Location deleted');
    }
}
