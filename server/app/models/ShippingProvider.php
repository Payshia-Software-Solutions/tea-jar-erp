<?php
/**
 * Shipping Provider Model
 */
class ShippingProvider extends Model {
    private $table = 'shipping_providers';

    public function __construct() {
        parent::__construct();
        // $this->ensureSchema();
    }

    private function ensureSchema() { return;
        require_once '../app/helpers/ShippingSchema.php';
        ShippingSchema::ensure();
    }

    public function list($activeOnly = true) {
        $sql = "SELECT * FROM {$this->table}";
        if ($activeOnly) {
            $sql .= " WHERE is_active = 1";
        }
        $sql .= " ORDER BY name ASC";
        $this->db->query($sql);
        return $this->db->resultSet();
    }

    public function getById($id) {
        $this->db->query("SELECT * FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function create($data, $userId = null) {
        $this->db->query("
            INSERT INTO {$this->table} (name, base_cost, is_active, created_by, updated_by)
            VALUES (:name, :base_cost, :is_active, :c, :u)
        ");
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':base_cost', $data['base_cost'] ?? 0);
        $this->db->bind(':is_active', isset($data['is_active']) ? (int)$data['is_active'] : 1);
        $this->db->bind(':c', $userId);
        $this->db->bind(':u', $userId);
        
        if ($this->db->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function update($id, $data, $userId = null) {
        $this->db->query("
            UPDATE {$this->table}
            SET name = :name,
                base_cost = :base_cost,
                is_active = :is_active,
                updated_by = :u
            WHERE id = :id
        ");
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':base_cost', $data['base_cost'] ?? 0);
        $this->db->bind(':is_active', isset($data['is_active']) ? (int)$data['is_active'] : 1);
        $this->db->bind(':u', $userId);
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
