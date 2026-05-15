<?php
/**
 * Vehicle Controller
 */
class VehicleController extends Controller {
    private $vehicleModel;
    private $auditModel;

    public function __construct() {
        $this->vehicleModel = $this->model('Vehicle');
        $this->auditModel = $this->model('AuditLog');
    }

    // GET /api/vehicle/list
    public function list() {
        $this->requirePermission('vehicles.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $filter = $_GET['filter'] ?? 'all';
        $search = $_GET['search'] ?? '';

        $result = $this->vehicleModel->getPaginated($page, $limit, $filter, $search);
        $this->success($result);
    }

    // POST /api/vehicle/create
    public function create() {
        $u = $this->requirePermission('vehicles.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (!isset($data['make'], $data['model'], $data['year'], $data['vin'])) {
            $this->error('Missing required fields', 400);
            return;
        }
        $created = $this->vehicleModel->create($data, (int)$u['sub']);
        if ($created) {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'action' => 'create',
                'entity' => 'vehicle',
                'entity_id' => null,
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['make' => $data['make'], 'model' => $data['model'], 'vin' => $data['vin']]),
            ]);
            $this->success($data, 'Vehicle created');
        } else {
            $this->error('Failed to create vehicle');
        }
    }

    // GET /api/vehicle/get/{id}
    public function get($id = null) {
        $this->requirePermission('vehicles.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$id) {
            $this->error('Vehicle ID required', 400);
            return;
        }
        $vehicle = $this->vehicleModel->getById($id);
        if ($vehicle) {
            $this->success($vehicle);
        } else {
            $this->error('Vehicle not found', 404);
        }
    }

    // POST /api/vehicle/update/{id}
    public function update($id = null) {
        $u = $this->requirePermission('vehicles.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$id) {
            $this->error('Vehicle ID required', 400);
            return;
        }
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (!isset($data['make'], $data['model'], $data['year'], $data['vin'])) {
            $this->error('Missing required fields', 400);
            return;
        }
        $updated = $this->vehicleModel->update($id, $data, (int)$u['sub']);
        if ($updated) {
            $this->success($data, 'Vehicle updated');
        } else {
            $this->error('Failed to update vehicle');
        }
    }

    // DELETE /api/vehicle/delete/{id}
    public function delete($id = null) {
        $u = $this->requirePermission('vehicles.write');
        // Since browsers may not send DELETE easily, we also accept POST with _method=DELETE
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
            $this->error('Vehicle ID required', 400);
            return;
        }
        $deleted = $this->vehicleModel->delete($id);
        if ($deleted) {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'action' => 'delete',
                'entity' => 'vehicle',
                'entity_id' => (int)$id,
                'method' => $method,
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => null,
            ]);
            $this->success(null, 'Vehicle deleted');
        } else {
            $this->error('Failed to delete vehicle');
        }
    }

    // GET /api/vehicle/listByCustomer/{customerId}
    public function listByCustomer($customerId = null) {
        $this->requirePermission('vehicles.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$customerId) {
            $this->error('Customer ID required', 400);
            return;
        }
        $vehicles = $this->vehicleModel->getByCustomer($customerId);
        $this->success($vehicles);
    }
}
