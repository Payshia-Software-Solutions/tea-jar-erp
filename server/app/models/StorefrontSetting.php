<?php
/**
 * StorefrontSetting Model
 */
class StorefrontSetting extends Model {
    protected $table = 'storefront_settings';

    public function getGrouped() {
        require_once '../app/helpers/StorefrontSchema.php';
        StorefrontSchema::ensure();

        $this->db->query("SELECT * FROM {$this->table}");
        $rows = $this->db->resultSet();
        
        $grouped = [];
        foreach ($rows as $row) {
            if (!isset($grouped[$row->group])) $grouped[$row->group] = [];
            $grouped[$row->group][$row->key] = $row->value;
        }
        return $grouped;
    }

    public function getAll($locationId = 1) {
        require_once '../app/helpers/StorefrontSchema.php';
        StorefrontSchema::ensure();

        $this->db->query("SELECT * FROM {$this->table} WHERE location_id = :loc");
        $this->db->bind(':loc', $locationId);
        $rows = $this->db->resultSet();
        $res = [];
        foreach ($rows as $row) {
            $res[$row->key] = $row->value;
        }
        return $res;
    }

    public function updateSetting($key, $value, $locationId = 1) {
        // Use UPSERT logic since we now have location_id
        $this->db->query("INSERT INTO {$this->table} (location_id, `key`, `value`) 
                         VALUES (:loc, :key, :val) 
                         ON DUPLICATE KEY UPDATE `value` = :val2");
        $this->db->bind(':loc', $locationId);
        $this->db->bind(':key', $key);
        $this->db->bind(':val', $value);
        $this->db->bind(':val2', $value);
        return $this->db->execute();
    }
}
