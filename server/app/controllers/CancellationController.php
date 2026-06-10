<?php
/**
 * Cancellation Controller
 * Centralized handling for document lookups and cancellations
 */
class CancellationController extends Controller {
    protected $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function lookup() {
        $type = $_GET['type'] ?? '';
        $number = $_GET['number'] ?? '';

        if (!$type || !$number) {
            $this->error('Type and Number are required');
        }

        $result = null;
        switch ($type) {
            case 'Invoice':
                require_once '../app/models/Invoice.php';
                $query = "SELECT i.id, i.invoice_no as number, c.name, i.grand_total as amount, i.issue_date as date, i.status, i.cancelled_at, i.cancellation_reason 
                                 FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id WHERE i.invoice_no = :num";
                if (is_numeric($number)) $query .= " OR i.id = :num";
                $query .= " LIMIT 1";
                $this->db->query($query);
                $this->db->bind(':num', $number);
                $result = $this->db->single();
                if($result) {
                    $this->db->query("SELECT description, quantity, unit_price, line_total FROM invoice_items WHERE invoice_id = :id");
                    $this->db->bind(':id', $result->id);
                    $result->items = $this->db->resultSet();
                }
                break;

            case 'GRN':
                require_once '../app/models/GoodsReceiveNote.php';
                $query = "SELECT g.id, g.grn_number as number, s.name, g.total_amount as amount, g.received_at as date, g.status, g.cancelled_at, g.cancellation_reason 
                                 FROM goods_receive_notes g LEFT JOIN suppliers s ON g.supplier_id = s.id WHERE g.grn_number = :num";
                if (is_numeric($number)) $query .= " OR g.id = :num";
                $query .= " LIMIT 1";
                $this->db->query($query);
                $this->db->bind(':num', $number);
                $result = $this->db->single();
                if($result) {
                    $this->db->query("SELECT p.part_name as description, i.qty_received as quantity, i.unit_cost as unit_price, (i.qty_received * i.unit_cost) as line_total 
                                     FROM grn_items i JOIN parts p ON i.part_id = p.id WHERE i.grn_id = :id");
                    $this->db->bind(':id', $result->id);
                    $result->items = $this->db->resultSet();
                }
                break;

            case 'Expense':
                require_once '../app/models/Expense.php';
                $query = "SELECT id, voucher_no as number, payee_name as name, amount, payment_date as date, status, cancelled_at, cancellation_reason 
                                 FROM acc_expenses WHERE voucher_no = :num";
                if (is_numeric($number)) $query .= " OR id = :num";
                $query .= " LIMIT 1";
                $this->db->query($query);
                $this->db->bind(':num', $number);
                $result = $this->db->single();
                break;

            case 'PaymentReceipt':
                require_once '../app/models/PaymentReceipt.php';
                $query = "SELECT p.id, p.receipt_no as number, c.name as name, p.amount, p.payment_date as date, p.status, p.cancelled_at, p.cancellation_reason 
                                 FROM payment_receipts p LEFT JOIN customers c ON p.customer_id = c.id WHERE p.receipt_no = :num";
                if (is_numeric($number)) $query .= " OR p.id = :num";
                $query .= " LIMIT 1";
                $this->db->query($query);
                $this->db->bind(':num', $number);
                $result = $this->db->single();
                break;

            case 'VendorPayment':
                require_once '../app/models/SupplierPayment.php';
                $query = "SELECT p.id, p.reference_no as number, s.name, p.amount, p.payment_date as date, p.status, p.cancelled_at, p.cancellation_reason 
                                 FROM acc_supplier_payments p JOIN suppliers s ON p.supplier_id = s.id WHERE p.reference_no = :num";
                if (is_numeric($number)) $query .= " OR p.id = :num";
                $query .= " LIMIT 1";
                $this->db->query($query);
                $this->db->bind(':num', $number);
                $result = $this->db->single();
                break;

            case 'Reservation':
                require_once '../app/models/Reservation.php';
                $query = "SELECT res.id, res.reservation_no as number, c.name, res.total_amount as amount, res.check_in as date, res.status, res.cancelled_at, res.cancellation_reason 
                                 FROM hotel_reservations res JOIN customers c ON res.customer_id = c.id WHERE res.reservation_no = :num";
                if (is_numeric($number)) $query .= " OR res.id = :num";
                $query .= " LIMIT 1";
                $this->db->query($query);
                $this->db->bind(':num', $number);
                $result = $this->db->single();
                break;

            default:
                $this->error('Invalid document type');
        }

        if (!$result) {
            $this->error('Document not found');
        }

        $this->json(['status' => 'success', 'data' => $result]);
    }

    public function process() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method not allowed');
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $type = $input['type'] ?? '';
        $id = $input['id'] ?? '';
        $reason = $input['reason'] ?? '';
        
        $u = $this->requireAuth();
        $userId = $u['sub'];

        if (!$type || !$id || !$reason) {
            $this->error('Type, ID, and Reason are required');
        }

        $success = false;
        switch ($type) {
            case 'Invoice':
                require_once '../app/models/Invoice.php';
                $model = new Invoice();
                $success = $model->cancel($id, $reason, $userId);
                break;
            case 'GRN':
                require_once '../app/models/GoodsReceiveNote.php';
                $model = new GoodsReceiveNote();
                $success = $model->cancel($id, $reason, $userId);
                break;
            case 'Expense':
                require_once '../app/models/Expense.php';
                $model = new Expense();
                $success = $model->cancel($id, $reason, $userId);
                break;
            case 'PaymentReceipt':
                require_once '../app/models/PaymentReceipt.php';
                $model = new PaymentReceipt();
                $success = $model->cancel($id, $reason, $userId);
                break;
            case 'VendorPayment':
                require_once '../app/models/SupplierPayment.php';
                $model = new SupplierPayment();
                $success = $model->cancel($id, $reason, $userId);
                break;
            case 'Reservation':
                require_once '../app/models/Reservation.php';
                $model = new Reservation();
                $success = $model->cancel($id, $reason, $userId);
                break;
            default:
                $this->error('Invalid document type');
        }

        if ($success) {
            $this->json(['status' => 'success', 'message' => 'Document cancelled successfully']);
        } else {
            $this->error('Cancellation failed');
        }
    }

