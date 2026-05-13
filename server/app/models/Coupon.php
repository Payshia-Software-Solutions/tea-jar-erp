<?php
/**
 * Coupon Model
 */
class Coupon extends Model {
    protected $table = 'coupons';

    public function __construct() {
        parent::__construct();
        require_once '../app/helpers/CouponSchema.php';
        CouponSchema::ensure();
    }

    public function getAll() {
        $this->db->query("SELECT * FROM {$this->table} ORDER BY created_at DESC");
        return $this->db->resultSet();
    }

    public function getById($id) {
        $this->db->query("SELECT * FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function getByCode($code) {
        $this->db->query("SELECT * FROM {$this->table} WHERE code = :code AND is_active = 1");
        $this->db->bind(':code', strtoupper(trim($code)));
        return $this->db->single();
    }

    public function create($data) {
        $this->db->query("INSERT INTO {$this->table} (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, start_date, end_date, max_uses, user_limit, is_active) 
                         VALUES (:code, :description, :discount_type, :discount_value, :min_amount, :max_discount, :start, :end, :max_uses, :user_limit, :is_active)");
        $this->db->bind(':code', strtoupper(trim($data['code'])));
        $this->db->bind(':description', $data['description'] ?? '');
        $this->db->bind(':discount_type', $data['discount_type']);
        $this->db->bind(':discount_value', $data['discount_value']);
        $this->db->bind(':min_amount', $data['min_order_amount'] ?? 0);
        $this->db->bind(':max_discount', $data['max_discount_amount'] ?? 0);
        $this->db->bind(':start', $data['start_date'] ?: null);
        $this->db->bind(':end', $data['end_date'] ?: null);
        $this->db->bind(':max_uses', (int)($data['max_uses'] ?? 0));
        $this->db->bind(':user_limit', (int)($data['user_limit'] ?? 1));
        $this->db->bind(':is_active', (int)($data['is_active'] ?? 1));
        
        if ($this->db->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function update($id, $data) {
        $this->db->query("UPDATE {$this->table} SET description = :description, discount_type = :discount_type, discount_value = :discount_value, min_order_amount = :min_amount, max_discount_amount = :max_discount, start_date = :start, end_date = :end, max_uses = :max_uses, user_limit = :user_limit, is_active = :is_active 
                         WHERE id = :id");
        $this->db->bind(':id', $id);
        $this->db->bind(':description', $data['description'] ?? '');
        $this->db->bind(':discount_type', $data['discount_type']);
        $this->db->bind(':discount_value', $data['discount_value']);
        $this->db->bind(':min_amount', $data['min_order_amount'] ?? 0);
        $this->db->bind(':max_discount', $data['max_discount_amount'] ?? 0);
        $this->db->bind(':start', $data['start_date'] ?: null);
        $this->db->bind(':end', $data['end_date'] ?: null);
        $this->db->bind(':max_uses', (int)($data['max_uses'] ?? 0));
        $this->db->bind(':user_limit', (int)($data['user_limit'] ?? 1));
        $this->db->bind(':is_active', (int)($data['is_active'] ?? 1));
        return $this->db->execute();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function validate($code, $subtotal, $customerId = null) {
        $coupon = $this->getByCode($code);
        if (!$coupon) return ['valid' => false, 'message' => 'Invalid coupon code.'];

        $now = date('Y-m-d H:i:s');
        if ($coupon->start_date && $coupon->start_date > $now) return ['valid' => false, 'message' => 'Coupon is not yet active.'];
        if ($coupon->end_date && $coupon->end_date < $now) return ['valid' => false, 'message' => 'Coupon has expired.'];
        
        if ($coupon->max_uses > 0 && $coupon->used_count >= $coupon->max_uses) {
            return ['valid' => false, 'message' => 'Coupon usage limit reached.'];
        }

        if ($coupon->min_order_amount > 0 && $subtotal < $coupon->min_order_amount) {
            return ['valid' => false, 'message' => 'Minimum order amount for this coupon is ' . $coupon->min_order_amount];
        }

        if ($customerId && $coupon->user_limit > 0) {
            $this->db->query("SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = :cid AND customer_id = :cust_id");
            $this->db->bind(':cid', $coupon->id);
            $this->db->bind(':cust_id', $customerId);
            $usage = $this->db->single();
            if ($usage && $usage->count >= $coupon->user_limit) {
                return ['valid' => false, 'message' => 'You have already used this coupon.'];
            }
        }

        // Calculate discount
        $discount = 0;
        if ($coupon->discount_type === 'Percentage') {
            $discount = $subtotal * ($coupon->discount_value / 100);
            if ($coupon->max_discount_amount > 0 && $discount > $coupon->max_discount_amount) {
                $discount = $coupon->max_discount_amount;
            }
        } else {
            $discount = $coupon->discount_value;
        }

        return [
            'valid' => true,
            'coupon' => $coupon,
            'discount_amount' => round($discount, 2)
        ];
    }

    public function recordUsage($couponId, $orderId, $discountAmount, $customerId = null) {
        $this->db->query("INSERT INTO coupon_usage (coupon_id, order_id, customer_id, discount_amount) VALUES (:cid, :oid, :cust_id, :amt)");
        $this->db->bind(':cid', $couponId);
        $this->db->bind(':oid', $orderId);
        $this->db->bind(':cust_id', $customerId);
        $this->db->bind(':amt', $discountAmount);
        
        if ($this->db->execute()) {
            $this->db->query("UPDATE {$this->table} SET used_count = used_count + 1 WHERE id = :id");
            $this->db->bind(':id', $couponId);
            $this->db->execute();
            return true;
        }
        return false;
    }

    public function getUsageLogs($couponId) {
        $this->db->query("
            SELECT u.*, o.order_no, c.name as customer_name 
            FROM coupon_usage u
            JOIN online_orders o ON u.order_id = o.id
            LEFT JOIN customers c ON u.customer_id = c.id
            WHERE u.coupon_id = :id
            ORDER BY u.used_at DESC
        ");
        $this->db->bind(':id', $couponId);
        return $this->db->resultSet();
    }
}
