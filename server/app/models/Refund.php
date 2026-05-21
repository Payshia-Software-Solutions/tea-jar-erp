<?php
/**
 * Refund Model
 */
class Refund extends Model {
    private $table = 'refunds';

    public function create($data) {
        // Validation: Prevent duplicate refunds for the same return
        if (!empty($data['return_id'])) {
            $this->db->query("SELECT id FROM refunds WHERE return_id = :rid");
            $this->db->bind(':rid', $data['return_id']);
            if ($this->db->single()) {
                throw new Exception("A refund has already been processed for this return.");
            }
        }

        $refundData = $this->generateRefundNo($data['location_id'] ?? 1);
        $refundNo = $refundData['refund_no'];

        $this->db->query("
            INSERT INTO refunds (
                refund_no, return_id, invoice_id, location_id, amount, payment_method, reference_no, refund_date, notes, created_by
            ) VALUES (
                :refund_no, :return_id, :invoice_id, :location_id, :amount, :payment_method, :reference_no, :refund_date, :notes, :created_by
            )
        ");
        $this->db->bind(':refund_no', $refundNo);
        $this->db->bind(':return_id', $data['return_id'] ?? null);
        $this->db->bind(':invoice_id', $data['invoice_id'] ?? null);
        $this->db->bind(':location_id', $data['location_id'] ?? 1);
        $this->db->bind(':amount', $data['amount']);
        $this->db->bind(':payment_method', $data['payment_method'] ?? 'Cash');
        $this->db->bind(':reference_no', $data['reference_no'] ?? null);
        $this->db->bind(':refund_date', $data['refund_date'] ?? date('Y-m-d'));
        $this->db->bind(':notes', $data['notes'] ?? null);
        $this->db->bind(':created_by', $data['userId']);

        if ($this->db->execute()) {
            return ['id' => $this->db->lastInsertId(), 'refund_no' => $refundNo];
        }
        return false;
    }

    public function generateRefundNo($locationId = 1) {
        require_once __DIR__ . '/../helpers/DocumentSequenceHelper.php';
        $refundNo = DocumentSequenceHelper::getStandardDocNo('REF', $locationId);
        return ['refund_no' => $refundNo];
    }

    public function getAll($filters = []) {
        $sql = "
            SELECT r.*, COALESCE(r.refund_no, CONCAT('REF-', LPAD(r.id, 5, '0'))) as refund_no_display, i.invoice_no, 
                   COALESCE(c_i.name, c_sr.name) as customer_name, sr.return_no
            FROM refunds r
            LEFT JOIN invoices i ON r.invoice_id = i.id
            LEFT JOIN sales_returns sr ON r.return_id = sr.id
            LEFT JOIN customers c_i ON i.customer_id = c_i.id
            LEFT JOIN customers c_sr ON sr.customer_id = c_sr.id
            WHERE 1=1
        ";

        if (!empty($filters['location_id'])) {
            $sql .= " AND r.location_id = :location_id";
        }
        if (!empty($filters['invoice_no'])) {
            $sql .= " AND i.invoice_no LIKE :inv";
        }

        $sql .= " ORDER BY r.created_at DESC";

        $this->db->query($sql);
        if (!empty($filters['location_id'])) $this->db->bind(':location_id', (int)$filters['location_id']);
        if (!empty($filters['invoice_no'])) $this->db->bind(':inv', '%' . $filters['invoice_no'] . '%');

        return $this->db->resultSet();
    }

    public function getByInvoice($invoiceId) {
        $this->db->query("SELECT * FROM refunds WHERE invoice_id = :id ORDER BY refund_date DESC");
        $this->db->bind(':id', $invoiceId);
        return $this->db->resultSet();
    }
}
