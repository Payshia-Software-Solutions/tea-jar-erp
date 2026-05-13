<?php
/**
 * StorefrontSetting Model
 */
class StorefrontSetting extends Model {
    protected $table = 'storefront_settings';

    public function getGrouped($locationId = 1) {
        require_once '../app/helpers/StorefrontSchema.php';
        StorefrontSchema::ensure();

        // 1. Get ALL defaults from location 1
        $this->db->query("SELECT * FROM {$this->table} WHERE location_id = 1");
        $defaultRows = $this->db->resultSet();
        
        $settingsMap = [];
        foreach ($defaultRows as $row) {
            $settingsMap[$row->key] = [
                'value' => $row->value,
                'group' => $row->group
            ];
        }

        // 2. Override with location-specific settings if locationId != 1
        if ($locationId != 1) {
            $this->db->query("SELECT * FROM {$this->table} WHERE location_id = :loc");
            $this->db->bind(':loc', $locationId);
            $locRows = $this->db->resultSet();
            foreach ($locRows as $row) {
                // We use the value from the specific location
                // But we preserve the group from location 1 if the current group is general/empty
                $group = $row->group;
                if (($group === 'general' || empty($group)) && isset($settingsMap[$row->key])) {
                    $group = $settingsMap[$row->key]['group'];
                }
                
                $settingsMap[$row->key] = [
                    'value' => $row->value,
                    'group' => $group
                ];
            }
        }

        // 3. Build grouped structure
        $grouped = [];
        foreach ($settingsMap as $key => $data) {
            $group = $data['group'];
            if (!isset($grouped[$group])) $grouped[$group] = [];
            $grouped[$group][$key] = $data['value'];

            // Flat key for fallback
            $grouped[$key] = $data['value'];
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
        // First, check if this setting exists for ANY location to get its group, label, and type
        $this->db->query("SELECT `group`, `label`, `type` FROM {$this->table} WHERE `key` = :key LIMIT 1");
        $this->db->bind(':key', $key);
        $template = $this->db->single();

        $group = $template->group ?? 'general';
        $label = $template->label ?? $key;
        $type = $template->type ?? 'text';

        // Use UPSERT logic since we now have location_id
        $this->db->query("INSERT INTO {$this->table} (location_id, `key`, `value`, `group`, `label`, `type`) 
                         VALUES (:loc, :key, :val, :grp, :lbl, :typ) 
                         ON DUPLICATE KEY UPDATE `value` = :val2");
        $this->db->bind(':loc', $locationId);
        $this->db->bind(':key', $key);
        $this->db->bind(':val', $value);
        $this->db->bind(':grp', $group);
        $this->db->bind(':lbl', $label);
        $this->db->bind(':typ', $type);
        $this->db->bind(':val2', $value);
        return $this->db->execute();
    }
}
