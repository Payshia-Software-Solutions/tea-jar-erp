<?php
/**
 * VehicleDocument Model
 */
class VehicleDocument extends Model {
    private $table = 'vehicle_documents';

    public function getByVehicle($vehicleId, $status = 'Active') {
        $sql = "SELECT * FROM {$this->table} WHERE vehicle_id = :vehicle_id";
        if ($status) {
            $sql .= " AND status = :status";
        }
        $sql .= " ORDER BY created_at DESC";
        
        $this->db->query($sql);
        $this->db->bind(':vehicle_id', $vehicleId);
        if ($status) {
            $this->db->bind(':status', $status);
        }
        return $this->db->resultSet();
    }

    public function archiveByInfo($vehicleId, $type) {
        $this->db->query("UPDATE {$this->table} SET status = 'Archived' WHERE vehicle_id = :vid AND document_type = :type AND status = 'Active'");
        $this->db->bind(':vid', $vehicleId);
        $this->db->bind(':type', $type);
        return $this->db->execute();
    }

    public function create($data) {
        $this->db->query("
            INSERT INTO {$this->table} (vehicle_id, document_type, document_number, file_path, expiry_date)
            VALUES (:vehicle_id, :document_type, :document_number, :file_path, :expiry_date)
        ");
        $this->db->bind(':vehicle_id', $data['vehicle_id']);
        $this->db->bind(':document_type', $data['document_type']);
        $this->db->bind(':document_number', $data['document_number'] ?? null);
        $this->db->bind(':file_path', $data['file_path'] ?? null);
        $this->db->bind(':expiry_date', $data['expiry_date']);
        return $this->db->execute();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    /**
     * Get documents that are expiring within a certain number of days
     */
    public function getExpiring($days = 30) {
        $this->db->query("
            SELECT d.*, v.make, v.model, v.vin
            FROM {$this->table} d
            JOIN vehicles v ON d.vehicle_id = v.id
            WHERE d.expiry_date <= DATE_ADD(CURDATE(), INTERVAL :days DAY)
              AND d.expiry_date >= CURDATE()
            ORDER BY d.expiry_date ASC
        ");
        $this->db->bind(':days', $days);
        return $this->db->resultSet();
    }
}
