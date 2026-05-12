<?php
/**
 * Public Geo Controller
 * Provides public API access to countries, provinces, districts, and cities.
 */
class PublicgeoController extends Controller {
    private $db;
    private $apiClientModel;

    public function __construct() {
        $this->db = new Database();
        $this->apiClientModel = $this->model('ApiClient');
    }

    private function handlePublicCors() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        header('Access-Control-Allow-Methods: GET, OPTIONS');
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

    public function countries() {
        $this->validatePublicApiKey();
        $this->db->query("SELECT * FROM countries ORDER BY name ASC");
        $this->success($this->db->resultSet());
    }

    public function provinces() {
        $this->validatePublicApiKey();
        $countryId = isset($_GET['country_id']) ? (int)$_GET['country_id'] : null;
        if ($countryId) {
            $this->db->query("SELECT * FROM provinces WHERE country_id = :cid ORDER BY name ASC");
            $this->db->bind(':cid', $countryId);
        } else {
            $this->db->query("SELECT * FROM provinces ORDER BY name ASC");
        }
        $this->success($this->db->resultSet());
    }

    public function districts() {
        $this->validatePublicApiKey();
        $provinceId = isset($_GET['province_id']) ? (int)$_GET['province_id'] : null;
        if ($provinceId) {
            $this->db->query("SELECT * FROM districts WHERE province_id = :pid ORDER BY name ASC");
            $this->db->bind(':pid', $provinceId);
        } else {
            $this->db->query("SELECT * FROM districts ORDER BY name ASC");
        }
        $this->success($this->db->resultSet());
    }

    public function cities() {
        $this->validatePublicApiKey();
        $districtId = isset($_GET['district_id']) ? (int)$_GET['district_id'] : null;
        if ($districtId) {
            $this->db->query("SELECT c.*, d.name as district_name FROM cities c LEFT JOIN districts d ON c.district_id = d.id WHERE c.district_id = :did ORDER BY c.name ASC");
            $this->db->bind(':did', $districtId);
        } else {
            $this->db->query("SELECT c.*, d.name as district_name FROM cities c LEFT JOIN districts d ON c.district_id = d.id ORDER BY c.name ASC");
        }
        $this->success($this->db->resultSet());
    }
}
