<?php
/**
 * Payee Model
 * Manages recipients for expense payments (Utilities, Rent, Services).
 */
class Payee extends Model {
    private $table = 'acc_payees';

    public function __construct() {
        parent::__construct();
        // $this->ensureSchema();
    }

    public function ensureSchema() {
        $this->db->query("
            CREATE TABLE IF NOT EXISTS {$this->table} (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                name        VARCHAR(150) NOT NULL UNIQUE,
                contact_no  VARCHAR(20) NULL,
                address     TEXT NULL,
                type        ENUM('Utility', 'Service', 'Other') NOT NULL DEFAULT 'Other',
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_payee_name (name)
            )
        ");
        $this->db->execute();
    }

    public function create($data) {
        $this->db->query("
            INSERT INTO {$this->table} (name, contact_no, address, type)
            VALUES (:name, :contact_no, :address, :type)
        ");
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':contact_no', $data['contact_no'] ?? null);
        $this->db->bind(':address', $data['address'] ?? null);
        $this->db->bind(':type', $data['type'] ?? 'Other');
        
        if ($this->db->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function getAll() {
        $this->db->query("SELECT * FROM {$this->table} ORDER BY name ASC");
        return $this->db->resultSet();
    }

    public function findByName($name) {
        $this->db->query("SELECT * FROM {$this->table} WHERE name = :name LIMIT 1");
        $this->db->bind(':name', $name);
        return $this->db->single();
    }

    public function update($id, $data) {
        $this->db->query("
            UPDATE {$this->table} 
            SET name = :name, contact_no = :contact_no, address = :address, type = :type
            WHERE id = :id
        ");
        $this->db->bind(':id', (int)$id);
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':contact_no', $data['contact_no'] ?? null);
        $this->db->bind(':address', $data['address'] ?? null);
        $this->db->bind(':type', $data['type'] ?? 'Other');
        return $this->db->execute();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', (int)$id);
        return $this->db->execute();
    }
}
