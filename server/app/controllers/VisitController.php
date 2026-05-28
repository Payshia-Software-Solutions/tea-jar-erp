<?php
/**
 * Visit Controller
 * Handles shop visit logging.
 */

class VisitController extends Controller {

    public function log() {
        $this->requirePermission('orders.write'); // Or a specific visits.write permission
        
        $u = $this->requireAuth();
        $userId = $u['sub'] ?? null;

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true) ?? [];

        $customerId = $data['customer_id'] ?? null;
        $visitType = $data['visit_type'] ?? 'SALE';
        $reason = $data['reason'] ?? null;
        $latitude = $data['latitude'] ?? null;
        $longitude = $data['longitude'] ?? null;

        if (!$customerId) {
            $this->error('Customer ID is required', 400);
            return;
        }

        $db = new Database();
        
        // Ensure table exists (fail-safe for new deployments)
        $db->exec("CREATE TABLE IF NOT EXISTS customer_visits (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            customer_id INT NOT NULL, 
            user_id INT NOT NULL, 
            visit_type VARCHAR(50) NOT NULL, 
            reason VARCHAR(255) NULL, 
            latitude DECIMAL(10,8) NULL, 
            longitude DECIMAL(11,8) NULL, 
            device_id VARCHAR(100) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");

        // Ensure column exists
        try {
            $pdo = $db->getDb();
            $stmt = $pdo->query("SHOW COLUMNS FROM `customer_visits` LIKE 'device_id'");
            if (!$stmt->fetch()) {
                $pdo->exec("ALTER TABLE customer_visits ADD COLUMN device_id VARCHAR(100) NULL");
            }
        } catch (Exception $e) {}

        $deviceId = $data['device_id'] ?? null;

        $db->query("INSERT INTO customer_visits (customer_id, user_id, visit_type, reason, latitude, longitude, device_id) VALUES (:customer_id, :user_id, :visit_type, :reason, :latitude, :longitude, :device_id)");
        $db->bind(':customer_id', $customerId);
        $db->bind(':user_id', $userId);
        $db->bind(':visit_type', $visitType);
        $db->bind(':reason', $reason);
        $db->bind(':latitude', $latitude);
        $db->bind(':longitude', $longitude);
        $db->bind(':device_id', $deviceId);

        if ($db->execute()) {
            $this->success(['id' => $db->lastInsertId()], 'Visit logged successfully');
        } else {
        }
    }

    public function today_visits() {
        $u = $this->requireAuth();
        $userId = $u['sub'] ?? null;
        if (!$userId) {
            $this->error('Unauthorized', 401);
            return;
        }

        $db = new Database();
        
        // Ensure table exists (fail-safe for new deployments)
        $db->exec("CREATE TABLE IF NOT EXISTS customer_visits (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            customer_id INT NOT NULL, 
            user_id INT NOT NULL, 
            visit_type VARCHAR(50) NOT NULL, 
            reason VARCHAR(255) NULL, 
            latitude DECIMAL(10,8) NULL, 
            longitude DECIMAL(11,8) NULL, 
            device_id VARCHAR(100) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");

        $startDate = $_GET['start_date'] ?? date('Y-m-d');
        $endDate = $_GET['end_date'] ?? date('Y-m-d');

        $db->query("SELECT customer_id FROM customer_visits WHERE user_id = :user_id AND created_at >= :start_date AND created_at <= :end_date");
        $db->bind(':user_id', $userId);
        $db->bind(':start_date', $startDate . ' 00:00:00');
        $db->bind(':end_date', $endDate . ' 23:59:59');
        
        $results = $db->resultSet();
        $visitedIds = [];
        if ($results) {
            foreach ($results as $row) {
                $visitedIds[] = (int)$row->customer_id;
            }
        }
        
        // Return unique IDs
        $this->success(array_values(array_unique($visitedIds)));
    }

    public function history($customerId) {
        $this->requirePermission('customers.read');
        
        if (!$customerId) {
            $this->error('Customer ID is required', 400);
            return;
        }

        $db = new Database();
        
        // Ensure table exists (fail-safe for new deployments)
        $db->exec("CREATE TABLE IF NOT EXISTS customer_visits (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            customer_id INT NOT NULL, 
            user_id INT NOT NULL, 
            visit_type VARCHAR(50) NOT NULL, 
            reason VARCHAR(255) NULL, 
            latitude DECIMAL(10,8) NULL, 
            longitude DECIMAL(11,8) NULL, 
            device_id VARCHAR(100) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");

        $db->query("
            SELECT cv.*, u.name as user_name 
            FROM customer_visits cv 
            LEFT JOIN users u ON u.id = cv.user_id 
            WHERE cv.customer_id = :customer_id 
            ORDER BY cv.created_at DESC
        ");
        $db->bind(':customer_id', $customerId);
        
        $results = $db->resultSet();
        $this->success($results);
    }
}
