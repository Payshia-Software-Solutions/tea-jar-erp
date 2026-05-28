<?php
/**
 * Vehicle Model
 */
class Vehicle extends Model {
    private $table = 'vehicles';

    public function ensureSchema($force = false) { return;
        $cols = [
            'department_id' => "INT NULL",
            'customer_id' => "INT NULL",
            'image_filename' => "VARCHAR(255) NULL",
            'source' => "VARCHAR(20) DEFAULT 'manual'",
            'external_make' => "VARCHAR(100) NULL",
            'external_model' => "VARCHAR(100) NULL",
            'last_sync_at' => "DATETIME NULL",
            'current_mileage' => "INT DEFAULT 0",
            'morning_mileage' => "INT DEFAULT 0",
            'mileage_last_synced_at' => "DATETIME NULL",
            'updated_by' => "INT NULL",
            'created_by' => "INT NULL",
            'service_interval_mileage' => "INT NULL",
            'next_service_mileage' => "INT NULL",
            'next_service_date' => "DATE NULL",
        ];

        foreach ($cols as $col => $def) {
            try {
                $this->db->query("SHOW COLUMNS FROM {$this->table} LIKE '{$col}'");
                $exists = (bool)$this->db->single();
                if (!$exists) {
                    $this->db->exec("ALTER TABLE {$this->table} ADD COLUMN {$col} {$def}");
                }
            } catch (Exception $e) {
                // ignore
            }
        }
    }

    public function getAll($filter = 'all') {
        $sql = "
            SELECT v.*, c.name as customer_name, d.name as department_name 
            FROM {$this->table} v
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN departments d ON v.department_id = d.id
        ";
        if ($filter === 'internal') {
            $sql .= " WHERE v.customer_id IS NULL";
        } elseif ($filter === 'customer') {
            $sql .= " WHERE v.customer_id IS NOT NULL";
        }
        $sql .= " ORDER BY v.id ASC";
        
        $this->db->query($sql);
        return $this->db->resultSet();
    }

    public function getPaginated($page = 1, $limit = 10, $filter = 'all', $search = '') {
        $offset = ($page - 1) * $limit;
        
        $whereClauses = [];
        $params = [];

        if ($filter === 'internal') {
            $whereClauses[] = "v.customer_id IS NULL";
        } elseif ($filter === 'customer') {
            $whereClauses[] = "v.customer_id IS NOT NULL";
        }

        if (!empty($search)) {
            $search = "%$search%";
            $whereClauses[] = "(v.make LIKE :search OR v.model LIKE :search OR v.vin LIKE :search OR v.external_make LIKE :search OR v.external_model LIKE :search OR c.name LIKE :search OR d.name LIKE :search)";
            $params[':search'] = $search;
        }

        $whereSql = !empty($whereClauses) ? "WHERE " . implode(" AND ", $whereClauses) : "";

        // Count total
        $this->db->query("SELECT COUNT(*) FROM {$this->table} v LEFT JOIN customers c ON v.customer_id = c.id LEFT JOIN departments d ON v.department_id = d.id $whereSql");
        foreach ($params as $key => $val) {
            $this->db->bind($key, $val);
        }
        $total = $this->db->singleColumn();

        // Get data
        $sql = "
            SELECT v.*, c.name as customer_name, d.name as department_name 
            FROM {$this->table} v
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN departments d ON v.department_id = d.id
            $whereSql
            ORDER BY v.id DESC
            LIMIT :limit OFFSET :offset
        ";
        
        $this->db->query($sql);
        foreach ($params as $key => $val) {
            $this->db->bind($key, $val);
        }
        $this->db->bind(':limit', (int)$limit);
        $this->db->bind(':offset', (int)$offset);
        
        $data = $this->db->resultSet();

        return [
            'data' => $data,
            'total' => (int)$total,
            'page' => (int)$page,
            'limit' => (int)$limit,
            'pages' => ceil($total / $limit)
        ];
    }

