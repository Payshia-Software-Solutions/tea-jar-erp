<?php
class PaymentreceiptController extends Controller {
    private $model;

    public function __construct() {
        $this->model = new PaymentReceipt();
    }

    // POST /api/paymentreceipt/migrate — create tables
    public function migrate() {
        $this->requirePermission('invoices.write'); // Or settings.write
        try {
            $this->model->ensureSchema();
            $this->json(['status' => 'success', 'message' => 'Payment receipt tables ready.']);
        } catch (Exception $e) {
            $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // POST /api/paymentreceipt/create
    public function create() {
        $u = $this->requirePermission('payments.write');
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        if (empty($data['invoice_id']) || empty($data['amount']) || empty($data['payment_date'])) {
            $this->json(['status' => 'error', 'message' => 'invoice_id, amount, payment_date required.'], 422);
            return;
        }

        // Enrich with logged-in user
        $data['created_by'] = $u['sub'] ?? null;

        $receiptNo = $this->model->create($data);

        if ($receiptNo) {
            $this->json(['status' => 'success', 'receipt_no' => $receiptNo]);
        } else {
            $this->json(['status' => 'error', 'message' => 'Failed to record payment.'], 500);
        }
    }

    // GET /api/paymentreceipt/invoice/:invoiceId
    public function invoice($invoiceId = null) {
        $this->requirePermission('payments.read');
        if (!$invoiceId) { $this->json(['status' => 'error', 'message' => 'Missing invoice ID'], 422); return; }
        $receipts = $this->model->getByInvoice($invoiceId);
        $this->json(['status' => 'success', 'data' => $receipts]);
    }

    // GET /api/paymentreceipt/details/:id
    public function details($id = null) {
        $this->requirePermission('payments.read');
        if (!$id) { $this->json(['status' => 'error', 'message' => 'Missing ID'], 422); return; }
        $receipt = $this->model->getById($id);
        if (!$receipt) { $this->json(['status' => 'error', 'message' => 'Not found'], 404); return; }
        $this->json(['status' => 'success', 'data' => $receipt]);
    }

    // GET /api/paymentreceipt/list
    public function list() {
        $u = $this->requirePermission('payments.read');
        $filters = [
            'method'      => $_GET['method'] ?? null,
            'from_date'   => $_GET['from_date'] ?? null,
            'to_date'     => $_GET['to_date'] ?? null,
            'customer_id' => $_GET['customer_id'] ?? null,
            'location_id' => (isset($_GET['location_id']) && $_GET['location_id'] === 'all') ? null : ($_GET['location_id'] ?? null),
            'page'        => $_GET['page'] ?? 1,
            'limit'       => $_GET['limit'] ?? 50
        ];
        $data = $this->model->listAll($filters);
        $total = $this->model->countAll($filters);
        $this->json(['status' => 'success', 'data' => $data, 'total' => $total]);
    }

    // GET /api/paymentreceipt/cheques
    public function cheques() {
        $this->requirePermission('payments.read');
        $status = $_GET['status'] ?? null;
        $data = $this->model->listCheques($status);
        $this->json(['status' => 'success', 'data' => $data]);
    }

    // GET /api/paymentreceipt/customercheques/:customerId
    public function customercheques($customerId = null) {
        $this->requirePermission('payments.read');
        if (!$customerId) { $this->json(['status' => 'error', 'message' => 'Missing customer ID'], 422); return; }
        $data = $this->model->listChequesByCustomer($customerId);
        $this->json(['status' => 'success', 'data' => $data]);
    }

    // POST /api/paymentreceipt/chequestatus/:id
    public function chequestatus($chequeId = null) {
        $this->requirePermission('payments.write');
        if (!$chequeId) { $this->json(['status' => 'error', 'message' => 'Missing cheque ID'], 422); return; }
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $ok = $this->model->updateChequeStatus($chequeId, $data['status'] ?? 'Cleared', $data['cleared_date'] ?? null);
        $this->json(['status' => $ok ? 'success' : 'error']);
    }

    public function bulkchequestatus() {
        $this->requirePermission('payments.write');
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($data['ids']) || !is_array($data['ids'])) {
            $this->json(['status' => 'error', 'message' => 'IDs array required'], 422);
            return;
        }
        $ok = $this->model->bulkUpdateChequeStatus($data['ids'], $data['status'] ?? 'Cleared', $data['cleared_date'] ?? null);
        $this->json(['status' => $ok ? 'success' : 'error']);
    }
    // POST /api/paymentreceipt/cancel/:id
    public function cancel($id = null) {
        $u = $this->requirePermission('payments.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->json(['status' => 'error', 'message' => 'Method not allowed'], 405);
            return;
        }
        if (!$id) { $this->json(['status' => 'error', 'message' => 'Missing ID'], 422); return; }

        $input = json_decode(file_get_contents('php://input'), true);
        $reason = $input['reason'] ?? 'Cancelled by user';

        if ($this->model->cancel($id, $reason, $u['sub'])) {
            $this->json(['status' => 'success', 'message' => 'Payment cancelled successfully']);
        } else {
            $this->json(['status' => 'error', 'message' => 'Failed to cancel payment'], 500);
        }
    }
}
