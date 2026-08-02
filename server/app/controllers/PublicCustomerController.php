<?php
/**
 * PublicCustomerController
 * APIs for Customer Portal (Website Integration)
 */
class PublicCustomerController extends Controller {
    private $customerModel;
    private $orderModel;
    private $apiClientModel;
    private $db;

    public function __construct() {
        $this->customerModel = $this->model('Customer');
        $this->orderModel = $this->model('OnlineOrder');
        $this->apiClientModel = $this->model('ApiClient');
        $this->db = new Database();
    }

    private function handlePublicCors() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: X-API-Key, Content-Type');
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            if (!empty($apiKey) && !empty($origin) && $this->apiClientModel->validate($apiKey, $origin)) {
                header('Access-Control-Allow-Origin: ' . $origin);
            } else {
                header('Access-Control-Allow-Origin: *');
            }
            http_response_code(204);
            exit;
        }
        if (!empty($origin) && !empty($apiKey) && $this->apiClientModel->validate($apiKey, $origin)) {
            header('Access-Control-Allow-Origin: ' . $origin);
        } else {
            header('Access-Control-Allow-Origin: *');
        }
    }

    private function validatePublicApiKey() {
        $this->handlePublicCors();
        $headerKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if (empty($headerKey) || !$this->apiClientModel->validate($headerKey, $origin)) {
            $this->error('Unauthorized', 403);
        }
    }

    /**
     * POST /api/publiccustomer/register
     */
    public function register() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['email']) || empty($data['password']) || empty($data['name'])) {
            $this->error('Missing required fields (email, password, name)', 400);
            return;
        }

        // Check if email exists
        $this->db->query("SELECT id FROM customers WHERE email = :email");
        $this->db->bind(':email', $data['email']);
        if ($this->db->single()) {
            $this->error('Email already registered', 400);
            return;
        }

        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);

        $this->db->query("
            INSERT INTO customers (name, email, phone, password, is_portal_active, district_id, city_id) 
            VALUES (:name, :email, :phone, :password, 1, :did, :cid)
        ");
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':email', $data['email']);
        $this->db->bind(':phone', $data['phone'] ?? null);
        $this->db->bind(':password', $passwordHash);
        $this->db->bind(':did', $data['district_id'] ?? null);
        $this->db->bind(':cid', $data['city_id'] ?? null);

        if ($this->db->execute()) {
            $this->success(['id' => $this->db->lastInsertId()], 'Registration successful');
        } else {
            $this->error('Registration failed');
        }
    }

    /**
     * POST /api/publiccustomer/login
     */
    public function login() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['email']) || empty($data['password'])) {
            $this->error('Missing email or password', 400);
            return;
        }

        $this->db->query("SELECT * FROM customers WHERE email = :email AND is_portal_active = 1");
        $this->db->bind(':email', $data['email']);
        $customer = $this->db->single();

        if ($customer && password_verify($data['password'], $customer->password)) {
            // Update last login
            $this->db->query("UPDATE customers SET last_login_at = CURRENT_TIMESTAMP WHERE id = :id");
            $this->db->bind(':id', $customer->id);
            $this->db->execute();

            // Simple token (In a real app, use JWT)
            $token = base64_encode(json_encode(['id' => $customer->id, 'email' => $customer->email, 'time' => time()]));

            $this->success([
                'token' => $token,
                'customer' => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'phone' => $customer->phone
                ]
            ], 'Login successful');
        } else {
            $this->error('Invalid credentials or account disabled', 401);
        }
    }

    /**
     * GET /api/publiccustomer/orders
     * Requires Authorization header with token
     */
    public function orders() {
        $customerId = $this->auth();
        if (!$customerId) return;

        $this->db->query("
            SELECT * FROM online_orders 
            WHERE customer_id = :cid 
            ORDER BY created_at DESC
        ");
        $this->db->bind(':cid', $customerId);
        $orders = $this->db->resultSet();

        $this->success($orders);
    }

    /**
     * GET /api/publiccustomer/profile
     */
    public function profile() {
        $customerId = $this->auth();
        if (!$customerId) return;

        $customer = $this->customerModel->getById($customerId);
        unset($customer->password); // Security

        $this->success($customer);
    }

    /**
     * Helper to authenticate token
     */
    private function auth() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
            $decoded = json_decode(base64_decode($token), true);
            
            if ($decoded && isset($decoded['id'])) {
                return $decoded['id'];
            }
        }

        $this->error('Unauthorized', 401);
        return false;
    }

    /**
     * POST /api/publiccustomer/storefront-register
     */
    public function storefront_register() {
        $this->handlePublicCors();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        $this->validatePublicApiKey();

        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['phone']) || empty($data['name'])) {
            $this->error('Phone and Name are required', 400);
            return;
        }

        $phone = trim($data['phone']);
        $name = trim($data['name']);
        $email = trim($data['email'] ?? '');
        $address = trim($data['address'] ?? '');

        // Check if customer with same phone already exists
        $this->db->query("SELECT id FROM customers WHERE phone = :phone LIMIT 1");
        $this->db->bind(':phone', $phone);
        $existing = $this->db->single();

        if ($existing) {
            // Update email/address if provided and empty in DB
            $this->db->query("
                UPDATE customers 
                SET email = COALESCE(NULLIF(email, ''), :email),
                    address = COALESCE(NULLIF(address, ''), :address),
                    name = :name
                WHERE id = :id
            ");
            $this->db->bind(':email', $email);
            $this->db->bind(':address', $address);
            $this->db->bind(':name', $name);
            $this->db->bind(':id', $existing->id);
            $this->db->execute();

            $this->success(['id' => (int)$existing->id], 'Customer already exists, details updated');
            return;
        }

        // Create new customer record
        $this->db->query("
            INSERT INTO customers (name, email, phone, address, is_active, order_type) 
            VALUES (:name, :email, :phone, :address, 1, 'External')
        ");
        $this->db->bind(':name', $name);
        $this->db->bind(':email', $email);
        $this->db->bind(':phone', $phone);
        $this->db->bind(':address', $address);

        if ($this->db->execute()) {
            $this->success(['id' => (int)$this->db->lastInsertId()], 'Customer registered successfully');
        } else {
            $this->error('Customer registration failed');
        }
    }
}