    public function history() {
        $this->requirePermission('accounting.write');
        
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        if ($page < 1) $page = 1;
        $offset = ($page - 1) * $limit;

        $subQueries = [
            "SELECT 'Invoice' as type, invoice_no as number, c.name as party, cancelled_at, cancellation_reason as reason FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id WHERE i.status = 'Cancelled'",
            "SELECT 'GRN' as type, grn_number as number, s.name as party, cancelled_at, cancellation_reason as reason FROM goods_receive_notes g LEFT JOIN suppliers s ON g.supplier_id = s.id WHERE g.status = 'Cancelled'",
            "SELECT 'Expense' as type, voucher_no as number, payee_name as party, cancelled_at, cancellation_reason as reason FROM acc_expenses WHERE status = 'Cancelled'",
            "SELECT 'PaymentReceipt' as type, receipt_no as number, customer_name as party, cancelled_at, cancellation_reason as reason FROM payment_receipts WHERE status = 'Cancelled'",
            "SELECT 'VendorPayment' as type, reference_no as number, s.name as party, cancelled_at, cancellation_reason as reason FROM acc_supplier_payments p LEFT JOIN suppliers s ON p.supplier_id = s.id WHERE p.status = 'Cancelled'",
            "SELECT 'Reservation' as type, res.reservation_no as number, c.name as party, cancelled_at, cancellation_reason as reason FROM hotel_reservations res LEFT JOIN customers c ON res.customer_id = c.id WHERE res.status = 'Cancelled'"
        ];

        $combined = "(" . implode(") UNION ALL (", $subQueries) . ")";
        $sql = "$combined ORDER BY cancelled_at DESC LIMIT :limit OFFSET :offset";
        
        $this->db->query($sql);
        $this->db->bind(':limit', $limit);
        $this->db->bind(':offset', $offset);
        $results = $this->db->resultSet();

        // Total count
        $countSql = "SELECT COUNT(*) as total FROM ($combined) as t";
        $this->db->query($countSql);
        $total = $this->db->single()->total;

        $this->json([
            'status' => 'success', 
            'data' => $results,
            'pagination' => [
                'total' => (int)$total,
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }
}
