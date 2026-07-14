<?php
class KioskOrder {
    private $db;

    public function __construct() {
        if (class_exists('KioskSchema')) KioskSchema::ensure();
        $this->db = new Database;
    }

    public function createOrder($data) {
        $this->db->query('INSERT INTO kiosk_orders (order_no, room_number, guest_name, phone_number, special_instructions, total_amount, status) VALUES (:order_no, :room_number, :guest_name, :phone_number, :special_instructions, :total_amount, :status)');
        
        $this->db->bind(':order_no', $data['order_no']);
        $this->db->bind(':room_number', $data['room_number']);
        $this->db->bind(':guest_name', $data['guest_name']);
        $this->db->bind(':phone_number', $data['phone_number']);
        $this->db->bind(':special_instructions', $data['special_instructions']);
        $this->db->bind(':total_amount', $data['total_amount']);
        $this->db->bind(':status', $data['status']);

        if ($this->db->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function createOrderItem($data) {
        $this->db->query('INSERT INTO kiosk_order_items (kiosk_order_id, product_id, quantity, price) VALUES (:kiosk_order_id, :product_id, :quantity, :price)');
        
        $this->db->bind(':kiosk_order_id', $data['kiosk_order_id']);
        $this->db->bind(':product_id', $data['product_id']);
        $this->db->bind(':quantity', $data['quantity']);
        $this->db->bind(':price', $data['price']);

        return $this->db->execute();
    }

    public function getAllOrders() {
        // Fetch orders
        $this->db->query('
            SELECT * FROM kiosk_orders 
            ORDER BY created_at DESC
        ');
        $orders = $this->db->resultSet();

        if (empty($orders)) return [];

        // Collect order IDs
        $orderIds = array_column($orders, 'id');
        $idsString = implode(',', $orderIds);

        // Fetch items for these orders
        $this->db->query("
            SELECT i.*, p.part_name as product_name 
            FROM kiosk_order_items i 
            LEFT JOIN parts p ON i.product_id = p.id 
            WHERE i.kiosk_order_id IN ($idsString)
        ");
        $items = $this->db->resultSet();

        // Group items by order ID
        $itemsByOrder = [];
        foreach ($items as $item) {
            $itemsByOrder[$item->kiosk_order_id][] = $item;
        }

        // Attach items to orders
        foreach ($orders as &$order) {
            $order->items = $itemsByOrder[$order->id] ?? [];
        }

        return $orders;
    }

    public function updateStatus($id, $status) {
        $this->db->query('UPDATE kiosk_orders SET status = :status WHERE id = :id');
        $this->db->bind(':status', $status);
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
