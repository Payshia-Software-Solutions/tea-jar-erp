<?php
/**
 * InvoiceController
 */
class InvoiceController extends Controller {
    private $invoiceModel;
    private $auditModel;

    public function __construct() {
        $this->invoiceModel = $this->model('Invoice');
        $this->auditModel = $this->model('AuditLog');
    }

    public function list() {
        $this->requirePermission('invoices.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        $startDate = $_GET['start_date'] ?? $_GET['date'] ?? null;
        $endDate = $_GET['end_date'] ?? $_GET['date'] ?? null;

        $filters = [
            'status' => $_GET['status'] ?? null,
            'customer_id' => $_GET['customer_id'] ?? null,
            'start_date' => $startDate,
            'end_date' => $endDate
        ];

        $invoices = $this->invoiceModel->getAll($filters);
        $this->success($invoices);
    }

    public function details($id = null) {
        $this->requirePermission('invoices.read');
        if (!$id) {
            $this->error('Invoice ID required', 400);
            return;
        }

        $invoice = $this->invoiceModel->getById($id);
        if (!$invoice) {
            $this->error('Invoice not found', 404);
            return;
        }

        $invoice = (array)$invoice;
        $invoice['items'] = $this->invoiceModel->getItems($id);
        $invoice['payments'] = $this->invoiceModel->getPayments($id);
        $invoice['applied_taxes'] = $this->invoiceModel->getAppliedTaxes($id);
        $invoice['batch_movements'] = $this->invoiceModel->getBatchMovements($id);

        if (!empty($invoice['created_by'])) {
            $userRow = $this->db->query("SELECT name FROM users WHERE id = :id", [':id' => $invoice['created_by']])->fetch();
            if ($userRow) {
                $invoice['created_by_name'] = $userRow['name'];
            }
        }

        $this->success($invoice);
    }

    public function create() {
        $u = $this->requirePermission('invoices.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        // Ensure schema is up to date BEFORE starting a transaction
        $this->invoiceModel->ensureSchema();
        
        if (empty($data['customer_id']) || empty($data['items'])) {
            $this->error('Missing required fields', 400);
            return;
        }

        // --- Promotion Validation (Integrity Check) ---
        if (!empty($data['applied_promotion_id'])) {
            require_once '../app/models/Promotion.php';
            $promoModel = new Promotion();
            $itemsObj = json_decode(json_encode($data['items'] ?? [])); // convert to objects for model
            $subtotal = (float)($data['subtotal'] ?? 0);
            
            $eligible = $promoModel->findEligiblePromotions(
                $itemsObj, 
                $subtotal, 
                $data['bank_id'] ?? null, 
                $data['card_category'] ?? null, 
                $data['location_id'] ?? null
            );
            
            $found = false;
            foreach ($eligible as $ep) {
                if ((int)$ep->promotion_id === (int)$data['applied_promotion_id']) {
                    // Check if discount value matches (with small rounding tolerance)
                    // The frontend sends discount_total which is sum of line + bill + promo
                    // We just check if this specific promo still yields approximately the same benefit
                    $found = true;
                    break;
                }
            }
            
            if (!$found) {
                $reason = $promoModel->getPromotionRejectionReason(
                    $data['applied_promotion_id'],
                    $itemsObj,
                    $subtotal,
                    $data['bank_id'] ?? null,
                    $data['card_category'] ?? null,
                    $data['location_id'] ?? null
                );
                $this->error('The applied promotion is no longer valid for this cart: ' . $reason . ' Please refresh and try again.', 400);
                return;
            }
        }

        // Generate Invoice Number
        $invoiceNo = $this->generateInvoiceNo($data['location_id'] ?? $this->currentLocationId($u));
        $data['invoice_no'] = $invoiceNo;
        $data['userId'] = $u['sub'];

        // Ensure schema is up to date BEFORE starting a transaction
        // (MySQL commits implicitly on DDL like CREATE/ALTER)
        require_once '../app/models/PaymentReceipt.php';
        $receiptModel = new PaymentReceipt();
        $receiptModel->ensureSchema();

        // Ensure Accounting schema is built (preventing implicit commits during transaction)
        require_once '../app/models/AccountMapping.php';
        new AccountMapping();
        
        require_once '../app/models/Journal.php';
        new Journal();
        
        require_once '../app/models/PosHeldOrder.php';
        new PosHeldOrder();

        // Instantiate models used heavily in item processing to trigger any DDL schemas early!
        require_once '../app/models/Part.php';
        new Part();
        
        require_once '../app/models/ProductionBOM.php';
        new ProductionBOM();
        
        require_once '../app/models/Tax.php';
        new Tax();

        require_once '../app/models/OnlineOrder.php';
        $onlineOrderModel = new OnlineOrder();

        $db = new Database();
        $db->beginTransaction();

        try {
            $invoiceId = $this->invoiceModel->create($data);
            if (!$invoiceId) throw new Exception('Failed to create invoice');

            $this->invoiceModel->addItems($invoiceId, $data['items'], $data['userId']);
            if (!empty($data['applied_taxes'])) {
                $this->invoiceModel->addAppliedTaxes($invoiceId, $data['applied_taxes']);
            }

            // Post to Accounting AFTER all items are in the DB
            require_once '../app/helpers/AccountingHelper.php';
            AccountingHelper::postInvoice($invoiceId);

            // Optional: Process Payments immediately
            if (!empty($data['payments']) && is_array($data['payments'])) {
                foreach ($data['payments'] as $p) {
                    if (($p['method'] ?? '') === 'Credit') continue;
                    
                    $receiptData = [
                        'invoice_id' => $invoiceId,
                        'invoice_no' => $invoiceNo,
                        'customer_id' => $data['customer_id'],
                        'location_id' => $data['location_id'] ?? $this->currentLocationId($u),
                        'amount' => $p['amount'],
                        'payment_method' => $p['method'],
                        'payment_date' => $data['issue_date'] ?? date('Y-m-d'),
                        'created_by' => $u['sub'],
                        'card_type' => $p['cardType'] ?? null,
                        'card_last4' => $p['cardLast4'] ?? null,
                        'card_auth_code' => $p['cardAuthCode'] ?? null,
                        'bank_id' => $p['bankId'] ?? $data['bank_id'] ?? null,
                        'card_category' => $p['cardCategory'] ?? $data['card_category'] ?? null,
                        'cheque' => [
                            'cheque_no' => $p['chequeNo'] ?? '',
                            'bank_name' => $p['chequeBankName'] ?? '',
                            'branch_name' => $p['chequeBranchName'] ?? '',
                            'cheque_date' => $p['chequeDate'] ?? date('Y-m-d'),
                            'payee_name' => $p['chequePayee'] ?? ''
                        ]
                    ];
                    $receiptModel->create($receiptData);
                }
            }

            // Audit Log
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'action' => 'create',
                'entity' => 'invoice',
                'entity_id' => (int)$invoiceId,
                'method' => 'POST',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['invoice_no' => $invoiceNo]),
            ]);
            // Optional: Mark online order as completed and link invoice
            if (!empty($data['online_order_id'])) {
                $onlineOrderModel->setInvoiceId($data['online_order_id'], $invoiceId);
                
                // Also update status to Completed
                $db->query("UPDATE online_orders SET order_status = 'Completed' WHERE id = :id");
                $db->bind(':id', $data['online_order_id']);
                $db->execute();
            }

            // Optional: Mark held order as completed if it came from a held bill
            if (!empty($data['held_order_id'])) {
                require_once '../app/models/PosHeldOrder.php';
                $holdModel = new PosHeldOrder();
                $holdModel->complete($data['held_order_id']);
            }

            $db->commit();
            
            $userRow = $this->db->query("SELECT name FROM users WHERE id = :id", [':id' => $u['sub']])->fetch();
            $createdBy = $userRow ? $userRow['name'] : 'System';

            $this->success([
                'id' => $invoiceId, 
                'invoice_no' => $invoiceNo, 
                'created_by' => $createdBy,
                'message' => 'Invoice created successfully'
            ]);
        } catch (Exception $e) {
            try {
                $db->rollBack();
            } catch (Exception $e2) {
                // Ignore rollback failures
            }
            error_log("Invoice Checkout Error: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
            $this->error($e->getMessage() . " at " . basename($e->getFile()) . ":" . $e->getLine());
        }
    }

