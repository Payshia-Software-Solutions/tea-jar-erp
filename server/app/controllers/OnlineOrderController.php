<?php
/**
 * OnlineOrderController
 * Manage online orders for administration.
 */
class OnlineOrderController extends Controller {
    public function __construct() {
        $this->orderModel = $this->model('OnlineOrder');
        $this->db = new Database();
    }

    public function index() {
        // Fetch all online orders with some basic filtering (placeholder for now)
        $this->db->query("
            SELECT o.*, l.name as location_name, i.invoice_no 
            FROM online_orders o
            LEFT JOIN service_locations l ON o.location_id = l.id
            LEFT JOIN invoices i ON o.invoice_id = i.id
            ORDER BY o.created_at DESC
        ");
        $orders = $this->db->resultSet();

        // Add item counts and parse customer details
        foreach ($orders as &$order) {
            $this->db->query("SELECT COUNT(*) as item_count FROM online_order_items WHERE order_id = :id");
            $this->db->bind(':id', $order->id);
            $res = $this->db->single();
            $order->item_count = $res ? $res->item_count : 0;

            $details = json_decode($order->customer_details_json ?? '', true);
            $order->customer_name = $details['name'] ?? 'Unknown Customer';
        }

        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'success',
            'data' => $orders
        ]);
    }

    public function show($id) {
        $order = $this->orderModel->getById($id);
        if (!$order) {
            http_response_code(404);
            echo json_encode(['message' => 'Order not found']);
            return;
        }

        $order->items = $this->orderModel->getItems($id);
        echo json_encode($order);
    }

    public function updateStatus() {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['id']) || !isset($data['status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing ID or status']);
            return;
        }

        $this->db->query("UPDATE online_orders SET order_status = :status WHERE id = :id");
        $this->db->bind(':status', $data['status']);
        $this->db->bind(':id', $data['id']);

        if ($this->db->execute()) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update status']);
        }
    }

    public function dispatch() {
        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['id'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing Order ID']);
            return;
        }

        $this->db->query("
            UPDATE online_orders 
            SET order_status = 'Shipped', 
                shipping_carrier = :carrier, 
                tracking_no = :tracking 
            WHERE id = :id
        ");
        $this->db->bind(':carrier', $data['carrier'] ?? null);
        $this->db->bind(':tracking', $data['tracking_no'] ?? null);
        $this->db->bind(':id', $data['id']);

        if ($this->db->execute()) {
            // Optional: Send dispatch email
            try {
                $this->sendDispatchEmail($data['id']);
            } catch (Exception $e) {
                error_log("Failed to send dispatch email: " . $e->getMessage());
            }

            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to dispatch order']);
        }
    }

    private function sendDispatchEmail($orderId) {
        $order = $this->orderModel->getById($orderId);
        if (!$order) return;

        $details = json_decode($order->customer_details_json ?? '{}', true);
        $to = $details['email'] ?? '';
        if (!$to) return;

        require_once '../app/helpers/EmailHelper.php';
        require_once '../app/models/StorefrontSetting.php';
        require_once '../app/models/Company.php';
        
        $settingsModel = new StorefrontSetting();
        $companyModel = new Company();
        $ecomSettings = $settingsModel->getAll($order->location_id);
        $company = $companyModel->get();

        $subject = "Your Order is on the Way! - " . $order->order_no;
        
        $contentUrl = defined('CONTENT_BASE_URL') ? CONTENT_BASE_URL : 'https://content-provider.payshia.com/service-center-system/';
        $logoUrl = !empty($company->logo_filename) ? rtrim($contentUrl, '/') . '/logos/' . $company->logo_filename : '';

        $trackingInfo = '';
        if (!empty($order->shipping_carrier) || !empty($order->tracking_no)) {
            $trackingInfo = '
            <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #e2e8f0;">
                <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Tracking Information</div>
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">Carrier</div>
                    <div style="font-size: 16px; font-weight: 700; color: #0f172a;">' . htmlspecialchars($order->shipping_carrier ?: 'Standard Shipping') . '</div>
                </div>
                <div>
                    <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">Tracking Number</div>
                    <div style="font-size: 20px; font-weight: 800; color: #2563eb; letter-spacing: 1px;">' . htmlspecialchars($order->tracking_no ?: 'N/A') . '</div>
                </div>
            </div>';
        }

        $message = '
            <div style="text-align: center; margin-bottom: 32px;">
                ' . ($logoUrl ? '<img src="' . $logoUrl . '" alt="Logo" style="max-height: 50px; margin-bottom: 16px;">' : '') . '
                <div style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; font-weight: 800; color: #64748b; margin-bottom: 4px;">Order Dispatched</div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">Great news!</h1>
            </div>

            <p style="font-size: 16px; color: #334155; line-height: 1.6; text-align: center; margin-bottom: 32px;">
                Hi ' . ($details['name'] ?? 'there') . ', your order <strong>#' . $order->order_no . '</strong> has been dispatched and is making its way to you.
            </p>

            ' . $trackingInfo . '

            <div style="background: #0f172a; border-radius: 12px; padding: 24px; text-align: center; margin-top: 32px;">
                <p style="margin: 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Expect delivery within 2-4 business days.</p>
                <a href="' . ($ecomSettings['storefront_url'] ?? 'https://teajarceylon.com') . '" style="display: inline-block; margin-top: 8px; color: #ffffff; font-weight: 700; text-decoration: none; font-size: 15px;">Visit Our Store &rarr;</a>
            </div>
        ';

        $emailConfig = [
            'mail_host' => $ecomSettings['mail_host'] ?? '',
            'mail_user' => $ecomSettings['mail_user'] ?? '',
            'mail_pass' => $ecomSettings['mail_pass'] ?? '',
            'mail_port' => $ecomSettings['mail_port'] ?? 587,
            'mail_encryption' => $ecomSettings['mail_encryption'] ?? 'tls',
            'mail_from_addr' => $ecomSettings['mail_from_addr'] ?? 'no-reply@payshia.com',
            'mail_from_name' => $ecomSettings['mail_from_name'] ?? ($company->name ?? 'Tea Jar Store'),
        ];

        EmailHelper::sendWithConfig($to, $subject, $message, $emailConfig);
    }
}
