<?php
/**
 * KioskContent Model
 * Handles rich content for kiosk experiences/pages.
 */
class KioskContent extends Model {
    private $table = 'kiosk_contents';

    public function __construct() {
        if (class_exists('KioskSchema')) KioskSchema::ensure();
        parent::__construct();
    }

    public function getByPartId($partId) {
        $this->db->query("SELECT * FROM {$this->table} WHERE part_id = :part_id LIMIT 1");
        $this->db->bind(':part_id', $partId);
        return $this->db->single();
    }

    public function getById($id) {
        $this->db->query("SELECT * FROM {$this->table} WHERE id = :id LIMIT 1");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function listAll($q = '') {
        $sql = "
            SELECT k.*, p.part_name as part_name 
            FROM {$this->table} k
            LEFT JOIN parts p ON p.id = k.part_id
        ";
        if ($q !== '') {
            $sql .= " WHERE k.title LIKE :q OR p.part_name LIKE :q ";
        }
        $sql .= " ORDER BY k.created_at DESC";
        $this->db->query($sql);
        if ($q !== '') $this->db->bind(':q', '%' . $q . '%');
        return $this->db->resultSet();
    }

    public function create($data, $userId) {
        $this->db->query("
            INSERT INTO {$this->table} (part_id, title, content_html, video_url, created_by, updated_by)
            VALUES (:part_id, :title, :content_html, :video_url, :user_id, :user_id)
        ");
        $this->db->bind(':part_id', $data['part_id'] ?? null);
        $this->db->bind(':title', $data['title'] ?? null);
        $this->db->bind(':content_html', $data['content_html'] ?? null);
        $this->db->bind(':video_url', $data['video_url'] ?? null);
        $this->db->bind(':user_id', $userId);
        
        if ($this->db->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function update($id, $data, $userId) {
        $this->db->query("
            UPDATE {$this->table} 
            SET part_id = :part_id, 
                title = :title, 
                content_html = :content_html, 
                video_url = :video_url, 
                updated_by = :user_id
            WHERE id = :id
        ");
        $this->db->bind(':id', $id);
        $this->db->bind(':part_id', $data['part_id'] ?? null);
        $this->db->bind(':title', $data['title'] ?? null);
        $this->db->bind(':content_html', $data['content_html'] ?? null);
        $this->db->bind(':video_url', $data['video_url'] ?? null);
        $this->db->bind(':user_id', $userId);
        
        return $this->db->execute();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
