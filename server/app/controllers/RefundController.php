<?php
/**
 * RefundController
 */
class RefundController extends Controller {
    private $refundModel;
    private $auditModel;

    public function __construct() {
        // Ensure database tables exist
        require_once '../app/helpers/SalesReturnSchema.php';
        SalesReturnSchema::ensure();

        $this->refundModel = $this->model('Refund');
        $this->auditModel = $this->model('AuditLog');
    }

    public function create() {
        $u = $this->requirePermission('pos.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        $data['userId'] = $u['sub'];
        $data['location_id'] = $data['location_id'] ?? $this->currentLocationId($u);

        if (empty($data['invoice_id']) || empty($data['amount'])) {
            $this->error('Invoice ID and amount required', 400);
            return;
        }

        try {
            $result = $this->refundModel->create($data);
            if ($result && isset($result['id'])) {
                $refundId = $result['id'];
                $refundNo = $result['refund_no'];
                
                $this->auditModel->write([
                    'user_id' => (int)$u['sub'],
                    'action' => 'create',
                    'entity' => 'refund',
                    'entity_id' => (int)$refundId,
                    'method' => 'POST',
                    'path' => $_SERVER['REQUEST_URI'] ?? '',
                    'details' => json_encode(['invoice_id' => $data['invoice_id'], 'amount' => $data['amount'], 'refund_no' => $refundNo]),
                ]);
                $this->success(['id' => $refundId, 'refund_no' => $refundNo], 'Refund processed successfully');
            } else {
                $this->error('Failed to process refund');
            }
        } catch (Exception $e) {
            $this->error($e->getMessage(), 400);
        }
    }

    public function unrefunded() {
        $this->requirePermission('pos.read');
        $locationId = $_GET['location_id'] ?? null;
        
        $db = new Database();
        $sql = "
            SELECT sr.id, sr.return_no, sr.return_date, sr.total_amount, i.invoice_no, 
                   COALESCE(c_i.name, c_sr.name) as customer_name, sr.reason
            FROM sales_returns sr
            LEFT JOIN invoices i ON sr.invoice_id = i.id
            LEFT JOIN customers c_i ON i.customer_id = c_i.id
            LEFT JOIN customers c_sr ON sr.customer_id = c_sr.id
            WHERE (SELECT COUNT(*) FROM refunds WHERE return_id = sr.id) = 0
        ";
        if ($locationId) {
            $sql .= " AND sr.location_id = :location_id";
        }
        $sql .= " ORDER BY sr.created_at DESC LIMIT 50";
        
        $db->query($sql);
        if ($locationId) {
            $db->bind(':location_id', (int)$locationId);
        }
        $list = $db->resultSet();
        $this->success($list);
    }

    public function index() {
        $this->requirePermission('pos.read');
        $filters = [
            'location_id' => $_GET['location_id'] ?? null,
            'invoice_no' => $_GET['invoice_no'] ?? null
        ];
        $refunds = $this->refundModel->getAll($filters);
        $this->success($refunds);
    }

    public function invoice($invoiceId = null) {
        $this->requirePermission('pos.read');
        if (!$invoiceId) {
            $this->error('Invoice ID required', 400);
            return;
        }
        $refunds = $this->refundModel->getByInvoice($invoiceId);
        $this->success($refunds);
    }
    public function return_lookup($returnNo = null) {
        $this->requirePermission('pos.read');
        if (!$returnNo) {
            $this->error('Return Number required', 400);
            return;
        }

        $db = new Database();
        $db->query("
            SELECT sr.*, i.invoice_no, c.id as customer_id, c.name as customer_name,
                   (SELECT COUNT(*) FROM refunds WHERE return_id = sr.id) as refund_count
            FROM sales_returns sr
            JOIN invoices i ON sr.invoice_id = i.id
            JOIN customers c ON i.customer_id = c.id
            WHERE sr.return_no = :no
            LIMIT 1
        ");
        $db->bind(':no', $returnNo);
        $ret = $db->single();

        if (!$ret) {
            $this->error('Return not found', 404);
            return;
        }

        // Get Return Items
        $db->query("SELECT * FROM sales_return_items WHERE return_id = :rid");
        $db->bind(':rid', $ret->id);
        $items = $db->resultSet();

        $this->success([
            'return' => $ret,
            'items' => $items,
            'is_refunded' => (int)$ret->refund_count > 0
        ]);
    }

    public function print_data($id = null) {
        $this->requirePermission('pos.read');
        $db = new Database();
        
        $refundId = $id ?? ($_GET['id'] ?? null);
        if (!$refundId) {
            $this->error('Refund ID required', 400);
            return;
        }

        // Get Refund with related metadata
        $db->query("
            SELECT r.*, sr.return_no, i.invoice_no, c.name as customer_name, sl.name as location_name
            FROM refunds r
            LEFT JOIN sales_returns sr ON r.return_id = sr.id
            JOIN invoices i ON r.invoice_id = i.id
            JOIN customers c ON i.customer_id = c.id
            LEFT JOIN service_locations sl ON i.location_id = sl.id
            WHERE r.id = :id
        ");
        $db->bind(':id', $refundId);
        $refund = $db->single();

        if (!$refund) {
            $this->error('Refund record not found', 404);
            return;
        }

        $this->success($refund);
    }
}
