<?php
class KioskOrder {
    private $db;

    public function __construct() {
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

    public function getAllOrders($status = null, $page = 1, $limit = 20) {
        $offset = ($page - 1) * $limit;
        
        $where = '';
        if ($status) {
            $where = 'WHERE status = :status';
        }

        // Get total count
        $this->db->query("SELECT COUNT(*) as total FROM kiosk_orders $where");
        if ($status) {
            $this->db->bind(':status', $status);
        }
        $countRow = $this->db->single();
        $totalRecords = $countRow ? $countRow->total : 0;
        $totalPages = ceil($totalRecords / $limit);

        // Fetch orders
        $this->db->query("
            SELECT * FROM kiosk_orders 
            $where
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        if ($status) {
            $this->db->bind(':status', $status);
        }
        // bind limit and offset as integers manually because PDO sometimes quotes them
        $this->db->bind(':limit', (int)$limit, PDO::PARAM_INT);
        $this->db->bind(':offset', (int)$offset, PDO::PARAM_INT);
        
        $orders = $this->db->resultSet();

        if (empty($orders)) {
            return [
                'data' => [],
                'pagination' => [
                    'current_page' => $page,
                    'total_pages' => $totalPages,
                    'total_records' => $totalRecords,
                    'limit' => $limit
                ]
            ];
        }

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

        return [
            'data' => $orders,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => $totalPages,
                'total_records' => $totalRecords,
                'limit' => $limit
            ]
        ];
    }

    public function getOrderById($id) {
        $this->db->query('SELECT * FROM kiosk_orders WHERE id = :id');
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function updateStatus($id, $status) {
        $this->db->query('UPDATE kiosk_orders SET status = :status WHERE id = :id');
        $this->db->bind(':status', $status);
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
