<?php

class TrackingController extends Controller {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function log() {
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $u = $this->requireAuth();
            $userId = $u['sub'] ?? null;
            $input = json_decode(file_get_contents('php://input'), true);
            $latitude = isset($input['latitude']) ? $input['latitude'] : null;
            $longitude = isset($input['longitude']) ? $input['longitude'] : null;
            // Explicitly force Sri Lanka timezone for the server
            date_default_timezone_set('Asia/Colombo');
            $createdAt = date('Y-m-d H:i:s');

            if ($userId && $latitude && $longitude) {
                // Force format to YYYY-MM-DD HH:MM:SS
                $createdAt = str_replace('T', ' ', substr($createdAt, 0, 19));
                
                $this->db->query('INSERT INTO device_tracking_logs (user_id, latitude, longitude, created_at) VALUES (:user_id, :latitude, :longitude, :created_at)');
                $this->db->bind(':user_id', $userId);
                $this->db->bind(':latitude', $latitude);
                $this->db->bind(':longitude', $longitude);
                $this->db->bind(':created_at', $createdAt);
                if ($this->db->execute()) {
                    echo json_encode(['status' => 'success', 'message' => 'Tracking log saved']);
                    return;
                }
            }
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid data']);
        } else {
            http_response_code(405);
            echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        }
    }

    public function sync() {
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $u = $this->requireAuth();
            $userId = $u['sub'] ?? null;
            if (!$userId) {
                http_response_code(401);
                echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $logs = isset($input['logs']) ? $input['logs'] : [];

            if (!empty($logs)) {
                $successCount = 0;
                foreach ($logs as $log) {
                    $lat = $log['latitude'] ?? null;
                    $lng = $log['longitude'] ?? null;
                    $createdAt = $log['created_at'] ?? null;
                    
                    if ($lat && $lng && $createdAt) {
                        $this->db->query('INSERT INTO device_tracking_logs (user_id, latitude, longitude, created_at) VALUES (:user_id, :latitude, :longitude, :created_at)');
                        $this->db->bind(':user_id', $userId);
                        $this->db->bind(':latitude', $lat);
                        $this->db->bind(':longitude', $lng);
                        // Convert ISO8601 to MySQL datetime if necessary, usually MySQL handles 'YYYY-MM-DDTHH:MM:SS...' fine, 
                        // but let's replace T with space just in case.
                        $createdAt = str_replace('T', ' ', substr($createdAt, 0, 19));
                        $this->db->bind(':created_at', $createdAt);
                        if ($this->db->execute()) {
                            $successCount++;
                        }
                    }
                }
                echo json_encode(['status' => 'success', 'message' => "Synced $successCount logs"]);
                return;
            }
            
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'No valid logs provided']);
        } else {
            http_response_code(405);
            echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        }
    }
    public function history() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405);
            echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
            return;
        }
        
        $u = $this->requireAuth();
        $userId = $u['sub'] ?? null;
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
            return;
        }

        $startDate = $_GET['start_date'] ?? date('Y-m-d');
        $endDate = $_GET['end_date'] ?? date('Y-m-d');

        // Include entire end date by appending time
        $this->db->query("
            SELECT latitude, longitude, created_at 
            FROM device_tracking_logs 
            WHERE user_id = :user_id 
              AND created_at >= :start_date 
              AND created_at <= :end_date
            ORDER BY created_at ASC
        ");
        $this->db->bind(':user_id', $userId);
        $this->db->bind(':start_date', $startDate . ' 00:00:00');
        $this->db->bind(':end_date', $endDate . ' 23:59:59');
        
        $logs = $this->db->resultSet();
        echo json_encode(['status' => 'success', 'data' => $logs]);
    }
}
