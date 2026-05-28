<?php
class BankBranch extends Model {
    public function ensureSchema() { return;
        require_once __DIR__ . '/../helpers/BankSchema.php';
        BankSchema::ensure();
        return true;
    }

    public function getByBank($bankId, $activeOnly = false) {
        $sql = "SELECT * FROM bank_branches WHERE bank_id = :bank_id";
        if ($activeOnly) $sql .= " AND is_active = 1";
        $sql .= " ORDER BY branch_name ASC";
        $this->db->query($sql);
        $this->db->bind(':bank_id', $bankId);
        return $this->db->resultSet();
    }

    public function create($data) {
        $this->db->query("INSERT INTO bank_branches (bank_id, branch_name, branch_code, is_active) VALUES (:bank_id, :name, :code, :active)");
        $this->db->bind(':bank_id', $data['bank_id']);
        $this->db->bind(':name',    $data['branch_name']);
        $this->db->bind(':code',    $data['branch_code'] ?? null);
        $this->db->bind(':active',  $data['is_active'] ?? 1);
        return $this->db->execute();
    }

    public function update($id, $data) {
        $this->db->query("UPDATE bank_branches SET bank_id = :bank_id, branch_name = :name, branch_code = :code, is_active = :active WHERE id = :id");
        $this->db->bind(':bank_id', $data['bank_id']);
        $this->db->bind(':name',    $data['branch_name']);
        $this->db->bind(':code',    $data['branch_code'] ?? null);
        $this->db->bind(':active',  $data['is_active'] ?? 1);
        $this->db->bind(':id',      $id);
        return $this->db->execute();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM bank_branches WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
