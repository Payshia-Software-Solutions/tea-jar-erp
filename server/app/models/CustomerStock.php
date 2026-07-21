<?php
/**
 * Customer Stock Model
 */
class CustomerStock extends Model {
    private $table = 'customer_stocks';
    private $db_ref;

    public function __construct() {
        $this->db_ref = new Database();
        $this->db = $this->db_ref;
    }

    public function createFromInvoice($invoiceId, $customerId) {
        // Find stock movements for this invoice that have batch information
        $this->db->query("
            SELECT sm.part_id, sm.batch_id, sm.qty_change, sm.notes,
                   b.batch_number, b.expiry_date,
                   p.part_name as description
            FROM stock_movements sm
            JOIN parts p ON p.id = sm.part_id
            LEFT JOIN inventory_batches b ON sm.batch_id = b.id
            WHERE sm.ref_table = 'invoices' AND sm.ref_id = :invoice_id AND sm.batch_id IS NOT NULL
        ");
        $this->db->bind(':invoice_id', $invoiceId);
        $movements = $this->db->resultSet();

        foreach ($movements as $mov) {
            // qty_change is usually negative for a sale, so we take absolute value to record stock given to customer
            $qty = abs((float)$mov->qty_change);
            if ($qty > 0) {
                $this->db->query("
                    INSERT INTO customer_stocks (
                        customer_id, invoice_id, item_id, item_description,
                        batch_number, quantity, expire_date
                    ) VALUES (
                        :customer_id, :invoice_id, :item_id, :item_description,
                        :batch_number, :quantity, :expire_date
                    )
                ");
                $this->db->bind(':customer_id', $customerId);
                $this->db->bind(':invoice_id', $invoiceId);
                $this->db->bind(':item_id', $mov->part_id);
                $this->db->bind(':item_description', $mov->description);
                $this->db->bind(':batch_number', $mov->batch_number);
                $this->db->bind(':quantity', $qty);
                $this->db->bind(':expire_date', $mov->expiry_date);
                $this->db->execute();
            }
        }
    }

    public function getByCustomerId($customerId) {
        $this->db->query("
            SELECT cs.*, i.invoice_no 
            FROM customer_stocks cs
            LEFT JOIN invoices i ON cs.invoice_id = i.id
            WHERE cs.customer_id = :customer_id
            ORDER BY cs.expire_date ASC, cs.created_at DESC
        ");
        $this->db->bind(':customer_id', $customerId);
        return $this->db->resultSet();
    }

    public function update($id, $data) {
        $sets = [];
        if (isset($data['quantity'])) $sets[] = "quantity = :quantity";
        if (isset($data['sold_qty'])) $sets[] = "sold_qty = :sold_qty";
        if (isset($data['expire_date'])) $sets[] = "expire_date = :expire_date";
        if (isset($data['batch_number'])) $sets[] = "batch_number = :batch_number";

        if (empty($sets)) return true;

        $this->db->query("UPDATE customer_stocks SET " . implode(", ", $sets) . " WHERE id = :id");

        if (isset($data['quantity'])) $this->db->bind(':quantity', $data['quantity']);
        if (isset($data['sold_qty'])) $this->db->bind(':sold_qty', $data['sold_qty']);
        if (isset($data['expire_date'])) $this->db->bind(':expire_date', $data['expire_date']);
        if (isset($data['batch_number'])) $this->db->bind(':batch_number', $data['batch_number']);
        $this->db->bind(':id', $id);
        
        return $this->db->execute();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM customer_stocks WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
