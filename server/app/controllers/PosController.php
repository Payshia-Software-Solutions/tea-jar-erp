<?php
/**
 * PosController
 */
class PosController extends Controller {
    public function __construct() {
        // Ensure database tables exist for ledger queries
        require_once '../app/helpers/SalesReturnSchema.php';
        SalesReturnSchema::ensure();

        // Ensure database tables for Held Orders & KOT
        require_once '../app/helpers/PosHeldOrderSchema.php';
        PosHeldOrderSchema::ensure();
    }

    public function index() {
        $this->success(['message' => 'POS Controller Active']);
    }

    public function day_ledger() {
        $u = $this->requirePermission('pos.read');
        $db = new Database();

        $locationId = (int)($_GET['location_id'] ?? 0);
        if ($locationId <= 0) {
            $this->error('Location ID required', 400);
            return;
        }

        // 1. Invoices (Sales)
        $db->query("
            SELECT i.id, i.invoice_no as doc_no, c.name as customer_name, i.grand_total as amount, i.created_at, 'Invoice' as type
            FROM invoices i
            JOIN customers c ON i.customer_id = c.id
            WHERE i.location_id = :locId AND DATE(i.created_at) = CURDATE() AND i.status NOT IN ('Cancelled', 'CANCELLED')
            ORDER BY i.created_at DESC
        ");
        $db->bind(':locId', $locationId);
        $invoices = $db->resultSet();

        // 2. Returns
        $db->query("
            SELECT sr.id, sr.return_no as doc_no, 
                   COALESCE(c_i.name, c_sr.name) as customer_name, 
                   sr.total_amount as amount, sr.created_at, 'Return' as type
            FROM sales_returns sr
            LEFT JOIN invoices i ON sr.invoice_id = i.id
            LEFT JOIN customers c_i ON i.customer_id = c_i.id
            LEFT JOIN customers c_sr ON sr.customer_id = c_sr.id
            WHERE sr.location_id = :locId AND DATE(sr.created_at) = CURDATE() AND sr.status = 'Completed'
            ORDER BY sr.created_at DESC
        ");
        $db->bind(':locId', $locationId);
        $returns = $db->resultSet();

        // 3. Refunds
        $db->query("
            SELECT r.id, COALESCE(r.refund_no, CONCAT('REF-', LPAD(r.id, 5, '0'))) as doc_no, 
                   i.invoice_no, 
                   COALESCE(c_i.name, c_sr.name) as customer_name, 
                   r.amount, r.payment_method, r.created_at, 'Refund' as type
            FROM refunds r
            LEFT JOIN invoices i ON r.id = i.id
            LEFT JOIN sales_returns sr ON r.return_id = sr.id
            LEFT JOIN customers c_i ON i.customer_id = c_i.id
            LEFT JOIN customers c_sr ON sr.customer_id = c_sr.id
            WHERE r.location_id = :locId AND DATE(r.created_at) = CURDATE()
            ORDER BY r.created_at DESC
        ");
        $db->bind(':locId', $locationId);
        $refunds = $db->resultSet();

        // 4. Payment Receipts (individual payments)
        $db->query("
            SELECT id, receipt_no as doc_no, invoice_id, customer_name, amount, payment_method, created_at, 'Receipt' as type
            FROM payment_receipts
            WHERE location_id = :locId AND DATE(created_at) = CURDATE() AND status != 'Cancelled'
            ORDER BY created_at DESC
        ");
        $db->bind(':locId', $locationId);
        $receipts = $db->resultSet();

        // Calculate Totals and Method Summary
        $totalSales = array_reduce($invoices, function($s, $i) { return $s + (float)$i->amount; }, 0);
        $totalReturns = array_reduce($returns, function($s, $i) { return $s + (float)$i->amount; }, 0);
        $totalRefunds = array_reduce($refunds, function($s, $i) { return $s + (float)$i->amount; }, 0);

        $methods = [
            'Cash' => 0,
            'Card' => 0,
            'Bank Transfer' => 0,
            'Cheque' => 0,
            'Credit' => 0 // In case there are credit settlements
        ];

        // Add from Receipts
        foreach ($receipts as $r) {
            $m = $r->payment_method ?? 'Cash';
            if (!isset($methods[$m])) $methods[$m] = 0;
            $methods[$m] += (float)$r->amount;
        }

        // Subtract from Refunds
        foreach ($refunds as $r) {
            $m = $r->payment_method ?? 'Cash';
            if (!isset($methods[$m])) $methods[$m] = 0;
            $methods[$m] -= (float)$r->amount;
        }

        // Merge all events for chronological ledger
        $events = [];
        foreach ($invoices as $v) $events[] = $v;
        foreach ($returns as $v) $events[] = $v;
        foreach ($refunds as $v) $events[] = $v;
        foreach ($receipts as $v) $events[] = $v;

        // Sort by time
        usort($events, function($a, $b) {
            return strtotime($b->created_at) - strtotime($a->created_at);
        });

        $this->success([
            'summary' => [
                'sales' => $totalSales,
                'returns' => $totalReturns,
                'refunds' => $totalRefunds,
                'net' => $totalSales - $totalRefunds,
                'methods' => $methods
            ],
            'events' => $events
        ]);
    }

    public function held_orders() {
        $u = $this->requirePermission('pos.read');
        $locationId = (int)($_GET['location_id'] ?? 1);
        require_once '../app/models/PosHeldOrder.php';
        $model = new PosHeldOrder();
        $this->success($model->list($locationId));
    }

    public function hold_order() {
        $u = $this->requirePermission('pos.write');
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        require_once '../app/models/PosHeldOrder.php';
        $model = new PosHeldOrder();
        $id = $model->save($data, $u['sub']);
        if ($id) {
            $this->success(['id' => $id, 'message' => 'Order held successfully']);
        } else {
            $this->error('Failed to hold order');
        }
    }

    public function load_held_order($id) {
        $u = $this->requirePermission('pos.read');
        require_once '../app/models/PosHeldOrder.php';
        $model = new PosHeldOrder();
        $order = $model->getById($id);
        if ($order) {
            $this->success($order);
        } else {
            $this->error('Held order not found');
        }
    }

    public function kot_details($id) {
        $u = $this->requirePermission('pos.read');
        $full = ($_GET['full'] ?? '0') === '1';
        
        require_once '../app/models/PosHeldOrder.php';
        $model = new PosHeldOrder();
        $order = $model->getById($id);
        if ($order) {
            if (!$full) {
                // Return ONLY unprinted items for incremental KOT
                $order->items = $model->getUnprintedKOTItems($id);
            }
            // If full, $order->items is already populated by getById() with all items
            
            $this->success($order);
        } else {
            $this->error('Held order not found');
        }
    }

    public function mark_kot_printed($id) {
        $u = $this->requirePermission('pos.write');
        require_once '../app/models/PosHeldOrder.php';
        $model = new PosHeldOrder();
        if ($model->markAsPrinted($id)) {
            $this->success(['message' => 'KOT marked as printed']);
        } else {
            $this->error('Failed to mark KOT as printed');
        }
    }

    public function stewards() {
        $u = $this->requireAuth();
        $locationId = $this->currentLocationId($u);
        
        $db = new Database();
        $db->query("
            SELECT u.id, u.name, u.email, r.name as role_name
            FROM users u
            INNER JOIN roles r ON r.id = u.role_id
            WHERE u.location_id = :locId
              AND u.is_active = 1
            ORDER BY u.name ASC
        ");
        $db->bind(':locId', $locationId);
        $rows = $db->resultSet();
        
        // Filter by role in PHP to avoid SQL case/trim issues
        $filtered = array_values(array_filter($rows, function($row) {
            $role = strtolower(trim($row->role_name));
            return (
                strpos($role, 'steward') !== false || 
                strpos($role, 'officer') !== false || 
                strpos($role, 'waiter') !== false
            );
        }));
        
        $this->success($filtered);
    }
}
