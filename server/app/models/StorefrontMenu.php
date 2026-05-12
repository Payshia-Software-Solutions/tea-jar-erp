<?php
/**
 * StorefrontMenu Model
 */
class StorefrontMenu extends Model {
    
    public function list($activeOnly = false, $locationId = null) {
        $sql = "SELECT * FROM storefront_menus WHERE 1=1";
        if ($activeOnly) {
            $sql .= " AND is_active = 1";
        }
        if ($locationId !== null) {
            $sql .= " AND (location_id = " . (int)$locationId . " OR location_id IS NULL)";
        }
        $sql .= " ORDER BY sort_order ASC, label ASC";
        
        $this->db->query($sql);
        return $this->db->resultSet();
    }

    public function getTree($activeOnly = false, $locationId = null) {
        $rows = $this->list($activeOnly, $locationId);
        $tree = [];
        $lookup = [];

        foreach ($rows as $row) {
            $row->children = [];
            $lookup[$row->id] = $row;
        }

        foreach ($rows as $row) {
            if ($row->parent_id && isset($lookup[$row->parent_id])) {
                $lookup[$row->parent_id]->children[] = $row;
            } else {
                $tree[] = $row;
            }
        }

        return $tree;
    }

    public function getById($id) {
        $this->db->query("SELECT * FROM storefront_menus WHERE id = :id");
        $this->db->bind(':id', (int)$id);
        return $this->db->single();
    }

    public function create($data) {
        $this->db->query("
            INSERT INTO storefront_menus (parent_id, location_id, label, link_type, link_value, sort_order, is_active, is_mega_menu)
            VALUES (:pid, :loc_id, :lbl, :type, :val, :sort, :active, :mega)
        ");
        $this->db->bind(':pid', $data['parent_id'] ?? null);
        $this->db->bind(':loc_id', $data['location_id'] ?? null);
        $this->db->bind(':lbl', $data['label']);
        $this->db->bind(':type', $data['link_type'] ?? 'Internal');
        $this->db->bind(':val', $data['link_value'] ?? null);
        $this->db->bind(':sort', (int)($data['sort_order'] ?? 0));
        $this->db->bind(':active', (int)($data['is_active'] ?? 1));
        $this->db->bind(':mega', (int)($data['is_mega_menu'] ?? 0));
        
        if ($this->db->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function update($id, $data) {
        $this->db->query("
            UPDATE storefront_menus 
            SET parent_id = :pid, 
                location_id = :loc_id,
                label = :lbl, 
                link_type = :type, 
                link_value = :val, 
                sort_order = :sort, 
                is_active = :active,
                is_mega_menu = :mega
            WHERE id = :id
        ");
        $this->db->bind(':pid', $data['parent_id'] ?? null);
        $this->db->bind(':loc_id', $data['location_id'] ?? null);
        $this->db->bind(':lbl', $data['label']);
        $this->db->bind(':type', $data['link_type'] ?? 'Internal');
        $this->db->bind(':val', $data['link_value'] ?? null);
        $this->db->bind(':sort', (int)($data['sort_order'] ?? 0));
        $this->db->bind(':active', (int)($data['is_active'] ?? 1));
        $this->db->bind(':mega', (int)($data['is_mega_menu'] ?? 0));
        $this->db->bind(':id', (int)$id);
        
        return $this->db->execute();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM storefront_menus WHERE id = :id");
        $this->db->bind(':id', (int)$id);
        return $this->db->execute();
    }

    public function updateSort($items) {
        foreach ($items as $item) {
            $this->db->query("UPDATE storefront_menus SET sort_order = :sort WHERE id = :id");
            $this->db->bind(':sort', (int)$item['sort_order']);
            $this->db->bind(':id', (int)$item['id']);
            $this->db->execute();
        }
        return true;
    }
}
