<?php
/**
 * OnlineOrder Model
 */
class OnlineOrder extends Model {
    private $table = 'online_orders';

    public function __construct() {
        parent::__construct();
        require_once __DIR__ . '/../helpers/OnlineOrderSchema.php';
        OnlineOrderSchema::ensure();
    }

    public function create($data) {
        $orderNo = 'WEB-' . strtoupper(bin2hex(random_bytes(4)));
        
        $this->db->query("
            INSERT INTO {$this->table} (
                order_no, location_id, customer_id, customer_details_json, shipping_address, billing_address, 
                shipping_fee, shipping_zone_id, district_id, total_amount, payment_method, payment_status, order_status, payment_slip
            ) VALUES (
                :order_no, :location_id, :customer_id, :customer_details, :shipping, :billing, 
                :shipping_fee, :shipping_zone_id, :district_id, :total, :method, :pay_status, :order_status, :slip
            )
        ");

        $this->db->bind(':order_no', $orderNo);
        $this->db->bind(':location_id', $data['location_id'] ?? 1);
        $this->db->bind(':customer_id', $data['customer_id'] ?? null);
        $this->db->bind(':customer_details', json_encode($data['customer_details'] ?? []));
        $this->db->bind(':shipping', $data['shipping_address'] ?? null);
        $this->db->bind(':billing', $data['billing_address'] ?? null);
        $this->db->bind(':shipping_fee', $data['shipping_fee'] ?? 0);
        $this->db->bind(':shipping_zone_id', $data['shipping_zone_id'] ?? null);
        $this->db->bind(':district_id', $data['district_id'] ?? null);
        $this->db->bind(':total', $data['total_amount']);
        $this->db->bind(':method', $data['payment_method'] ?? 'COD');
        $this->db->bind(':pay_status', 'Pending');
        $this->db->bind(':order_status', 'Pending');
        $this->db->bind(':slip', $data['payment_slip'] ?? null);

        if ($this->db->execute()) {
            $orderId = $this->db->lastInsertId();
            $this->addItems($orderId, $data['items']);
            
            $result = ['id' => $orderId, 'order_no' => $orderNo];

            // If PayHere, generate payment data
            if (strtoupper($data['payment_method'] ?? '') === 'PAYHERE') {
                require_once __DIR__ . '/SystemSetting.php';
                $settingModel = new SystemSetting();
                $allSettings = $settingModel->getAll();

                $isSandbox = (int)($allSettings['payhere_is_sandbox'] ?? 1) === 1;
                
                if ($isSandbox) {
                    $merchantId = $allSettings['payhere_merchant_id_sandbox'] ?? $allSettings['payhere_merchant_id'] ?? '';
                    $merchantSecret = $allSettings['payhere_merchant_secret_sandbox'] ?? $allSettings['payhere_merchant_secret'] ?? $allSettings['payhere_secret_sandbox'] ?? '';
                } else {
                    $merchantId = $allSettings['payhere_merchant_id_live'] ?? $allSettings['payhere_merchant_id'] ?? '';
                    $merchantSecret = $allSettings['payhere_merchant_secret_live'] ?? $allSettings['payhere_merchant_secret'] ?? $allSettings['payhere_secret_live'] ?? '';
                }

                $currency = $allSettings['currency_code'] ?? 'LKR';

                $amount = number_format($data['total_amount'], 2, '.', '');
                
                $hash = strtoupper(md5(
                    $merchantId . 
                    $orderNo . 
                    $amount . 
                    $currency . 
                    strtoupper(md5($merchantSecret))
                ));

                $result['payhere'] = [
                    'merchant_id' => $merchantId,
                    'order_id' => $orderNo,
                    'items' => 'Order ' . $orderNo,
                    'amount' => $amount,
                    'currency' => $currency,
                    'hash' => $hash,
                    'first_name' => $data['customer_details']['name'] ?? 'Customer',
                    'last_name' => '',
                    'email' => $data['customer_details']['email'] ?? '',
                    'phone' => $data['customer_details']['phone'] ?? '',
                    'address' => $data['shipping_address'] ?? '',
                    'city' => $data['customer_details']['city'] ?? '',
                    'country' => 'Sri Lanka',
                    'is_sandbox' => $isSandbox
                ];
            }

            return $result;
        }
        return false;
    }

    private function addItems($orderId, $items) {
        foreach ($items as $item) {
            $this->db->query("
                INSERT INTO online_order_items (order_id, item_id, description, quantity, unit_price, line_total)
                VALUES (:order_id, :item_id, :desc, :qty, :price, :total)
            ");
            $this->db->bind(':order_id', $orderId);
            $this->db->bind(':item_id', $item['item_id']);
            $this->db->bind(':desc', $item['description'] ?? '');
            $this->db->bind(':qty', $item['quantity']);
            $this->db->bind(':price', $item['unit_price']);
            $this->db->bind(':total', $item['line_total']);
            $this->db->execute();
        }
    }

    public function getById($id) {
        $this->db->query("SELECT * FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function getByOrderNo($orderNo) {
        $this->db->query("SELECT * FROM {$this->table} WHERE order_no = :order_no");
        $this->db->bind(':order_no', $orderNo);
        return $this->db->single();
    }

    public function getItems($orderId) {
        $this->db->query("SELECT * FROM online_order_items WHERE order_id = :order_id");
        $this->db->bind(':order_id', $orderId);
        return $this->db->resultSet();
    }

    public function updatePaymentStatus($id, $status, $payhereId = null) {
        $this->db->query("UPDATE {$this->table} SET payment_status = :status, payhere_id = :payhere_id WHERE id = :id");
        $this->db->bind(':status', $status);
        $this->db->bind(':payhere_id', $payhereId);
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function setInvoiceId($id, $invoiceId) {
        $this->db->query("UPDATE {$this->table} SET invoice_id = :invoice_id WHERE id = :id");
        $this->db->bind(':invoice_id', $invoiceId);
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
