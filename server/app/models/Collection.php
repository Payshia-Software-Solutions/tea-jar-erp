<?php
/**
 * Collection Model
 * Handles logic for Product Collections (grouping)
 */
class Collection extends Model {
    private $table = 'collections';
    
    public function __construct() {
        parent::__construct();
        InventorySchema::ensure();
    }

    public function getAll($publicOnly = false) {
        if ($publicOnly) {
            $this->db->query("SELECT * FROM {$this->table} WHERE show_in_public = 1 ORDER BY name ASC");
        } else {
            $this->db->query("SELECT * FROM {$this->table} ORDER BY name ASC");
        }
        return $this->db->resultSet();
    }

    public function getById($id) {
        $this->db->query("SELECT * FROM {$this->table} WHERE id = :id LIMIT 1");
        $this->db->bind(':id', (int)$id);
        return $this->db->single();
    }

    public function create($data, $userId = null) {
        $this->db->query("
            INSERT INTO {$this->table} (name, show_in_public, created_by, updated_by)
            VALUES (:name, :show_in_public, :created_by, :updated_by)
        ");
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':show_in_public', isset($data['show_in_public']) ? (int)(bool)$data['show_in_public'] : 1);
        $this->db->bind(':created_by', $userId);
        $this->db->bind(':updated_by', $userId);
        
        if ($this->db->execute()) {
            return (int)$this->db->lastInsertId();
        }
        return false;
    }

    public function update($id, $data, $userId = null) {
        $this->db->query("
            UPDATE {$this->table}
            SET name = :name,
                show_in_public = :show_in_public,
                updated_by = :updated_by
            WHERE id = :id
        ");
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':show_in_public', isset($data['show_in_public']) ? (int)(bool)$data['show_in_public'] : 1);
        $this->db->bind(':updated_by', $userId);
        $this->db->bind(':id', (int)$id);
        return $this->db->execute();
    }

    public function delete($id) {
        // Cascade delete is handled by database FK constraint for parts_collections
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', (int)$id);
        return $this->db->execute();
    }

    /**
     * Relationship: Get collections for a specific product
     */
    public function getPartCollections($partId) {
        $this->db->query("
            SELECT c.*
            FROM parts_collections pc
            JOIN collections c ON c.id = pc.collection_id
            WHERE pc.part_id = :part_id
            ORDER BY c.name ASC
        ");
        $this->db->bind(':part_id', (int)$partId);
        return $this->db->resultSet();
    }

    /**
     * Relationship: Sync products to a specific collection
     */
    public function syncProductCollections($partId, $collectionIds) {
        $pid = (int)$partId;
        $ids = is_array($collectionIds) ? array_map('intval', $collectionIds) : [];
        
        try {
            $this->db->beginTransaction();
            
            // Remove existing
            $this->db->query("DELETE FROM parts_collections WHERE part_id = :pid");
            $this->db->bind(':pid', $pid);
            $this->db->execute();
            
            // Add new
            foreach ($ids as $cid) {
                if ($cid <= 0) continue;
                $this->db->query("INSERT INTO parts_collections (part_id, collection_id) VALUES (:pid, :cid)");
                $this->db->bind(':pid', $pid);
                $this->db->bind(':cid', $cid);
                $this->db->execute();
            }
            
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            try { $this->db->rollBack(); } catch (Exception $e2) {}
            error_log("Failed to sync product collections: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Relationship: Get parts currently assigned to this collection
     */
    public function getCollectionParts($id) {
        $this->db->query("
            SELECT p.id, p.part_name, p.sku
            FROM parts_collections pc
            JOIN parts p ON p.id = pc.part_id
            WHERE pc.collection_id = :id
            ORDER BY p.part_name ASC
        ");
        $this->db->bind(':id', (int)$id);
        return $this->db->resultSet();
    }

    /**
     * Relationship: Sync multiple products to a specific collection
     */
    public function syncCollectionParts($id, $partIds) {
        $cid = (int)$id;
        $ids = is_array($partIds) ? array_map('intval', $partIds) : [];
        
        try {
            $this->db->beginTransaction();
            
            // Remove existing mappings for THIS collection
            $this->db->query("DELETE FROM parts_collections WHERE collection_id = :cid");
            $this->db->bind(':cid', $cid);
            $this->db->execute();
            
            // Add new
            foreach ($ids as $pid) {
                if ($pid <= 0) continue;
                $this->db->query("INSERT INTO parts_collections (part_id, collection_id) VALUES (:pid, :cid)");
                $this->db->bind(':pid', $pid);
                $this->db->bind(':cid', $cid);
                $this->db->execute();
            }
            
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            try { $this->db->rollBack(); } catch (Exception $e2) {}
            error_log("Failed to sync collection parts: " . $e->getMessage());
            return false;
        }
    }
}
