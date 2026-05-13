<?php
/**
 * ShippingCarrier Model
 */
class ShippingCarrier extends Model {
    protected $table = 'shipping_carriers';

    public function getAll() {
        $this->db->query("SELECT * FROM {$this->table} ORDER BY name ASC");
        return $this->db->resultSet();
    }

    public function getById($id) {
        $this->db->query("SELECT * FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function create($data) {
        // If setting as default, unset others
        if (!empty($data['is_default'])) {
            $this->unsetDefaults();
        }

        $this->db->query("INSERT INTO {$this->table} (name, tracking_url, is_default) VALUES (:name, :tracking_url, :is_default)");
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':tracking_url', $data['tracking_url'] ?? null);
        $this->db->bind(':is_default', !empty($data['is_default']) ? 1 : 0);
        return $this->db->execute();
    }

    public function update($id, $data) {
        // If setting as default, unset others
        if (!empty($data['is_default'])) {
            $this->unsetDefaults();
        }

        $this->db->query("UPDATE {$this->table} SET name = :name, tracking_url = :tracking_url, is_default = :is_default WHERE id = :id");
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':tracking_url', $data['tracking_url'] ?? null);
        $this->db->bind(':is_default', !empty($data['is_default']) ? 1 : 0);
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    private function unsetDefaults() {
        $this->db->query("UPDATE {$this->table} SET is_default = 0");
        $this->db->execute();
    }
}