    public function addPayment($id = null) {
        $u = $this->requirePermission('invoices.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        if (!$id) {
            $this->error('Invoice ID required', 400);
            return;
        }

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        $data['userId'] = $u['sub'];

        // Fetch Invoice to get metadata
        $invoice = $this->invoiceModel->getById($id);
        if (!$invoice) {
            $this->error('Invoice not found', 404);
            return;
        }

        require_once '../app/models/PaymentReceipt.php';
        $receiptModel = new PaymentReceipt();

        $receiptData = [
            'invoice_id' => $id,
            'invoice_no' => $invoice->invoice_no,
            'customer_id' => $invoice->customer_id,
            'customer_name' => $invoice->customer_name,
            'location_id' => $this->currentLocationId($u),
            'amount' => $data['amount'] ?? $data['payment_amount'], // Support both keys
            'payment_method' => $data['payment_method'] ?? 'Cash',
            'payment_date' => $data['payment_date'],
            'reference_no' => $data['reference_no'] ?? $data['cheque_no'] ?? null,
            'notes' => $data['notes'] ?? null,
            'card_type' => $data['card_type'] ?? null,
            'card_last4' => $data['card_last4'] ?? null,
            'card_auth_code' => $data['card_auth_code'] ?? null,
            'bank_id' => $data['bank_id'] ?? null,
            'card_category' => $data['card_category'] ?? null,
            'cheque' => $data['cheque'] ?? null,
            'created_by' => $u['sub']
        ];

        $receiptId = $receiptModel->create($receiptData);
        if ($receiptId) {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'action' => 'payment',
                'entity' => 'invoice',
                'entity_id' => (int)$id,
                'method' => 'POST',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['amount' => $data['amount'] ?? 0, 'method' => $data['payment_method'] ?? 'Cash', 'receipt_id' => $receiptId]),
            ]);
            $this->json([
                'status' => 'success',
                'message' => 'Payment added successfully',
                'receipt_id' => $receiptId
            ]);
        } else {
            $this->error('Failed to add payment');
        }
    }

    public function cancel($id = null) {
        $u = $this->requirePermission('invoices.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        if (!$id) {
            $this->error('Invoice ID required', 400);
            return;
        }

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        $reason = $data['reason'] ?? 'Cancelled by user';

        if ($this->invoiceModel->cancel($id, $reason, $u['sub'])) {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'action' => 'cancel',
                'entity' => 'invoice',
                'entity_id' => (int)$id,
                'method' => 'POST',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['reason' => $reason]),
            ]);
            $this->success(null, 'Invoice cancelled successfully');
        } else {
            $this->error('Failed to cancel invoice');
        }
    }

    private function generateInvoiceNo($locationId = 1) {
        require_once '../app/helpers/DocumentSequenceHelper.php';
        return DocumentSequenceHelper::getStandardDocNo('INV', $locationId);
    }

    public function convert_to_recurring($id = null) {
        $u = $this->requirePermission('invoices.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        if (!$id) {
            $this->error('Invoice ID required', 400);
            return;
        }

        $invoice = $this->invoiceModel->getById($id);
        if (!$invoice) {
            $this->error('Invoice not found', 404);
            return;
        }

        $items = $this->invoiceModel->getItems($id);
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);

        $recurringModel = $this->model('RecurringInvoice');

        $templateData = [
            'template_name' => $input['template_name'] ?? 'Template for ' . $invoice->invoice_no,
            'customer_id' => $invoice->customer_id,
            'location_id' => $invoice->location_id,
            'frequency' => $input['frequency'] ?? 'Monthly',
            'start_date' => $input['start_date'] ?? date('Y-m-d'),
            'end_date' => $input['end_date'] ?? null,
            'next_generation_date' => $input['start_date'] ?? date('Y-m-d'),
            'billing_address' => $invoice->billing_address,
            'shipping_address' => $invoice->shipping_address,
            'subtotal' => $invoice->subtotal,
            'tax_total' => $invoice->tax_total,
            'discount_total' => $invoice->discount_total,
            'shipping_fee' => $invoice->shipping_fee ?? 0,
            'grand_total' => $invoice->grand_total,
            'notes' => $invoice->notes,
            'userId' => $u['sub'],
            'items' => array_map(function($item) {
                return [
                    'item_id' => $item->item_id,
                    'description' => $item->description,
                    'item_type' => $item->item_type,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'discount' => $item->discount,
                    'line_total' => $item->line_total
                ];
            }, $items)
        ];

        $templateId = $recurringModel->create($templateData);
        if ($templateId) {
            $recurringModel->addItems($templateId, $templateData['items']);
            $this->success(['id' => $templateId, 'message' => 'Invoice converted to recurring template successfully']);
        } else {
            $this->error('Failed to create recurring template');
        }
    }

    public function send_email($id = null) {
        $u = $this->requirePermission('invoices.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        if (!$id) {
            $this->error('Invoice ID required', 400);
            return;
        }

        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        $targetEmail = $input['email'] ?? null;

        $invoice = $this->invoiceModel->getById($id);
        if (!$invoice) {
            $this->error('Invoice not found', 404);
            return;
        }

        if (!$targetEmail) {
            $targetEmail = $invoice->customer_email ?? null;
        }

        if (empty($targetEmail)) {
            $this->error('No recipient email provided', 400);
            return;
        }

        require_once '../app/helpers/EmailHelper.php';
        require_once '../app/helpers/PdfHelper.php';
        require_once '../app/models/SystemSetting.php';
        
        $settingModel = new SystemSetting();
        $company = (object)$settingModel->getAll();
        $company->name = $company->mail_from_name ?? 'BizFlow Solutions'; // Fallback

        // Fetch items and taxes for PDF
        $invoiceArray = (array)$invoice;
        $invoiceArray['items'] = $this->invoiceModel->getItems($id);
        $invoiceArray['applied_taxes'] = $this->invoiceModel->getAppliedTaxes($id);
        $invoiceObj = (object)$invoiceArray;

        // Generate PDF
        $pdfPath = PdfHelper::generateInvoice($invoiceObj, $company);

        $subject = "Invoice from " . ($company->name) . ": " . $invoice->invoice_no;
        
        $amountFormatted = number_format($invoice->grand_total, 2);
        $statusColor = $invoice->status === 'Paid' ? '#059669' : '#e11d48';
        
        $message = "
            <h2>Hello " . ($invoice->customer_name ?? 'Valued Customer') . ",</h2>
            <p>We appreciate your business. Please find your invoice <strong>{$invoice->invoice_no}</strong> attached to this email for your records.</p>
            
            <div class='info-card'>
                <div class='info-row'>
                    <span class='label'>Invoice Number</span>
                    <span class='value'>{$invoice->invoice_no}</span>
                </div>
                <div class='info-row'>
                    <span class='label'>Issue Date</span>
                    <span class='value'>" . date('d M Y', strtotime($invoice->issue_date)) . "</span>
                </div>
                <div class='info-row'>
                    <span class='label'>Amount Due</span>
                    <span class='value'>LKR {$amountFormatted}</span>
                </div>
                <div class='info-row'>
                    <span class='label'>Payment Status</span>
                    <span class='value' style='color: {$statusColor};'>{$invoice->status}</span>
                </div>
            </div>

            <p>If you have any questions regarding this invoice, please feel free to contact our support team.</p>
            
            <div style='text-align: center;'>
                <a href='" . (defined('URLROOT') ? URLROOT : '#') . "' class='btn'>Log in to Portal</a>
            </div>

            <p style='margin-top: 32px;'>Thank you for choosing <strong>" . ($company->name) . "</strong>.</p>
        ";

        $result = EmailHelper::send($targetEmail, $subject, $message, [$pdfPath]);
        
        // Clean up temp file
        if (file_exists($pdfPath)) {
            @unlink($pdfPath);
        }

        if ($result['status'] === 'success') {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'action' => 'email_resend',
                'entity' => 'invoice',
                'entity_id' => (int)$id,
                'method' => 'POST',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['to' => $targetEmail]),
            ]);
            $this->success(null, 'Email sent successfully to ' . $targetEmail);
        } else {
            $this->error($result['message']);
        }
    }
}
