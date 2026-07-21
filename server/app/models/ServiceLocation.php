<?php
/**
 * ServiceLocation Model
 */
class ServiceLocation extends Model {
    private $table = 'service_locations';

    public function ensureSchema() { return;
        try {
            $this->db->query("SHOW COLUMNS FROM {$this->table} LIKE 'location_type'");
            $exists = (bool)$this->db->single();
            if (!$exists) {
                $this->db->exec("ALTER TABLE {$this->table} ADD COLUMN location_type VARCHAR(50) NOT NULL DEFAULT 'service' AFTER name");
            }

            $cols = [
                'branch_code' => "VARCHAR(10) NULL DEFAULT 'BR01'",
                'allow_service_charge' => "TINYINT NOT NULL DEFAULT 0",
                'service_charge_rate' => "DECIMAL(5,2) NOT NULL DEFAULT 0.00",
                'allow_dine_in' => "TINYINT NOT NULL DEFAULT 1",
                'allow_take_away' => "TINYINT NOT NULL DEFAULT 1",
                'allow_retail' => "TINYINT NOT NULL DEFAULT 1",
                'is_pos_active' => "TINYINT NOT NULL DEFAULT 1",
                'allow_production' => "TINYINT NOT NULL DEFAULT 0",
                'allow_online' => "TINYINT NOT NULL DEFAULT 0",
                'allowed_taxes_json' => "TEXT NULL",
                'google_analytics_code' => "TEXT NULL",
                'facebook_pixel_code' => "TEXT NULL",
                'default_customer_id' => "INT NULL"
            ];
            foreach ($cols as $col => $def) {
                $this->db->query("SHOW COLUMNS FROM {$this->table} LIKE '{$col}'");
                if (!$this->db->single()) {
                    $this->db->exec("ALTER TABLE {$this->table} ADD COLUMN {$col} {$def}");
                }
            }
        } catch (Exception $e) { }
    }

    public function getAll() {
        // // // // // // $this->ensureSchema();
        $this->db->query("SELECT * FROM {$this->table} ORDER BY name ASC");
        return $this->db->resultSet();
    }

    public function getById($id) {
        // // // // // // $this->ensureSchema();
        $this->db->query("SELECT * FROM {$this->table} WHERE id = :id LIMIT 1");
        $this->db->bind(':id', (int)$id);
        return $this->db->single();
    }

    public function create($data, $userId = null) {
        // // // // // // $this->ensureSchema();
        $this->db->query("
            INSERT INTO {$this->table} (
                name, location_type, address, phone, tax_no, tax_label, 
                allow_service_charge, service_charge_rate, 
                allow_dine_in, allow_take_away, allow_retail, is_pos_active, allow_production, allow_online,
                allowed_taxes_json,
                google_analytics_code, facebook_pixel_code,
                default_customer_id,
                created_by, updated_by
            ) VALUES (
                :name, :location_type, :address, :phone, :tax_no, :tax_label, 
                :allow_service_charge, :service_charge_rate, 
                :allow_dine_in, :allow_take_away, :allow_retail, :is_pos_active, :allow_production, :allow_online,
                :allowed_taxes_json,
                :google_analytics_code, :facebook_pixel_code,
                :default_customer_id,
                :created_by, :updated_by
            )
        ");
        $this->db->bind(':name', trim((string)($data['name'] ?? '')));
        $this->db->bind(':location_type', $data['location_type'] ?? 'service');
        $this->db->bind(':address', $data['address'] ?? null);
        $this->db->bind(':phone', $data['phone'] ?? null);
        $this->db->bind(':tax_no', $data['tax_no'] ?? null);
        $this->db->bind(':tax_label', $data['tax_label'] ?? null);
        $this->db->bind(':allow_service_charge', $data['allow_service_charge'] ?? 0);
        $this->db->bind(':service_charge_rate', $data['service_charge_rate'] ?? 0);
        $this->db->bind(':allow_dine_in', $data['allow_dine_in'] ?? 1);
        $this->db->bind(':allow_take_away', $data['allow_take_away'] ?? 1);
        $this->db->bind(':allow_retail', $data['allow_retail'] ?? 1);
        $this->db->bind(':is_pos_active', $data['is_pos_active'] ?? 1);
        $this->db->bind(':allow_production', $data['allow_production'] ?? 0);
        $this->db->bind(':allow_online', $data['allow_online'] ?? 0);
        $this->db->bind(':allowed_taxes_json', $data['allowed_taxes_json'] ?? null);
        $this->db->bind(':google_analytics_code', $data['google_analytics_code'] ?? null);
        $this->db->bind(':facebook_pixel_code', $data['facebook_pixel_code'] ?? null);
        $this->db->bind(':default_customer_id', $data['default_customer_id'] ?? null);
        $this->db->bind(':created_by', $userId);
        $this->db->bind(':updated_by', $userId);
        return $this->db->execute();
    }

    public function update($id, $data, $userId = null) {
        // // // // // // $this->ensureSchema();
        $this->db->query("
            UPDATE {$this->table}
            SET name = :name, location_type = :location_type, address = :address, phone = :phone, 
                tax_no = :tax_no, tax_label = :tax_label, 
                allow_service_charge = :allow_service_charge, service_charge_rate = :service_charge_rate,
                allow_dine_in = :allow_dine_in, allow_take_away = :allow_take_away, allow_retail = :allow_retail,
                is_pos_active = :is_pos_active, allow_production = :allow_production, allow_online = :allow_online,
                allowed_taxes_json = :allowed_taxes_json,
                google_analytics_code = :google_analytics_code, facebook_pixel_code = :facebook_pixel_code,
                default_customer_id = :default_customer_id,
                updated_by = :updated_by
            WHERE id = :id
        ");
        $this->db->bind(':id', (int)$id);
        $this->db->bind(':name', trim((string)($data['name'] ?? '')));
        $this->db->bind(':location_type', $data['location_type'] ?? 'service');
        $this->db->bind(':address', $data['address'] ?? null);
        $this->db->bind(':phone', $data['phone'] ?? null);
        $this->db->bind(':tax_no', $data['tax_no'] ?? null);
        $this->db->bind(':tax_label', $data['tax_label'] ?? null);
        $this->db->bind(':allow_service_charge', $data['allow_service_charge'] ?? 0);
        $this->db->bind(':service_charge_rate', $data['service_charge_rate'] ?? 0);
        $this->db->bind(':allow_dine_in', $data['allow_dine_in'] ?? 1);
        $this->db->bind(':allow_take_away', $data['allow_take_away'] ?? 1);
        $this->db->bind(':allow_retail', $data['allow_retail'] ?? 1);
        $this->db->bind(':is_pos_active', $data['is_pos_active'] ?? 1);
        $this->db->bind(':allow_production', $data['allow_production'] ?? 0);
        $this->db->bind(':allow_online', $data['allow_online'] ?? 0);
        $this->db->bind(':allowed_taxes_json', $data['allowed_taxes_json'] ?? null);
        $this->db->bind(':google_analytics_code', $data['google_analytics_code'] ?? null);
        $this->db->bind(':facebook_pixel_code', $data['facebook_pixel_code'] ?? null);
        $this->db->bind(':default_customer_id', $data['default_customer_id'] ?? null);
        $this->db->bind(':updated_by', $userId);
        return $this->db->execute();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', (int)$id);
        return $this->db->execute();
    }
}
