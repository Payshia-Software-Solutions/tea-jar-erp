<?php
class Bank extends Model {
    public function ensureSchema() { return;
        require_once __DIR__ . '/../helpers/BankSchema.php';
        BankSchema::ensure();
        return true;
    }

    public function getAll($activeOnly = false) {
        $sql = "SELECT * FROM banks";
        if ($activeOnly) $sql .= " WHERE is_active = 1";
        $sql .= " ORDER BY name ASC";
        $this->db->query($sql);
        return $this->db->resultSet();
    }

    public function getById($id) {
        $this->db->query("SELECT * FROM banks WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function create($data) {
        $this->db->query("INSERT INTO banks (name, code, is_active) VALUES (:name, :code, :active)");
        $this->db->bind(':name',   $data['name']);
        $this->db->bind(':code',   $data['code'] ?? null);
        $this->db->bind(':active', $data['is_active'] ?? 1);
        return $this->db->execute();
    }

    public function update($id, $data) {
        $this->db->query("UPDATE banks SET name = :name, code = :code, is_active = :active WHERE id = :id");
        $this->db->bind(':name',   $data['name']);
        $this->db->bind(':code',   $data['code'] ?? null);
        $this->db->bind(':active', $data['is_active'] ?? 1);
        $this->db->bind(':id',     $id);
        return $this->db->execute();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM banks WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function syncFromInternet() {
        $banksUrl = 'https://github.com/samma89/Sri-Lanka-Bank-and-Branch-List/raw/refs/heads/master/banks.json';
        $branchesUrl = 'https://github.com/samma89/Sri-Lanka-Bank-and-Branch-List/raw/refs/heads/master/branches.json';

        $banksJson = @file_get_contents($banksUrl);
        $branchesJson = @file_get_contents($branchesUrl);

        if (!$banksJson || !$branchesJson) {
            throw new Exception("Failed to download bank data from the internet.");
        }

        $banks = json_decode($banksJson, true);
        $branchesByBank = json_decode($branchesJson, true);

        if (!$banks || !$branchesByBank) {
            throw new Exception("Failed to parse bank data.");
        }

        $count = 0;
        foreach ($banks as $bankData) {
            $bankIdInJson = $bankData['ID'];
            $bankName = $bankData['name'];
            
            // Check if bank exists (by name or code)
            $this->db->query("SELECT id FROM banks WHERE name = :name OR code = :code");
            $this->db->bind(':name', $bankName);
            $this->db->bind(':code', (string)$bankIdInJson);
            $existingBank = $this->db->single();
            
            if ($existingBank) {
                $bankDbId = $existingBank->id;
                // Update code if missing
                $this->db->query("UPDATE banks SET code = :code WHERE id = :id");
                $this->db->bind(':code', (string)$bankIdInJson);
                $this->db->bind(':id', $bankDbId);
                $this->db->execute();
            } else {
                $this->db->query("INSERT INTO banks (name, code) VALUES (:name, :code)");
                $this->db->bind(':name', $bankName);
                $this->db->bind(':code', (string)$bankIdInJson);
                $this->db->execute();
                $bankDbId = $this->db->lastInsertId();
            }
            
            if (isset($branchesByBank[(string)$bankIdInJson])) {
                $branchList = $branchesByBank[(string)$bankIdInJson];
                foreach ($branchList as $branchData) {
                    $branchName = $branchData['name'];
                    $branchCode = (string)$branchData['ID'];
                    $branchCode = str_pad($branchCode, 3, '0', STR_PAD_LEFT);
                    
                    // Check if branch exists for this bank
                    $this->db->query("SELECT id FROM bank_branches WHERE bank_id = :bid AND (branch_name = :bn OR branch_code = :bc)");
                    $this->db->bind(':bid', $bankDbId);
                    $this->db->bind(':bn', $branchName);
                    $this->db->bind(':bc', $branchCode);
                    if (!$this->db->single()) {
                        $this->db->query("INSERT INTO bank_branches (bank_id, branch_name, branch_code) VALUES (:bid, :bn, :bc)");
                        $this->db->bind(':bid', $bankDbId);
                        $this->db->bind(':bn', $branchName);
                        $this->db->bind(':bc', $branchCode);
                        $this->db->execute();
                        $count++;
                    }
                }
            }
        }
        return $count;
    }
}
