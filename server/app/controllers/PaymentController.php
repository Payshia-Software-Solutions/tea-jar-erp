<?php
/**
 * Payment Controller
 * Handles payment gateway notifications (webhooks).
 */
class PaymentController extends Controller {
    protected $db;
    private $orderModel;
    private $systemModel;
    private $payhereHelper;

    public function __construct() {
        $this->db = new Database();
        $this->orderModel = $this->model('OnlineOrder');
        $this->systemModel = $this->model('SystemSetting');
        $this->payhereHelper = new PayHereHelper();
    }

    private function handleCors() {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            exit;
        }
    }

    /**
     * GET /api/payment/index
     */
    public function index() {
        $this->handleCors();
        $this->db->query("SELECT * FROM payment_notifications ORDER BY created_at DESC LIMIT 100");
        $logs = $this->db->resultSet();
        echo json_encode(['status' => 'success', 'data' => $logs]);
    }

    /**
     * POST /api/payment/payhere_notify
     */
    public function payhere_notify() {
        $this->handleCors();
        require_once __DIR__ . '/../helpers/PaymentGatewayFactory.php';
        
        $data = $_POST;
        
        // Log notification to database
        require_once '../app/helpers/PaymentLogSchema.php';
        PaymentLogSchema::ensure();
        $logId = $this->logNotification('PayHere', $data);
        
        $settings = $this->systemModel->getAll();

        // Debug Logging
        $logFile = dirname(__DIR__, 2) . '/payment_debug.log';
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] PayHere Notify Received: " . json_encode($data) . PHP_EOL;
        file_put_contents($logFile, $logMessage, FILE_APPEND);

        try {
            $gateway = PaymentGatewayFactory::getGateway('payhere');
            $isSimulated = ($data['simulated'] ?? '') === '1';
            $isLocal = in_array($_SERVER['REMOTE_ADDR'], ['127.0.0.1', '::1']);

            if ($isSimulated && $isLocal) {
                file_put_contents($logFile, "[{$timestamp}] SIMULATED Webhook received (Validation Bypassed)" . PHP_EOL, FILE_APPEND);
            } elseif (!$gateway->validateNotification($data, $settings)) {
                file_put_contents($logFile, "[{$timestamp}] PayHere Validation FAILED: Hash mismatch" . PHP_EOL, FILE_APPEND);
                error_log("PayHere Hash Validation Failed for Order: " . ($data['order_id'] ?? 'Unknown'));
                exit('Invalid hash');
            }
            
            // Mark as validated in logs
            $this->db->query("UPDATE payment_notifications SET validation_status = 1 WHERE id = :id");
            $this->db->bind(':id', $logId);
            $this->db->execute();

            file_put_contents($logFile, "[{$timestamp}] PayHere Validation SUCCESS" . PHP_EOL, FILE_APPEND);
        } catch (Exception $e) {
            file_put_contents($logFile, "[{$timestamp}] PayHere Gateway ERROR: " . $e->getMessage() . PHP_EOL, FILE_APPEND);
            error_log("Payment Gateway Error: " . $e->getMessage());
            exit('Error');
        }

        $orderNo = $data['order_id'];
        $statusCode = (int)$data['status_code'];
        $payhereId = $data['payment_id'];

        $order = $this->orderModel->getByOrderNo($orderNo);
        if (!$order) {
            error_log("PayHere Notification: Order not found: " . $orderNo);
            exit('Order not found');
        }

        if ($statusCode === 2) { // Success
            $this->orderModel->updatePaymentStatus($order->id, 'Paid', $payhereId);
            
            // Record payment ONLY if invoice already exists (manually raised before webhook)
            if ($order->invoice_id) {
                // If invoice exists, record the payment
                require_once __DIR__ . '/../models/Invoice.php';
                $invModel = new Invoice();
                $invModel->addPayment($order->invoice_id, [
                    'amount' => (float)$data['payhere_amount'],
                    'payment_date' => date('Y-m-d'),
                    'payment_method' => 'IPG',
                    'reference_no' => $payhereId,
                    'userId' => 1
                ]);
            }
        } elseif ($statusCode === -2) { // Failed
            $this->orderModel->updatePaymentStatus($order->id, 'Failed', $payhereId);
        }

        echo "OK";
    }

    private function logNotification($gateway, $data) {
        $this->db->query("
            INSERT INTO payment_notifications (gateway, order_id, payment_id, status_code, amount, currency, raw_data)
            VALUES (:gateway, :order_id, :payment_id, :status_code, :amount, :currency, :raw_data)
        ");
        $this->db->bind(':gateway', $gateway);
        $this->db->bind(':order_id', $data['order_id'] ?? null);
        $this->db->bind(':payment_id', $data['payment_id'] ?? null);
        $this->db->bind(':status_code', $data['status_code'] ?? null);
        $this->db->bind(':amount', $data['payhere_amount'] ?? null);
        $this->db->bind(':currency', $data['payhere_currency'] ?? null);
        $this->db->bind(':raw_data', json_encode($data));
        $this->db->execute();
        return $this->db->lastInsertId();
    }
}
