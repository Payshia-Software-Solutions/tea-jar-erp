<?php
/**
 * Inquiry Model
 */
class Inquiry extends Model {
    private $table = 'crm_inquiries';

    public function __construct() {
        parent::__construct();
        // // // // // $this->ensureSchema();
    }

    public function ensureSchema() { return;
        require_once '../app/helpers/CRMSchema.php';
        CRMSchema::ensure();
    }

    public function getAll($filters = []) {
        $sql = "
            SELECT i.*, 
                   (SELECT COUNT(*) FROM crm_inquiry_items WHERE inquiry_id = i.id) as item_count,
                   (SELECT COUNT(*) FROM crm_inquiry_logs WHERE inquiry_id = i.id) as log_count
            FROM {$this->table} i 
            WHERE 1=1
        ";
        
        if (!empty($filters['status'])) {
            $sql .= " AND i.status = :status";
        }
        if (!empty($filters['inquiry_type'])) {
            $sql .= " AND i.inquiry_type = :inquiry_type";
        }
        if (!empty($filters['source'])) {
            $sql .= " AND i.source = :source";
        }
        
        $sql .= " ORDER BY i.created_at DESC";

        $this->db->query($sql);
        if (!empty($filters['status'])) $this->db->bind(':status', $filters['status']);
        if (!empty($filters['inquiry_type'])) $this->db->bind(':inquiry_type', $filters['inquiry_type']);
        if (!empty($filters['source'])) $this->db->bind(':source', $filters['source']);

        return $this->db->resultSet();
    }

