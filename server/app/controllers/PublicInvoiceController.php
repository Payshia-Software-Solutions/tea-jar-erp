<?php
/**
 * Public Invoice Controller
 * Provides public API access to generate finalized invoices directly using API Key authentication.
 */
class PublicInvoiceController extends Controller {
    private $invoiceModel;
    private $apiClientModel;
    private $auditModel;
    private $db;

    public function __construct() {
        $this->invoiceModel = $this->model('Invoice');
        $this->apiClientModel = $this->model('ApiClient');
        $this->auditModel = $this->model('AuditLog');
        $this->db = new Database();
    }

    private function handlePublicCors() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: X-API-Key, Content-Type');
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            if (!empty($apiKey) && !empty($origin) && $this->apiClientModel->validate($apiKey, $origin)) {
                header('Access-Control-Allow-Origin: ' . $origin);
            } else {
                header('Access-Control-Allow-Origin: *');
            }
            http_response_code(204);
            exit;
        }
        if (!empty($origin) && !empty($apiKey) && $this->apiClientModel->validate($apiKey, $origin)) {
            header('Access-Control-Allow-Origin: ' . $origin);
        } else {
            header('Access-Control-Allow-Origin: *');
        }
    }

    private function validatePublicApiKey() {
        $this->handlePublicCors();
        $headerKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if (empty($headerKey) || !$this->apiClientModel->validate($headerKey, $origin)) {
            $this->error('Unauthorized', 403);
        }
    }

    private function generateInvoiceNo($locationId = 1) {
        require_once '../app/helpers/DocumentSequenceHelper.php';
        return DocumentSequenceHelper::getStandardDocNo('INV', $locationId);
    }

    public function create() {
        $this->handlePublicCors();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        $this->validatePublicApiKey();

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        // Ensure schema is up to date BEFORE starting a transaction
        $this->invoiceModel->ensureSchema();

        $locationId = $data['location_id'] ?? 1;

        // Resolve Customer ID dynamically if customer_details are provided
        if (empty($data['customer_id']) && !empty($data['customer_details'])) {
            $customerModel = $this->model('Customer');
            $customerId = null;
            
            if (!empty($data['customer_details']['phone'])) {
                $this->db->query("SELECT id FROM customers WHERE phone = :phone LIMIT 1");
                $this->db->bind(':phone', $data['customer_details']['phone']);
                $existing = $this->db->single();
                if ($existing) $customerId = $existing->id;
            }
            
            if (!$customerId && !empty($data['customer_details']['email'])) {
                $this->db->query("SELECT id FROM customers WHERE email = :email LIMIT 1");
                $this->db->bind(':email', $data['customer_details']['email']);
                $existing = $this->db->single();
                if ($existing) $customerId = $existing->id;
            }
            
            if (!$customerId) {
                // Create minimal customer record
                $cData = [
                    'name' => $data['customer_details']['name'] ?? 'Guest',
                    'email' => $data['customer_details']['email'] ?? '',
                    'phone' => $data['customer_details']['phone'] ?? null,
                    'address' => $data['shipping_address'] ?? null,
                    'order_type' => 'External',
                    'is_active' => 1
                ];
                $customerModel->create($cData);
                $customerId = $this->db->lastInsertId();
            }
            
            $data['customer_id'] = $customerId;
        }

        // Final fallback: Resolve from location's default_customer_id
        if (empty($data['customer_id'])) {
            require_once '../app/models/ServiceLocation.php';
            $locModel = new ServiceLocation();
            $location = $locModel->getById($locationId);
            if ($location) {
                $data['customer_id'] = $location->default_customer_id;
            }
        }
        
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

        // Resolve default active Admin user for references
        $this->db->query("SELECT u.id FROM users u INNER JOIN roles r ON u.role_id = r.id WHERE r.name = 'Admin' AND u.is_active = 1 LIMIT 1");
        $userRow = $this->db->single();
        $userId = $userRow ? (int)$userRow->id : 1;

        // Generate Invoice Number
        $locationId = $data['location_id'] ?? 1;
        $invoiceNo = $this->generateInvoiceNo($locationId);
        $data['invoice_no'] = $invoiceNo;
        $data['userId'] = $userId;

        // Ensure schema is up to date BEFORE starting a transaction
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
            // Always overwrite item description with actual ERP product name from parts database
            foreach ($data['items'] as &$item) {
                if (!empty($item['item_id'])) {
                    $this->db->query("SELECT part_name FROM parts WHERE id = :id LIMIT 1");
                    $this->db->bind(':id', (int)$item['item_id']);
                    $part = $this->db->single();
                    if ($part && !empty($part->part_name)) {
                        $item['description'] = $part->part_name;
                    }
                }
            }

            $invoiceId = $this->invoiceModel->create($data);
            if (!$invoiceId) throw new Exception('Failed to create invoice');

            $this->invoiceModel->addItems($invoiceId, $data['items'], $data['userId']);
            if (!empty($data['applied_taxes'])) {
                $this->invoiceModel->addAppliedTaxes($invoiceId, $data['applied_taxes']);
            }

            // Post to Accounting AFTER all items are in the DB
            require_once '../app/helpers/AccountingHelper.php';
            AccountingHelper::postInvoice($invoiceId);

            // Create Customer Stocks from Batches
            require_once '../app/models/CustomerStock.php';
            $customerStockModel = new CustomerStock();
            $customerStockModel->createFromInvoice($invoiceId, $data['customer_id']);

            // Optional: Process Payments immediately
            if (!empty($data['payments']) && is_array($data['payments'])) {
                foreach ($data['payments'] as $p) {
                    if (($p['method'] ?? '') === 'Credit') continue;
                    
                    $receiptData = [
                        'invoice_id' => $invoiceId,
                        'invoice_no' => $invoiceNo,
                        'customer_id' => $data['customer_id'],
                        'location_id' => $locationId,
                        'amount' => $p['amount'],
                        'payment_method' => $p['method'],
                        'payment_date' => $data['issue_date'] ?? date('Y-m-d'),
                        'created_by' => $userId,
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
                'user_id' => (int)$userId,
                'action' => 'create_public',
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
                $db->query("UPDATE online_orders SET order_status = 'Completed' WHERE id = :id");
                $db->bind(':id', $data['online_order_id']);
                $db->execute();
            }

            $db->commit();
            
            $this->db->query("SELECT name FROM users WHERE id = :id");
            $this->db->bind(':id', $userId);
            $userRow = $this->db->single();
            $createdBy = $userRow && isset($userRow->name) ? $userRow->name : 'System';

            $this->success([
                'id' => $invoiceId, 
                'invoice_no' => $invoiceNo, 
                'created_by' => $createdBy,
                'issue_date' => $data['issue_date'] ?? date('Y-m-d')
            ]);

        } catch (Exception $e) {
            $db->rollBack();
            $this->error('Failed to create invoice: ' . $e->getMessage(), 500);
        }
    }
}
