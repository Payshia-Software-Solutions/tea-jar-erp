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
            SELECT o.*, l.name as location_name 
            FROM online_orders o
            LEFT JOIN service_locations l ON o.location_id = l.id
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
}
