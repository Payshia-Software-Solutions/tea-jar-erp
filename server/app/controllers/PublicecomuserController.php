<?php
/**
 * Public E-commerce User Controller
 * Manages customer registration, login, and profile for the storefront.
 */
class PublicecomuserController extends Controller {
    private $db;
    private $apiClientModel;

    public function __construct() {
        $this->db = new Database();
        $this->apiClientModel = $this->model('ApiClient');
    }

    private function handlePublicCors() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        header('Access-Control-Allow-Headers: X-API-Key, Content-Type, Authorization');
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
     * POST /api/publicecomuser/register
     */
    public function register() {
        $this->validatePublicApiKey();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (empty($data['email']) || empty($data['password']) || empty($data['name'])) {
            $this->error('Missing required fields', 400);
        }

        // Check if email exists
        $this->db->query("SELECT id FROM customers WHERE email = :email LIMIT 1");
        $this->db->bind(':email', $data['email']);
        if ($this->db->single()) {
            $this->error('Email already registered', 409);
        }

        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

        $this->db->query("
            INSERT INTO customers (name, email, phone, address, city, postal_code, password, is_ecommerce_user, is_active)
            VALUES (:name, :email, :phone, :address, :city, :postal_code, :password, 1, 1)
        ");
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':email', $data['email']);
        $this->db->bind(':phone', $data['phone'] ?? null);
        $this->db->bind(':address', $data['address'] ?? null);
        $this->db->bind(':city', $data['city'] ?? null);
        $this->db->bind(':postal_code', $data['postal_code'] ?? null);
        $this->db->bind(':password', $hashedPassword);

        if ($this->db->execute()) {
            $userId = $this->db->lastInsertId();
            $this->success(['id' => $userId, 'message' => 'Registration successful']);
        } else {
            $this->error('Registration failed', 500);
        }
    }

    /**
     * POST /api/publicecomuser/login
     */
    public function login() {
        $this->validatePublicApiKey();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (empty($data['email']) || empty($data['password'])) {
            $this->error('Email and password required', 400);
        }

        $this->db->query("SELECT * FROM customers WHERE email = :email AND is_ecommerce_user = 1 LIMIT 1");
        $this->db->bind(':email', $data['email']);
        $user = $this->db->single();

        if ($user && password_verify($data['password'], $user->password)) {
            // In a real app, generate a JWT here. For now, return basic info.
            unset($user->password);
            $this->db->query("UPDATE customers SET last_login = NOW() WHERE id = :id");
            $this->db->bind(':id', $user->id);
            $this->db->execute();

            $this->success([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'city' => $user->city,
                    'postal_code' => $user->postal_code
                ],
                'token' => base64_encode($user->id . ':' . time()) // Dummy token for identification
            ]);
        } else {
            $this->error('Invalid credentials', 401);
        }
    }

    /**
     * POST /api/publicecomuser/update
     */
    public function update() {
        $this->validatePublicApiKey();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);

        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        
        if (empty($authHeader) && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }

        if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
            $this->error('Missing or invalid authorization token', 401);
        }

        $token = substr($authHeader, 7);
        $decoded = base64_decode($token);
        if (!$decoded) $this->error('Invalid token', 401);
        
        $parts = explode(':', $decoded);
        $userId = $parts[0] ?? null;

        if (!$userId) $this->error('Invalid token payload', 401);

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (empty($data['name'])) {
            $this->error('Name is required', 400);
        }

        $this->db->query("
            UPDATE customers 
            SET name = :name, phone = :phone, address = :address, city = :city, postal_code = :postal_code
            WHERE id = :id AND is_ecommerce_user = 1
        ");
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':phone', $data['phone'] ?? null);
        $this->db->bind(':address', $data['address'] ?? null);
        $this->db->bind(':city', $data['city'] ?? null);
        $this->db->bind(':postal_code', $data['postal_code'] ?? null);
        $this->db->bind(':id', $userId);

        if ($this->db->execute()) {
            $this->db->query("SELECT id, name, email, phone, address, city, postal_code FROM customers WHERE id = :id LIMIT 1");
            $this->db->bind(':id', $userId);
            $user = $this->db->single();
            $this->success(['user' => $user, 'message' => 'Profile updated successfully']);
        } else {
            $this->error('Update failed', 500);
        }
    }
}
