<?php
/**
 * BanquetHall Model
 */
class BanquetHall extends Model {
    private $table = 'banquet_halls';

    public function __construct() {
        parent::__construct();
        // // $this->ensureSchema();
    }

    public function ensureSchema() { return;
        $this->db->query("
            CREATE TABLE IF NOT EXISTS {$this->table} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                location_id INT DEFAULT 1,
                capacity INT DEFAULT 0,
                price_per_session DECIMAL(10,2) DEFAULT 0.00,
                status ENUM('Available', 'Maintenance', 'Inactive') DEFAULT 'Available',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        ");
        $this->db->execute();
    }

    public function getAll($locationId = 1) {
        $this->db->query("
            SELECT * FROM {$this->table}
            WHERE location_id = :loc
            ORDER BY name ASC
        ");
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
            INSERT INTO {$this->table} (name, location_id, capacity, price_per_session, status, notes)
            VALUES (:name, :loc, :cap, :price, :status, :notes)
        ");
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':loc', $data['location_id'] ?? 1);
        $this->db->bind(':cap', $data['capacity'] ?? 0);
        $this->db->bind(':price', $data['price_per_session'] ?? 0);
        $this->db->bind(':status', $data['status'] ?? 'Available');
        $this->db->bind(':notes', $data['notes'] ?? null);
        return $this->db->execute();
    }

    public function update($id, $data) {
        $this->db->query("
            UPDATE {$this->table}
            SET name = :name, capacity = :cap, price_per_session = :price, status = :status, notes = :notes
            WHERE id = :id
        ");
        $this->db->bind(':id', $id);
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':cap', $data['capacity']);
        $this->db->bind(':price', $data['price_per_session']);
        $this->db->bind(':status', $data['status']);
        $this->db->bind(':notes', $data['notes'] ?? null);
        return $this->db->execute();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
