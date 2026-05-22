<?php
/**
 * Order Model
 */

class Order extends Model {
    private $table = 'repair_orders';

    private function ensureRepairOrderColumns() {
        // Auto-migrate older installs so order create never fails with "Unknown column ...".
        // This mirrors InstallController::ensureSchema() for repair_orders.
        $cols = [
            'location_id' => "INT NULL",
            'from_location_id' => "INT NULL",
            'vehicle_id' => "INT NULL",
            'vehicle_identifier' => "VARCHAR(100) NULL",
            'mileage' => "INT NULL",
            'priority' => "VARCHAR(20) NULL",
            'expected_time' => "DATETIME NULL",
            'release_time' => "DATETIME NULL",
            'comments' => "TEXT NULL",
            'categories_json' => "TEXT NULL",
            'checklist_json' => "TEXT NULL",
            'checklist_done_json' => "TEXT NULL",
            'completion_comments' => "TEXT NULL",
            'completed_at' => "DATETIME NULL",
            'attachments_json' => "TEXT NULL",
            'location' => "VARCHAR(50) NULL",
            'technician' => "VARCHAR(255) NULL",
            'created_by' => "INT NULL",
            'updated_by' => "INT NULL",
            'job_type' => "ENUM('Repair', 'Service Booking') NOT NULL DEFAULT 'Repair'",
            'booking_date' => "DATETIME NULL",
        ];

        foreach ($cols as $col => $def) {
            try {
                $this->db->query("SHOW COLUMNS FROM {$this->table} LIKE '{$col}'");
                $exists = (bool)$this->db->single();
                if (!$exists) {
                    $this->db->exec("ALTER TABLE {$this->table} ADD COLUMN {$col} {$def}");
                }
            } catch (Exception $e) {
                // Ignore: we'll surface a normal create failure later if DB is unreachable.
            }
        }
    }

