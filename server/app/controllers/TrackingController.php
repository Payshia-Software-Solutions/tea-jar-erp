<?php

class TrackingController extends Controller {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function log() {
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $userId = isset($input['user_id']) ? $input['user_id'] : null;
            $latitude = isset($input['latitude']) ? $input['latitude'] : null;
            $longitude = isset($input['longitude']) ? $input['longitude'] : null;

            if ($userId && $latitude && $longitude) {
                $this->db->query('INSERT INTO device_tracking_logs (user_id, latitude, longitude) VALUES (:user_id, :latitude, :longitude)');
                $this->db->bind(':user_id', $userId);
                $this->db->bind(':latitude', $latitude);
                $this->db->bind(':longitude', $longitude);
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
    public function history() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405);
            echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
            return;
        }
        
        // $u = $this->requireAuth();
        // $userId = $u['sub'] ?? null;
        // if (!$userId) {
        //     http_response_code(401);
        //     echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
        //     return;
        // }
        $userId = 1; // HARDCODED for public test

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