    public function getById($id) {
        $this->db->query("SELECT * FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        $inquiry = $this->db->single();
        if ($inquiry) {
            $inquiry->items = $this->getItems($id);
            $inquiry->logs = $this->getLogs($id);
        }
        return $inquiry;
    }

    public function getItems($inquiryId) {
        $this->db->query("SELECT * FROM crm_inquiry_items WHERE inquiry_id = :inquiry_id");
        $this->db->bind(':inquiry_id', $inquiryId);
        return $this->db->resultSet();
    }

    public function getLogs($inquiryId) {
        $this->db->query("
            SELECT l.*, u.name as user_name 
            FROM crm_inquiry_logs l
            LEFT JOIN users u ON u.id = l.created_by
            WHERE l.inquiry_id = :inquiry_id 
            ORDER BY l.created_at DESC
        ");
        $this->db->bind(':inquiry_id', $inquiryId);
        return $this->db->resultSet();
    }

    public function addLog($inquiryId, $action, $notes, $userId) {
        $this->db->query("
            INSERT INTO crm_inquiry_logs (inquiry_id, action, notes, created_by)
            VALUES (:inquiry_id, :action, :notes, :created_by)
        ");
        $this->db->bind(':inquiry_id', $inquiryId);
        $this->db->bind(':action', $action);
        $this->db->bind(':notes', $notes);
        $this->db->bind(':created_by', $userId);
        return $this->db->execute();
    }

    public function updateConvertedTo($id, $type, $targetId) {
        $this->db->query("
            UPDATE {$this->table} SET 
                status = 'Converted',
                converted_to_type = :type,
                converted_to_id = :targetId
            WHERE id = :id
        ");
        $this->db->bind(':type', $type);
        $this->db->bind(':targetId', $targetId);
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function create($data) {
        // Generate Inquiry Number
        $inquiryNo = $this->generateInquiryNumber($data['location_id'] ?? 1);
        
        $this->db->query("
            INSERT INTO {$this->table} (
                inquiry_number, customer_id, customer_name, phone, email, 
                source, inquiry_type, status, assigned_to, requirements, notes,
                converted_to_type, converted_to_id,
                created_by, updated_by
            ) VALUES (
                :inquiry_number, :customer_id, :customer_name, :phone, :email, 
                :source, :inquiry_type, :status, :assigned_to, :requirements, :notes,
                :converted_to_type, :converted_to_id,
                :created_by, :updated_by
            )
        ");
        
        $this->db->bind(':inquiry_number', $inquiryNo);
        $this->db->bind(':customer_id', $data['customer_id'] ?? null);
        $this->db->bind(':customer_name', $data['customer_name']);
        $this->db->bind(':phone', $data['phone'] ?? null);
        $this->db->bind(':email', $data['email'] ?? null);
        $this->db->bind(':source', $data['source'] ?? 'Direct');
        $this->db->bind(':inquiry_type', $data['inquiry_type'] ?? 'General');
        $this->db->bind(':status', $data['status'] ?? 'New');
        $this->db->bind(':assigned_to', $data['assigned_to'] ?? null);
        $this->db->bind(':requirements', $data['requirements'] ?? null);
        $this->db->bind(':notes', $data['notes'] ?? null);
        $this->db->bind(':converted_to_type', $data['converted_to_type'] ?? null);
        $this->db->bind(':converted_to_id', $data['converted_to_id'] ?? null);
        $this->db->bind(':created_by', $data['userId']);
        $this->db->bind(':updated_by', $data['userId']);

        if ($this->db->execute()) {
            $inquiryId = $this->db->lastInsertId();
            if (!empty($data['items'])) {
                $this->addItems($inquiryId, $data['items']);
            }
            return $inquiryId;
        }
        return false;
    }

    public function update($id, $data) {
        $this->db->query("
            UPDATE {$this->table} SET 
                customer_id = :customer_id,
                customer_name = :customer_name,
                phone = :phone,
                email = :email,
                source = :source,
                inquiry_type = :inquiry_type,
                status = :status,
                assigned_to = :assigned_to,
                requirements = :requirements,
                notes = :notes,
                converted_to_type = :converted_to_type,
                converted_to_id = :converted_to_id,
                updated_by = :updated_by
            WHERE id = :id
        ");
        
        $this->db->bind(':customer_id', $data['customer_id'] ?? null);
        $this->db->bind(':customer_name', $data['customer_name']);
        $this->db->bind(':phone', $data['phone'] ?? null);
        $this->db->bind(':email', $data['email'] ?? null);
        $this->db->bind(':source', $data['source'] ?? 'Direct');
        $this->db->bind(':inquiry_type', $data['inquiry_type'] ?? 'General');
        $this->db->bind(':status', $data['status'] ?? 'New');
        $this->db->bind(':assigned_to', $data['assigned_to'] ?? null);
        $this->db->bind(':requirements', $data['requirements'] ?? null);
        $this->db->bind(':notes', $data['notes'] ?? null);
        $this->db->bind(':converted_to_type', $data['converted_to_type'] ?? null);
        $this->db->bind(':converted_to_id', $data['converted_to_id'] ?? null);
        $this->db->bind(':updated_by', $data['userId']);
        $this->db->bind(':id', $id);

        if ($this->db->execute()) {
            $this->db->query("DELETE FROM crm_inquiry_items WHERE inquiry_id = :id");
            $this->db->bind(':id', $id);
            $this->db->execute();

            if (!empty($data['items'])) {
                $this->addItems($id, $data['items']);
            }
            return true;
        }
        return false;
    }

    public function addItems($inquiryId, $items) {
        foreach ($items as $item) {
            $this->db->query("
                INSERT INTO crm_inquiry_items (inquiry_id, item_id, description, quantity, unit_price)
                VALUES (:inquiry_id, :item_id, :description, :quantity, :unit_price)
            ");
            $itemId = (!empty($item['item_id']) && $item['item_id'] !== 'none') ? $item['item_id'] : null;
            $this->db->bind(':inquiry_id', $inquiryId);
            $this->db->bind(':item_id', $itemId);
            $this->db->bind(':description', $item['description'] ?? '');
            $this->db->bind(':quantity', $item['quantity'] ?? 1);
            $this->db->bind(':unit_price', $item['unit_price'] ?? 0);
            $this->db->execute();
        }
        return true;
    }

    public function delete($id) {
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    private function generateInquiryNumber($locationId = 1) {
        require_once '../app/helpers/DocumentSequenceHelper.php';
        return DocumentSequenceHelper::getStandardDocNo('INQ', $locationId);
    }

    public function unlinkConvertedTo($id) {
        $this->db->query("
            UPDATE {$this->table} SET 
                status = 'Qualified',
                converted_to_type = NULL,
                converted_to_id = NULL
            WHERE id = :id
        ");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
