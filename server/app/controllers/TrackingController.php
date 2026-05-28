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
            $appTime = isset($input['app_time']) ? $input['app_time'] : null;
            
            // Explicitly force Sri Lanka timezone for the server's receive time
            date_default_timezone_set('Asia/Colombo');
            $createdAt = date('Y-m-d H:i:s');

            if ($userId && $latitude && $longitude) {
                // If app_time is provided, ensure format is correct, else fallback to created_at
                if ($appTime) {
                    $appTime = str_replace('T', ' ', substr($appTime, 0, 19));
                } else {
                    $appTime = $createdAt;
                }
                
                $this->db->query('INSERT INTO device_tracking_logs (user_id, latitude, longitude, created_at, app_time) VALUES (:user_id, :latitude, :longitude, :created_at, :app_time)');
                $this->db->bind(':user_id', $userId);
                $this->db->bind(':latitude', $latitude);
                $this->db->bind(':longitude', $longitude);
                $this->db->bind(':created_at', $createdAt);
                $this->db->bind(':app_time', $appTime);
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

            date_default_timezone_set('Asia/Colombo');
            $createdAt = date('Y-m-d H:i:s'); // the time the sync batch arrived

            $input = json_decode(file_get_contents('php://input'), true);
            $logs = isset($input['logs']) ? $input['logs'] : [];

            if (!empty($logs)) {
                $successCount = 0;
                
                // Filter and compile valid logs first
                $validLogs = [];
                foreach ($logs as $log) {
                    $lat = $log['latitude'] ?? null;
                    $lng = $log['longitude'] ?? null;
                    
                    // Offline logs from the app's SQLite DB currently send 'created_at', 
                    // but we will treat it as the 'app_time' (the time it was recorded offline).
                    // We also support 'app_time' natively if the app sends it directly.
                    $appTime = $log['app_time'] ?? $log['created_at'] ?? $createdAt;
                    
                    if ($lat && $lng) {
                        $appTime = str_replace('T', ' ', substr($appTime, 0, 19));
                        $validLogs[] = [
                            'user_id' => $userId,
                            'latitude' => $lat,
                            'longitude' => $lng,
                            'created_at' => $createdAt,
                            'app_time' => $appTime
                        ];
                    }
                }
                
                if (!empty($validLogs)) {
                    // Build a single bulk INSERT query:
                    // INSERT INTO device_tracking_logs (user_id, latitude, longitude, created_at, app_time) VALUES (?,?,?,?,?), (?,?,?,?,?), ...
                    $sql = 'INSERT INTO device_tracking_logs (user_id, latitude, longitude, created_at, app_time) VALUES ';
                    $rowPlaceholders = [];
                    $params = [];
                    
                    foreach ($validLogs as $logData) {
                        $rowPlaceholders[] = '(?, ?, ?, ?, ?)';
                        $params[] = $logData['user_id'];
                        $params[] = $logData['latitude'];
                        $params[] = $logData['longitude'];
                        $params[] = $logData['created_at'];
                        $params[] = $logData['app_time'];
                    }
                    
                    $sql .= implode(', ', $rowPlaceholders);
                    
                    $this->db->beginTransaction();
                    try {
                        $pdo = $this->db->getDb();
                        $stmt = $pdo->prepare($sql);
                        if ($stmt->execute($params)) {
                            $successCount = count($validLogs);
                        }
                        $this->db->commit();
                    } catch (Exception $e) {
                        $this->db->rollBack();
                        http_response_code(500);
                        echo json_encode(['status' => 'error', 'message' => 'Sync failed: ' . $e->getMessage()]);
                        return;
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
            SELECT latitude, longitude, created_at, COALESCE(app_time, created_at) AS app_time
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