    public function getById($id) {
        $this->db->query("
            SELECT v.*, c.name as customer_name, d.name as department_name 
            FROM {$this->table} v
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN departments d ON v.department_id = d.id
            WHERE v.id = :id
        ");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function create($data, $userId = null) {
        // // // // // $this->ensureSchema();
        $this->db->query("
            INSERT INTO {$this->table} (customer_id, department_id, make, model, year, vin, image_filename, category, work_type, driver_name, fuel_capacity, external_location, external_make, external_model, service_interval_mileage, created_by, updated_by)
            VALUES (:customer_id, :department_id, :make, :model, :year, :vin, :image_filename, :category, :work_type, :driver_name, :fuel_capacity, :external_location, :external_make, :external_model, :service_interval_mileage, :created_by, :updated_by)
        ");
        $this->db->bind(':customer_id', $data['customer_id'] ?? null);
        $this->db->bind(':department_id', $data['department_id'] ?? null);
        $this->db->bind(':make', $data['make'] ?? 'Unknown');
        $this->db->bind(':model', $data['model'] ?? 'Unknown');
        $this->db->bind(':year', $data['year'] ?? null);
        $this->db->bind(':vin', $data['vin']);
        $this->db->bind(':image_filename', $data['image_filename'] ?? null);
        $this->db->bind(':category', $data['category'] ?? null);
        $this->db->bind(':work_type', $data['work_type'] ?? null);
        $this->db->bind(':driver_name', $data['driver_name'] ?? null);
        $this->db->bind(':fuel_capacity', $data['fuel_capacity'] ?? null);
        $this->db->bind(':external_location', $data['external_location'] ?? null);
        $this->db->bind(':external_make', $data['external_make'] ?? null);
        $this->db->bind(':external_model', $data['external_model'] ?? null);
        $this->db->bind(':service_interval_mileage', isset($data['service_interval_mileage']) ? (int)$data['service_interval_mileage'] : null);
        $this->db->bind(':created_by', $userId);
        $this->db->bind(':updated_by', $userId);
        return $this->db->execute();
    }

    public function update($id, $data, $userId = null) {
        // // // // // $this->ensureSchema();
        $this->db->query("
            UPDATE {$this->table}
            SET customer_id = :customer_id,
                department_id = :department_id,
                make = :make,
                model = :model,
                year = :year,
                vin = :vin,
                image_filename = :image_filename,
                category = :category,
                work_type = :work_type,
                driver_name = :driver_name,
                fuel_capacity = :fuel_capacity,
                external_location = :external_location,
                service_interval_mileage = :service_interval_mileage,
                updated_by = :updated_by
            WHERE id = :id
        ");
        $this->db->bind(':customer_id', $data['customer_id'] ?? null);
        $this->db->bind(':department_id', $data['department_id'] ?? null);
        $this->db->bind(':make', $data['make']);
        $this->db->bind(':model', $data['model']);
        $this->db->bind(':year', $data['year']);
        $this->db->bind(':vin', $data['vin']);
        $this->db->bind(':image_filename', $data['image_filename'] ?? null);
        $this->db->bind(':category', $data['category'] ?? null);
        $this->db->bind(':work_type', $data['work_type'] ?? null);
        $this->db->bind(':driver_name', $data['driver_name'] ?? null);
        $this->db->bind(':fuel_capacity', $data['fuel_capacity'] ?? null);
        $this->db->bind(':external_location', $data['external_location'] ?? null);
        $this->db->bind(':service_interval_mileage', isset($data['service_interval_mileage']) ? (int)$data['service_interval_mileage'] : null);
        $this->db->bind(':updated_by', $userId);
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function getByCustomer($customerId) {
        $this->db->query("
            SELECT v.*, c.name as customer_name, d.name as department_name 
            FROM {$this->table} v
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN departments d ON v.department_id = d.id
            WHERE v.customer_id = :customer_id 
            ORDER BY v.id ASC
        ");
        $this->db->bind(':customer_id', $customerId);
        return $this->db->resultSet();
    }

    public function upsertFromApi($data) {
        // // // // // $this->ensureSchema();
        // Check if exists
        $this->db->query("SELECT id FROM {$this->table} WHERE external_id = :external_id");
        $this->db->bind(':external_id', $data['external_id']);
        $existing = $this->db->single();

        if ($existing) {
            // Update only sync fields, preserve internal make/model
            $this->db->query("
                UPDATE {$this->table}
                SET category = :category,
                    work_type = :work_type,
                    external_location = :external_location,
                    external_make = :external_make,
                    external_model = :external_model,
                    driver_name = :driver_name,
                    fuel_capacity = :fuel_capacity,
                    department_id = COALESCE(:department_id, department_id),
                    last_sync_at = NOW(),
                    source = 'api'
                WHERE id = :id
            ");
            $this->db->bind(':id', $existing->id);
        } else {
            // Insert new record with 'Not Mapped' for ERP selection
            $this->db->query("
                INSERT INTO {$this->table} (
                    external_id, vin, make, model, category, work_type, 
                    external_location, external_make, external_model, 
                    driver_name, fuel_capacity, department_id, 
                    source, last_sync_at
                ) VALUES (
                    :external_id, :vin, 'Not Mapped', 'Not Mapped', :category, :work_type, 
                    :external_location, :external_make, :external_model, 
                    :driver_name, :fuel_capacity, :department_id, 
                    'api', NOW()
                )
            ");
            $this->db->bind(':vin', $data['vin']);
            $this->db->bind(':external_id', $data['external_id']);
        }

        $this->db->bind(':category', $data['category'] ?? null);
        $this->db->bind(':work_type', $data['work_type'] ?? null);
        $this->db->bind(':external_location', $data['external_location'] ?? null);
        $this->db->bind(':external_make', $data['external_make'] ?? null);
        $this->db->bind(':external_model', $data['external_model'] ?? null);
        $this->db->bind(':driver_name', $data['driver_name'] ?? null);
        $this->db->bind(':fuel_capacity', $data['fuel_capacity'] ?? null);
        $this->db->bind(':department_id', $data['department_id'] ?? null);

        return $this->db->execute();
    }

    public function getServiceHistory($vehicleId) {
        $this->db->query("
            SELECT id, status, job_type, mileage, completed_at, problem_description, comments, created_at, technician, completion_comments
            FROM repair_orders
            WHERE vehicle_id = :vehicle_id AND status = 'Completed'
            ORDER BY completed_at DESC
        ");
        $this->db->bind(':vehicle_id', $vehicleId);
        return $this->db->resultSet();
    }

    public function getUpcomingServices() {
        $this->db->query("
            SELECT v.*, c.name as customer_name, d.name as department_name 
            FROM {$this->table} v
            LEFT JOIN customers c ON v.customer_id = c.id
            LEFT JOIN departments d ON v.department_id = d.id
            WHERE (v.next_service_mileage > 0 AND v.morning_mileage >= (v.next_service_mileage - 500))
               OR (v.next_service_date IS NOT NULL AND v.next_service_date <= DATE_ADD(CURDATE(), INTERVAL 14 DAY))
            ORDER BY 
                CASE WHEN v.next_service_date <= CURDATE() THEN 0
                     WHEN v.next_service_mileage > 0 AND v.morning_mileage >= v.next_service_mileage THEN 0
                     ELSE 1 END ASC,
                v.next_service_date ASC,
                (v.next_service_mileage - v.morning_mileage) ASC
        ");
        return $this->db->resultSet();
    }
}
