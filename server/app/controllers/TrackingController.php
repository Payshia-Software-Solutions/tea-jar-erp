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
}
