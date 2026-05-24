<?php
/**
 * Route Model
 */

class Route extends Model {
    private $table = 'routes';

    public function getAllByLocation($locationId) {
        $this->db->query("SELECT * FROM {$this->table} WHERE location_id = :loc ORDER BY name ASC");
        $this->db->bind(':loc', $locationId);
        return $this->db->resultSet();
    }

    public function getById($id) {
        $this->db->query("SELECT * FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function create($data) {
        $this->db->query("
            INSERT INTO {$this->table} (location_id, name, description)
            VALUES (:location_id, :name, :description)
        ");
        
        $this->db->bind(':location_id', $data['location_id']);
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':description', $data['description'] ?? null);

        return $this->db->execute();
    }

    public function update($id, $data) {
        $this->db->query("
            UPDATE {$this->table} 
            SET name = :name, description = :description 
            WHERE id = :id
        ");
        
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':description', $data['description'] ?? null);
        $this->db->bind(':id', $id);

        return $this->db->execute();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
