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

    private function processCustomerInput() {
        $contentType = $_SERVER["CONTENT_TYPE"] ?? '';
        if (strpos($contentType, 'multipart/form-data') !== false) {
            $data = $_POST;
            // Handle file upload
            if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = __DIR__ . '/../../public/uploads/customers/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                $fileName = time() . '_' . basename($_FILES['photo']['name']);
                $targetFilePath = $uploadDir . $fileName;
                if (move_uploaded_file($_FILES['photo']['tmp_name'], $targetFilePath)) {
                    $data['photo_url'] = '/uploads/customers/' . $fileName;
                }
            }
        } else {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true) ?? [];
        }
        return $data;
    }

    public function create() {
        $this->requirePermission('customers.write');
        
        $data = $this->processCustomerInput();

        if (empty($data['name'])) {
            $this->error('Customer name is required', 400);
            return;
        }

        $u = $this->requireAuth();
        $userId = $u['sub'] ?? null;

        // Auto-generate QR Hash if not provided
        if (empty($data['qr_code_hash'])) {
            $data['qr_code_hash'] = 'CUSTOMER:' . strtoupper(uniqid());
        }

        $newId = $this->customerModel->create($data, $userId);
        if ($newId) {
            // Update qr hash with real ID if we want
            $data['qr_code_hash'] = 'CUSTOMER:' . $newId;
            $this->customerModel->update($newId, $data, $userId);
            
            $this->success(['id' => $newId, 'qr_code_hash' => $data['qr_code_hash']], 'Customer created successfully');
        } else {
            $this->error('Failed to create customer');
        }
    }

    public function update($id) {
        $this->requirePermission('customers.write');
        
        $data = $this->processCustomerInput();

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
