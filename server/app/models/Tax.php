<?php
/**
 * Tax Model
 */
class Tax extends Model {
    private $table = 'taxes';

    private function ensureSchema() {
        TaxSchema::ensure();
    }

    public function list($q = '', $activeOnly = true) {
        // $this->ensureSchema();
        $q = is_string($q) ? trim($q) : '';
        $activeOnly = (bool)$activeOnly;

        $where = [];
        if ($activeOnly) $where[] = "is_active = 1";
        if ($q !== '') $where[] = "(code LIKE :q OR name LIKE :q)";
        $w = count($where) ? ("WHERE " . implode(" AND ", $where)) : "";

        $sql = "SELECT * FROM {$this->table} {$w} ORDER BY sort_order ASC, code ASC";
        $this->db->query($sql);
        if ($q !== '') $this->db->bind(':q', '%' . $q . '%');
        return $this->db->resultSet();
    }

    public function create($data, $userId = null) {
        // $this->ensureSchema();
        $code = strtoupper(trim((string)($data['code'] ?? '')));
        $name = trim((string)($data['name'] ?? ''));
        $rate = (float)($data['rate_percent'] ?? $data['rate'] ?? 0);
        $applyOn = trim((string)($data['apply_on'] ?? 'base'));
        $sort = (int)($data['sort_order'] ?? 100);
        $active = isset($data['is_active']) ? ((int)$data['is_active'] ? 1 : 0) : 1;

        if ($code === '' || $name === '') return false;
        if (!in_array($applyOn, ['base', 'base_plus_previous'], true)) $applyOn = 'base';

        $this->db->query("
            INSERT INTO {$this->table}
            (code, name, rate_percent, apply_on, sort_order, is_active, created_by, updated_by)
            VALUES (:code, :name, :rate, :apply_on, :sort_order, :is_active, :c, :u)
        ");
        $this->db->bind(':code', $code);
        $this->db->bind(':name', $name);
        $this->db->bind(':rate', $rate);
        $this->db->bind(':apply_on', $applyOn);
        $this->db->bind(':sort_order', $sort);
        $this->db->bind(':is_active', $active);
        $this->db->bind(':c', $userId);
        $this->db->bind(':u', $userId);
        return $this->db->execute();
    }

    public function update($id, $data, $userId = null) {
        // $this->ensureSchema();
        $tid = (int)$id;
        if ($tid <= 0) return false;

        $code = strtoupper(trim((string)($data['code'] ?? '')));
        $name = trim((string)($data['name'] ?? ''));
        $rate = (float)($data['rate_percent'] ?? $data['rate'] ?? 0);
        $applyOn = trim((string)($data['apply_on'] ?? 'base'));
        $sort = (int)($data['sort_order'] ?? 100);
        $active = isset($data['is_active']) ? ((int)$data['is_active'] ? 1 : 0) : 1;

        if ($code === '' || $name === '') return false;
        if (!in_array($applyOn, ['base', 'base_plus_previous'], true)) $applyOn = 'base';

        $this->db->query("
            UPDATE {$this->table}
            SET code = :code,
                name = :name,
                rate_percent = :rate,
                apply_on = :apply_on,
                sort_order = :sort_order,
                is_active = :is_active,
                updated_by = :u
            WHERE id = :id
        ");
        $this->db->bind(':code', $code);
        $this->db->bind(':name', $name);
        $this->db->bind(':rate', $rate);
        $this->db->bind(':apply_on', $applyOn);
        $this->db->bind(':sort_order', $sort);
        $this->db->bind(':is_active', $active);
        $this->db->bind(':u', $userId);
        $this->db->bind(':id', $tid);
        return $this->db->execute();
    }

    public function getByIds($ids) {
        // $this->ensureSchema();
        if (empty($ids)) return [];
        $ids = array_map('intval', $ids);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $this->db->query("SELECT * FROM {$this->table} WHERE id IN ($placeholders) AND is_active = 1 ORDER BY sort_order ASC");
        foreach ($ids as $i => $id) {
            $this->db->bind($i + 1, $id);
        }
        return $this->db->resultSet();
    }

    public function delete($id) {
        // $this->ensureSchema();
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', (int)$id);
        return $this->db->execute();
    }
}

