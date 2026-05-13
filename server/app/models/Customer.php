<?php
/**
 * Customer Model
 */

class Customer extends Model {
    private $table = 'customers';

    public function getAll() {
        $this->db->query("
            SELECT c.*, 
                   (SELECT COALESCE(SUM(i.grand_total - i.paid_amount), 0) 
                    FROM invoices i 
                    WHERE i.customer_id = c.id AND i.status != 'Cancelled') as total_outstanding
            FROM {$this->table} c 
            ORDER BY c.name ASC
        ");
        return $this->db->resultSet();
    }

    public function getEcommerceCustomers() {
        $this->db->query("
            SELECT c.*, 
                   (SELECT COUNT(*) FROM storefront_orders o WHERE o.customer_id = c.id) as total_store_orders
            FROM {$this->table} c 
            WHERE c.is_ecommerce_user = 1
            ORDER BY c.name ASC
        ");
        return $this->db->resultSet();
    }

    public function getById($id) {
        $this->db->query("
            SELECT c.*, 
                   (SELECT COALESCE(SUM(i.grand_total - i.paid_amount), 0) 
                    FROM invoices i 
                    WHERE i.customer_id = c.id AND i.status != 'Cancelled') as total_outstanding
            FROM {$this->table} c 
            WHERE c.id = :id
        ");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function create($data, $userId = null) {
        $this->db->query("
            INSERT INTO {$this->table} 
            (name, phone, email, address, nic, tax_number, order_type, is_active, is_unsubscribed, credit_limit, credit_days, is_ecommerce_user, created_by, updated_by) 
            VALUES 
            (:name, :phone, :email, :address, :nic, :tax_number, :order_type, :is_active, :is_unsubscribed, :credit_limit, :credit_days, :is_ecommerce_user, :created_by, :updated_by)
        ");
        
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':phone', $data['phone'] ?? null);
        $this->db->bind(':email', $data['email'] ?? null);
        $this->db->bind(':address', $data['address'] ?? null);
        $this->db->bind(':nic', $data['nic'] ?? null);
        $this->db->bind(':tax_number', $data['tax_number'] ?? null);
        $this->db->bind(':order_type', $data['order_type'] ?? 'External');
        $this->db->bind(':is_active', isset($data['is_active']) ? (int)$data['is_active'] : 1);
        $this->db->bind(':is_unsubscribed', isset($data['is_unsubscribed']) ? (int)$data['is_unsubscribed'] : 0);
        $this->db->bind(':credit_days', $data['credit_days'] ?? 0);
        $this->db->bind(':is_ecommerce_user', isset($data['is_ecommerce_user']) ? (int)$data['is_ecommerce_user'] : 0);
        $this->db->bind(':created_by', $userId);
        $this->db->bind(':updated_by', $userId);

        return $this->db->execute();
    }

    public function update($id, $data, $userId = null) {
        $this->db->query("
            UPDATE {$this->table} 
            SET name = :name, 
                phone = :phone, 
                email = :email, 
                address = :address, 
                nic = :nic, 
                tax_number = :tax_number, 
                order_type = :order_type, 
                is_active = :is_active, 
                is_unsubscribed = :is_unsubscribed,
                credit_limit = :credit_limit,
                credit_days = :credit_days,
                is_ecommerce_user = :is_ecommerce_user,
                updated_by = :updated_by 
            WHERE id = :id
        ");
        
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':phone', $data['phone'] ?? null);
        $this->db->bind(':email', $data['email'] ?? null);
        $this->db->bind(':address', $data['address'] ?? null);
        $this->db->bind(':nic', $data['nic'] ?? null);
        $this->db->bind(':tax_number', $data['tax_number'] ?? null);
        $this->db->bind(':order_type', $data['order_type'] ?? 'External');
        $this->db->bind(':is_active', isset($data['is_active']) ? (int)$data['is_active'] : 1);
        $this->db->bind(':is_unsubscribed', isset($data['is_unsubscribed']) ? (int)$data['is_unsubscribed'] : 0);
        $this->db->bind(':credit_limit', $data['credit_limit'] ?? 0);
        $this->db->bind(':credit_days', $data['credit_days'] ?? 0);
        $this->db->bind(':is_ecommerce_user', isset($data['is_ecommerce_user']) ? (int)$data['is_ecommerce_user'] : 0);
        $this->db->bind(':updated_by', $userId);
        $this->db->bind(':id', $id);

        return $this->db->execute();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function getSummary($id) {
        $customer = $this->getById($id);
        if (!$customer) return null;

        // 1. Recent Invoices
        $this->db->query("SELECT * FROM invoices WHERE customer_id = :id ORDER BY id DESC LIMIT 10");
        $this->db->bind(':id', $id);
        $invoices = $this->db->resultSet();

        // 2. Recent Payments
        $this->db->query("SELECT * FROM payment_receipts WHERE customer_id = :id ORDER BY id DESC LIMIT 10");
        $this->db->bind(':id', $id);
        $payments = $this->db->resultSet();

        // 3. Recent Reservations
        $this->db->query("SELECT * FROM hotel_reservations WHERE customer_id = :id ORDER BY id DESC LIMIT 10");
        $this->db->bind(':id', $id);
        $reservations = $this->db->resultSet();

        // 4. Lifetime Statistics
        $this->db->query("
            SELECT 
                COUNT(*) as total_invoices,
                COALESCE(SUM(grand_total), 0) as total_spent,
                COALESCE(SUM(paid_amount), 0) as total_paid,
                (SELECT COUNT(*) FROM hotel_reservations WHERE customer_id = :id AND status = 'CheckedOut') as total_stays
            FROM invoices 
            WHERE customer_id = :id AND status != 'Cancelled'
        ");
        $this->db->bind(':id', $id);
        $stats = $this->db->single();

        // 5. Purchased Items (Aggregated)
        $this->db->query("
            SELECT 
                ii.description as item_name,
                SUM(ii.quantity) as total_qty,
                AVG(ii.unit_price) as avg_price,
                SUM(ii.line_total) as total_spent,
                MAX(i.issue_date) as last_purchased
            FROM invoice_items ii
            JOIN invoices i ON i.id = ii.invoice_id
            WHERE i.customer_id = :id AND i.status != 'Cancelled'
            GROUP BY ii.description
            ORDER BY total_spent DESC
            LIMIT 50
        ");
        $this->db->bind(':id', $id);
        $items = $this->db->resultSet();

        return [
            'customer' => $customer,
            'invoices' => $invoices,
            'payments' => $payments,
            'reservations' => $reservations,
            'stats' => $stats,
            'purchased_items' => $items
        ];
    }
}
