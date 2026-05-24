<?php
/**
 * Route Controller
 */

class RouteController extends Controller {
    private $routeModel;

    public function __construct() {
        $this->routeModel = $this->model('Route');
    }

    public function index() {
        $this->requireAuth();
        $locationId = $_GET['location_id'] ?? null;
        
        if ($locationId) {
            $routes = $this->routeModel->getAllByLocation($locationId);
        } else {
            $routes = $this->routeModel->getAll();
        }
        $this->success($routes);
    }

    public function get($id) {
        $this->requireAuth();
        $route = $this->routeModel->getById($id);
        if ($route) {
            $this->success($route);
        } else {
            $this->error('Route not found', 404);
        }
    }

    public function create() {
        $this->requireAuth();
        
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (empty($data['name']) || empty($data['location_id'])) {
            $this->error('Name and Location ID are required', 400);
            return;
        }

        if ($this->routeModel->create($data)) {
            $this->success(null, 'Route created successfully');
        } else {
            $this->error('Failed to create route');
        }
    }

    public function update($id) {
        $this->requireAuth();
        
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (empty($data['name'])) {
            $this->error('Name is required', 400);
            return;
        }

        if ($this->routeModel->update($id, $data)) {
            $this->success(null, 'Route updated successfully');
        } else {
            $this->error('Failed to update route');
        }
    }

    public function delete($id) {
        $this->requireAuth();
        
        if ($this->routeModel->delete($id)) {
            $this->success(null, 'Route deleted successfully');
        } else {
            $this->error('Failed to delete route');
        }
    }
}