    // Get all orders
    public function getOrders() {
        $this->db->query("
            SELECT ro.*, 
                   v.vin as vehicle_vin, v.make as vehicle_make, v.model as vehicle_model_v, v.year as vehicle_year,
                   c.name as customer_real_name, c.phone as customer_real_phone,
                   d.name as department_name
            FROM " . $this->table . " ro
            LEFT JOIN vehicles v ON ro.vehicle_id = v.id
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN departments d ON v.department_id = d.id
            ORDER BY ro.created_at DESC
        ");
        return $this->db->resultSet();
    }

    public function getOrdersByLocation($locationId) {
        $this->ensureRepairOrderColumns();
        // Ensure the vehicles table has the expected schema for the JOIN below.
        try {
            require_once __DIR__ . '/Vehicle.php';
            $vModel = new Vehicle();
            $vModel->ensureSchema();
        } catch (Exception $e) {}

        $this->db->query("
            SELECT ro.*, 
                   v.vin as vehicle_vin, v.make as vehicle_make, v.model as vehicle_model_v, v.year as vehicle_year,
                   c.name as customer_real_name, c.phone as customer_real_phone,
                   d.name as department_name
            FROM " . $this->table . " ro
            LEFT JOIN vehicles v ON ro.vehicle_id = v.id
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN departments d ON v.department_id = d.id
            WHERE (ro.location_id = :location_id OR ro.from_location_id = :location_id)
            ORDER BY ro.created_at DESC
        ");
        $this->db->bind(':location_id', (int)$locationId);
        return $this->db->resultSet();
    }

    // Get order by ID
    public function getOrderById($id) {
        $this->db->query("
            SELECT ro.*, 
                   v.vin as vehicle_vin, v.make as vehicle_make, v.model as vehicle_model_v, v.year as vehicle_year, v.service_interval_mileage as vehicle_service_interval,
                   c.name as customer_real_name, c.phone as customer_real_phone,
                   d.name as department_name,
                   l.name as location_name, l.address as location_address, l.phone as location_phone, l.tax_no as location_tax_no,
                   fl.name as from_location_name
            FROM " . $this->table . " ro
            LEFT JOIN vehicles v ON ro.vehicle_id = v.id
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN departments d ON v.department_id = d.id
            LEFT JOIN service_locations l ON ro.location_id = l.id
            LEFT JOIN service_locations fl ON ro.from_location_id = fl.id
            WHERE ro.id = :id
        ");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function getOrderByIdInLocation($id, $locationId) {
        $this->ensureRepairOrderColumns();
        $this->db->query("
            SELECT ro.*, 
                   v.vin as vehicle_vin, v.make as vehicle_make, v.model as vehicle_model_v, v.year as vehicle_year, v.service_interval_mileage as vehicle_service_interval,
                   c.name as customer_real_name, c.phone as customer_real_phone,
                   d.name as department_name,
                   l.name as location_name, l.address as location_address, l.phone as location_phone, l.tax_no as location_tax_no,
                   fl.name as from_location_name
            FROM " . $this->table . " ro
            LEFT JOIN vehicles v ON ro.vehicle_id = v.id
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN departments d ON v.department_id = d.id
            LEFT JOIN service_locations l ON ro.location_id = l.id
            LEFT JOIN service_locations fl ON ro.from_location_id = fl.id
            WHERE ro.id = :id AND (ro.location_id = :location_id OR ro.from_location_id = :location_id)
            LIMIT 1
        ");
        $this->db->bind(':id', (int)$id);
        $this->db->bind(':location_id', (int)$locationId);
        return $this->db->single();
    }

    // Add Order
    public function addOrder($data, $userId = null, $locationId = 1) {
        $this->ensureRepairOrderColumns();
        $this->db->query("
            INSERT INTO {$this->table}
            (location_id, from_location_id, customer_name, vehicle_model, problem_description, status, vehicle_id, vehicle_identifier, mileage, priority, expected_time, release_time, comments, categories_json, checklist_json, attachments_json, location, technician, created_by, updated_by, job_type, booking_date)
            VALUES
            (:location_id, :from_location_id, :customer_name, :vehicle_model, :problem_description, :status, :vehicle_id, :vehicle_identifier, :mileage, :priority, :expected_time, :release_time, :comments, :categories_json, :checklist_json, :attachments_json, :location, :technician, :created_by, :updated_by, :job_type, :booking_date)
        ");
        
        // Bind values
        $this->db->bind(':location_id', (int)$locationId);
        $this->db->bind(':from_location_id', isset($data['from_location_id']) ? (int)$data['from_location_id'] : null);
        $this->db->bind(':customer_name', $data['customer_name']);
        $this->db->bind(':vehicle_model', $data['vehicle_model']);
        $this->db->bind(':problem_description', $data['problem_description']);
        $this->db->bind(':status', $data['status'] ?? 'Pending');
        $this->db->bind(':vehicle_id', $data['vehicle_id'] ?? null);
        $this->db->bind(':vehicle_identifier', $data['vehicle_identifier'] ?? null);
        $this->db->bind(':mileage', $data['mileage'] ?? null);
        $this->db->bind(':priority', $data['priority'] ?? null);
        $this->db->bind(':expected_time', $data['expected_time'] ?? null);
        $this->db->bind(':release_time', $data['release_time'] ?? null);
        $this->db->bind(':comments', $data['comments'] ?? null);
        $this->db->bind(':categories_json', $data['categories_json'] ?? null);
        $this->db->bind(':checklist_json', $data['checklist_json'] ?? null);
        $this->db->bind(':attachments_json', $data['attachments_json'] ?? null);
        $this->db->bind(':location', $data['location'] ?? null);
        $this->db->bind(':technician', $data['technician'] ?? null);
        $this->db->bind(':job_type', $data['job_type'] ?? 'Repair');
        $this->db->bind(':booking_date', $data['booking_date'] ?? null);
        $this->db->bind(':created_by', $userId);
        $this->db->bind(':updated_by', $userId);

        try {
            $ok = $this->db->execute();
            if (!$ok) return false;
            return (int)$this->db->lastInsertId();
        } catch (PDOException $e) {
            // One more attempt after migrating (covers cases where the first ensure failed due to race/permissions).
            if (stripos($e->getMessage(), 'Unknown column') !== false) {
                $this->ensureRepairOrderColumns();
                try {
                    $ok2 = $this->db->execute();
                    if (!$ok2) return false;
                    return (int)$this->db->lastInsertId();
                } catch (PDOException $e2) {
                    return false;
                }
            }
            return false;
        }
    }

    // Update Status
    public function updateStatus($id, $status, $userId = null, $locationId = 1) {
        $this->ensureRepairOrderColumns();
        $this->db->query("UPDATE {$this->table} SET status = :status, updated_by = :updated_by WHERE id = :id AND location_id = :location_id");
        $this->db->bind(':status', $status);
        $this->db->bind(':updated_by', $userId);
        $this->db->bind(':id', $id);
        $this->db->bind(':location_id', (int)$locationId);
        return $this->db->execute();
    }

    public function assignBayAndTechnician($id, $bayName, $technicianName, $status, $userId = null, $locationId = 1) {
        $this->ensureRepairOrderColumns();
        $this->db->query("
            UPDATE {$this->table}
            SET location = :bay,
                technician = :technician,
                status = :status,
                updated_by = :updated_by
            WHERE id = :id AND location_id = :location_id
        ");
        $this->db->bind(':bay', $bayName !== null ? (string)$bayName : null);
        $this->db->bind(':technician', $technicianName !== null ? (string)$technicianName : null);
        $this->db->bind(':status', (string)$status);
        $this->db->bind(':updated_by', $userId);
        $this->db->bind(':id', (int)$id);
        $this->db->bind(':location_id', (int)$locationId);
        return $this->db->execute();
    }

    public function deleteOrder($id, $locationId) {
        $this->ensureRepairOrderColumns();
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id AND (location_id = :loc OR from_location_id = :loc)");
        $this->db->bind(':id', (int)$id);
        $this->db->bind(':loc', (int)$locationId);
        return $this->db->execute();
    }
}
