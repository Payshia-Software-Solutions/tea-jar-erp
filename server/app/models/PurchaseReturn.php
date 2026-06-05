<?php
/**
 * PurchaseReturn Model
 */
class PurchaseReturn extends Model {
    private $table = 'acc_purchase_returns';

    public function __construct() {
        parent::__construct();
        AccountingSchema::ensure();
    }

    public function create($data) {
        try {
            $this->db->beginTransaction();

            $this->db->query("
                INSERT INTO {$this->table} (grn_id, supplier_id, return_date, subtotal, tax_total, total_amount, reason, created_by)
                VALUES (:grn_id, :supplier_id, :return_date, :subtotal, :tax_total, :total_amount, :reason, :created_by)
            ");
            $this->db->bind(':grn_id', $data['grn_id'] ?? null);
            $this->db->bind(':supplier_id', $data['supplier_id']);
            $this->db->bind(':return_date', $data['return_date'] ?? date('Y-m-d'));
            $this->db->bind(':subtotal', $data['subtotal'] ?? $data['total_amount']);
            $this->db->bind(':tax_total', $data['tax_total'] ?? 0);
            $this->db->bind(':total_amount', $data['total_amount']);
            $this->db->bind(':reason', $data['reason'] ?? null);
            $this->db->bind(':created_by', $data['userId']);
            $this->db->execute();

            $returnId = $this->db->lastInsertId();

            foreach ($data['items'] as $item) {
                // Adjust Stock (Decrease)
                $this->db->query("UPDATE parts SET stock_quantity = stock_quantity - :qty WHERE id = :pid");
                $this->db->bind(':qty', $item['quantity']);
                $this->db->bind(':pid', $item['part_id']);
                $this->db->execute();

                // Log Movement
                $this->db->query("
                    INSERT INTO stock_movements (part_id, qty_change, movement_type, ref_table, ref_id, unit_cost, notes, created_by)
                    VALUES (:pid, :qty, 'PURCHASE_RETURN', 'acc_purchase_returns', :rid, :cost, :notes, :uid)
                ");
                $this->db->bind(':pid', $item['part_id']);
                $this->db->bind(':qty', -$item['quantity']);
                $this->db->bind(':rid', $returnId);
                $this->db->bind(':cost', $item['unit_cost']);
                $this->db->bind(':notes', 'Purchase Return ID: ' . $returnId);
                $this->db->bind(':uid', $data['userId']);
                $this->db->execute();

                // Insert Item
                $this->db->query("
                    INSERT INTO acc_purchase_return_items (return_id, part_id, quantity, unit_cost, line_total)
                    VALUES (:rid, :pid, :qty, :cost, :total)
                ");
                $this->db->bind(':rid', $returnId);
                $this->db->bind(':pid', $item['part_id']);
                $this->db->bind(':qty', $item['quantity']);
                $this->db->bind(':cost', $item['unit_cost']);
                $this->db->bind(':total', $item['line_total']);
                $this->db->execute();
            }

            // Automated Accounting
            require_once '../app/helpers/AccountingHelper.php';
            AccountingHelper::postPurchaseReturn($returnId, $data);

            $this->db->commit();
            return $returnId;
        } catch (Exception $e) {
            try { $this->db->rollBack(); } catch (Exception $e2) {}
            error_log("PurchaseReturn Error: " . $e->getMessage());
            return false;
        }
    }

    public function list($filters = []) {
        $sql = "SELECT r.*, s.name as supplier_name, 
                (SELECT COUNT(*) FROM acc_purchase_return_items WHERE return_id = r.id) as item_count
                FROM {$this->table} r
                JOIN suppliers s ON r.supplier_id = s.id
                WHERE 1=1";
        
        if (!empty($filters['supplier_id'])) $sql .= " AND r.supplier_id = :sid";
        if (!empty($filters['from_date'])) $sql .= " AND r.return_date >= :from";
        if (!empty($filters['to_date'])) $sql .= " AND r.return_date <= :to";
        
        $sql .= " ORDER BY r.return_date DESC, r.id DESC";
        
        $this->db->query($sql);
        if (!empty($filters['supplier_id'])) $this->db->bind(':sid', $filters['supplier_id']);
        if (!empty($filters['from_date'])) $this->db->bind(':from', $filters['from_date']);
        if (!empty($filters['to_date'])) $this->db->bind(':to', $filters['to_date']);
        
        return $this->db->resultSet();
    }
}
