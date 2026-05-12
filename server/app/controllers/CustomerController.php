<?php
/**
 * Customer Controller
 */

class CustomerController extends Controller {
    private $customerModel;

    public function __construct() {
        $this->customerModel = $this->model('Customer');
    }

    public function index() {
        $this->list();
    }

    public function list() {
        $this->requirePermission('customers.read');
        $customers = $this->customerModel->getAll();
        $this->success($customers);
    }

    public function ecommerce() {
        $this->requirePermission('customers.read');
        $customers = $this->customerModel->getEcommerceCustomers();
        $this->success($customers);
    }

    public function get($id) {
        $this->requirePermission('customers.read');
        $customer = $this->customerModel->getById($id);
        if ($customer) {
            $this->success($customer);
        } else {
            $this->error('Customer not found', 404);
        }
    }

    public function create() {
        $this->requirePermission('customers.write');
        
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (empty($data['name'])) {
            $this->error('Customer name is required', 400);
            return;
        }

        $u = $this->requireAuth();
        $userId = $u['sub'] ?? null;

        if ($this->customerModel->create($data, $userId)) {
            $this->success(null, 'Customer created successfully');
        } else {
            $this->error('Failed to create customer');
        }
    }

    public function update($id) {
        $this->requirePermission('customers.write');
        
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (empty($data['name'])) {
            $this->error('Customer name is required', 400);
            return;
        }

        $u = $this->requireAuth();
        $userId = $u['sub'] ?? null;

        if ($this->customerModel->update($id, $data, $userId)) {
            $this->success(null, 'Customer updated successfully');
        } else {
            $this->error('Failed to update customer');
        }
    }

    public function delete($id) {
        $this->requirePermission('customers.write');
        
        if ($this->customerModel->delete($id)) {
            $this->success(null, 'Customer deleted successfully');
        } else {
            $this->error('Failed to delete customer');
        }
    }

    public function vehicles($id) {
        $this->requirePermission('vehicles.read');
        $vehicleModel = $this->model('Vehicle');
        $vehicles = $vehicleModel->getByCustomer($id);
        $this->success($vehicles);
    }
    public function summary($id) {
        $this->requirePermission('customers.read');
        $summary = $this->customerModel->getSummary($id);
        if ($summary) {
            $this->success($summary);
        } else {
            $this->error('Customer not found', 404);
        }
    }
}
