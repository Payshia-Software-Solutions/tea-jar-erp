<?php
/**
 * ChecklistTemplate Model (Global checklist repository)
 */
class ChecklistTemplate extends Model {
    private $table = 'checklist_templates';

    public function __construct() {
        parent::__construct();
        $this->ensureChecklistTemplateSchema();
    }

    private function ensureChecklistTemplateSchema() {
        // Add standard_mileage
        $this->db->query("SHOW COLUMNS FROM {$this->table} LIKE 'standard_mileage'");
        if (!$this->db->single()) {
            $this->db->query("ALTER TABLE {$this->table} ADD COLUMN standard_mileage INT NULL AFTER description");
            $this->db->execute();
        }

        // Add extended_description
        $this->db->query("SHOW COLUMNS FROM {$this->table} LIKE 'extended_description'");
        if (!$this->db->single()) {
            $this->db->query("ALTER TABLE {$this->table} ADD COLUMN extended_description TEXT NULL AFTER standard_mileage");
            $this->db->execute();
        }
    }

    public function getAll() {
        $this->db->query("SELECT * FROM {$this->table} ORDER BY id DESC");
        return $this->db->resultSet();
    }

    public function create($description, $mileage = null, $extendedDesc = null, $userId = null) {
        $this->db->query("INSERT INTO {$this->table} (description, standard_mileage, extended_description, created_by, updated_by) VALUES (:description, :standard_mileage, :extended_description, :created_by, :updated_by)");
        $this->db->bind(':description', $description);
        $this->db->bind(':standard_mileage', $mileage);
        $this->db->bind(':extended_description', $extendedDesc);
        $this->db->bind(':created_by', $userId);
        $this->db->bind(':updated_by', $userId);
        return $this->db->execute();
    }

    public function update($id, $description, $mileage = null, $extendedDesc = null, $userId = null) {
        $this->db->query("UPDATE {$this->table} SET description = :description, standard_mileage = :standard_mileage, extended_description = :extended_description, updated_by = :updated_by WHERE id = :id");
        $this->db->bind(':description', $description);
        $this->db->bind(':standard_mileage', $mileage);
        $this->db->bind(':extended_description', $extendedDesc);
        $this->db->bind(':updated_by', $userId);
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
