<?php
/**
 * Brand Model
 */
class Brand extends Model {
    private $table = 'brands';

    private function ensureSchema() { return;
        BrandSchema::ensure();
    }

    public function list($q = '') {
        // // // // // // $this->ensureSchema();
        $q = is_string($q) ? trim($q) : '';
        if ($q !== '') {
            $this->db->query("SELECT * FROM {$this->table} WHERE name LIKE :q ORDER BY name ASC");
            $this->db->bind(':q', '%' . $q . '%');
            return $this->db->resultSet();
        }
        $this->db->query("SELECT * FROM {$this->table} ORDER BY name ASC");
        return $this->db->resultSet();
    }

    public function create($name, $userId = null) {
        // // // // // // $this->ensureSchema();
        $this->db->query("INSERT INTO {$this->table} (name, created_by, updated_by) VALUES (:name, :c, :u)");
        $this->db->bind(':name', $name);
        $this->db->bind(':c', $userId);
        $this->db->bind(':u', $userId);
        return $this->db->execute();
    }

    public function update($id, $name, $userId = null) {
        // // // // // // $this->ensureSchema();
        $this->db->query("UPDATE {$this->table} SET name = :name, updated_by = :u WHERE id = :id");
        $this->db->bind(':name', $name);
        $this->db->bind(':u', $userId);
        $this->db->bind(':id', (int)$id);
        return $this->db->execute();
    }

    public function delete($id) {
        // // // // // // $this->ensureSchema();
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', (int)$id);
        return $this->db->execute();
    }
}

