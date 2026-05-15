<?php
/**
 * Dashboard Controller
 * Provides aggregated metrics for the frontend dashboard.
 *
 * GET /api/dashboard/overview
 */

class DashboardController extends Controller {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function index() {
        $this->overview();
    }

    private function inList($prefix, $values) {
        $vals = is_array($values) ? $values : [];
        $vals = array_values(array_filter(array_map('intval', $vals), function($x) { return $x > 0; }));
        if (count($vals) === 0) return "NULL";
        $parts = [];
        for ($i = 0; $i < count($vals); $i++) {
            $parts[] = ':' . $prefix . $i;
        }
        return implode(',', $parts);
    }

    private function bindInList($prefix, $values) {
        $vals = is_array($values) ? $values : [];
        $vals = array_values(array_filter(array_map('intval', $vals), function($x) { return $x > 0; }));
        for ($i = 0; $i < count($vals); $i++) {
            $this->db->bind(':' . $prefix . $i, $vals[$i]);
        }
    }

    private function resolveLocationIds($u) {
        // Admin: all locations. Non-admin: allowed locations from token (fallback to token location).
        if ($this->isAdmin($u)) {
            $this->db->query("SELECT id FROM service_locations ORDER BY id ASC");
            $rows = $this->db->resultSet() ?: [];
            $ids = array_map(function($r) { return (int)$r->id; }, $rows);
            return array_values(array_filter($ids, function($x) { return $x > 0; }));
        }

        $ids = $u['allowed_location_ids'] ?? null;
        if (is_array($ids) && count($ids) > 0) {
            $ids = array_values(array_filter(array_map('intval', $ids), function($x) { return $x > 0; }));
            if (count($ids) > 0) return $ids;
        }

        $fallback = isset($u['location_id']) ? (int)$u['location_id'] : 1;
        if ($fallback <= 0) $fallback = 1;
        return [$fallback];
    }

    // GET /api/dashboard/overview
    public function overview() {
        $u = $this->requirePermission('orders.read');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        $locIds = $this->resolveLocationIds($u);
        $inLoc = $this->inList('loc', $locIds);

        // Status counts
        $this->db->query("SELECT status, COUNT(*) AS cnt FROM repair_orders WHERE location_id IN ($inLoc) GROUP BY status");
        $this->bindInList('loc', $locIds);
        $rows = $this->db->resultSet();
        $byStatus = [];
        foreach ($rows as $r) {
            $byStatus[(string)$r->status] = (int)$r->cnt;
        }

        // Completed today
        $this->db->query("
            SELECT COUNT(*) AS cnt
            FROM repair_orders
            WHERE status = 'Completed'
              AND location_id IN ($inLoc)
              AND DATE(updated_at) = CURDATE()
        ");
        $this->bindInList('loc', $locIds);
        $obj = $this->db->single();
        $completedToday = $obj ? (int)$obj->cnt : 0;

        // Avg repair time (hours) for completed orders over last 30 days (created_at -> updated_at)
        $this->db->query("
            SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) AS avg_min
            FROM repair_orders
            WHERE status = 'Completed'
              AND location_id IN ($inLoc)
              AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ");
        $this->bindInList('loc', $locIds);
        $avgObj = $this->db->single();
        $avgMinutes = ($avgObj && $avgObj->avg_min !== null) ? (float)$avgObj->avg_min : 0.0;
        $avgRepairHours = $avgMinutes > 0 ? round($avgMinutes / 60.0, 1) : 0.0;

        // Throughput (last 7 days): received (created) and completed (updated_at where status completed)
        $this->db->query("
            SELECT DATE(created_at) AS d, COUNT(*) AS received
            FROM repair_orders
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
              AND location_id IN ($inLoc)
            GROUP BY DATE(created_at)
        ");
        $this->bindInList('loc', $locIds);
        $receivedRows = $this->db->resultSet() ?: [];
        $receivedMap = [];
        foreach ($receivedRows as $r) {
            $receivedMap[(string)$r->d] = (int)$r->received;
        }

        $this->db->query("
            SELECT DATE(updated_at) AS d, COUNT(*) AS completed
            FROM repair_orders
            WHERE status = 'Completed'
              AND updated_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
              AND location_id IN ($inLoc)
            GROUP BY DATE(updated_at)
        ");
        $this->bindInList('loc', $locIds);
        $completedRows = $this->db->resultSet() ?: [];
        $completedMap = [];
        foreach ($completedRows as $r) {
            $completedMap[(string)$r->d] = (int)$r->completed;
        }

        $series = [];
        for ($i = 6; $i >= 0; $i--) {
            $d = date('Y-m-d', strtotime("-{$i} day"));
            $series[] = [
                'date' => $d,
                'received' => $receivedMap[$d] ?? 0,
                'completed' => $completedMap[$d] ?? 0,
            ];
        }

        // Urgent attention list (non-completed, urgent/high/emergency)
        $this->db->query("
            SELECT id, vehicle_model, priority, status, expected_time, created_at
            FROM repair_orders
            WHERE status <> 'Completed'
              AND location_id IN ($inLoc)
              AND priority IN ('Urgent','High','Emergency')
            ORDER BY
              CASE WHEN expected_time IS NULL THEN 1 ELSE 0 END,
              expected_time ASC,
              created_at DESC
            LIMIT 5
        ");
        $this->bindInList('loc', $locIds);
        $urgentRows = $this->db->resultSet() ?: [];
        $urgent = array_map(function($r) {
            return [
                'id' => (int)$r->id,
                'vehicle_model' => (string)$r->vehicle_model,
                'priority' => (string)$r->priority,
                'status' => (string)$r->status,
                'expected_time' => $r->expected_time ? (string)$r->expected_time : null,
                'created_at' => (string)$r->created_at,
            ];
        }, $urgentRows);

        // Recent completions
        $this->db->query("
            SELECT id, vehicle_model, updated_at
            FROM repair_orders
            WHERE status = 'Completed'
              AND location_id IN ($inLoc)
            ORDER BY updated_at DESC
            LIMIT 6
        ");
        $this->bindInList('loc', $locIds);
        $recentRows = $this->db->resultSet() ?: [];
        $recent = array_map(function($r) {
            return [
                'id' => (int)$r->id,
                'vehicle_model' => (string)$r->vehicle_model,
                'completed_at' => (string)$r->updated_at,
            ];
        }, $recentRows);

        // Service bays utilization
        $this->db->query("SELECT status, COUNT(*) AS cnt FROM service_bays WHERE location_id IN ($inLoc) GROUP BY status");
        $this->bindInList('loc', $locIds);
        $bayRows = $this->db->resultSet() ?: [];
        $baysByStatus = [];
        $bayTotal = 0;
        foreach ($bayRows as $r) {
            $baysByStatus[(string)$r->status] = (int)$r->cnt;
            $bayTotal += (int)$r->cnt;
        }

        $this->success([
            'ordersByStatus' => $byStatus,
            'completedToday' => $completedToday,
            'avgRepairHours' => $avgRepairHours,
            'throughputLast7Days' => $series,
            'urgentAttention' => $urgent,
            'recentCompletions' => $recent,
            'serviceBaysByStatus' => $baysByStatus,
            'serviceBaysTotal' => $bayTotal,
            'expiringDocuments' => $this->getExpiringDocs(),
        ]);
    }

    private function getExpiringDocs() {
        $this->db->query("
            SELECT d.*, v.make, v.model, v.vin
            FROM vehicle_documents d
            JOIN vehicles v ON d.vehicle_id = v.id
            WHERE d.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
              AND d.expiry_date >= CURDATE()
            ORDER BY d.expiry_date ASC
            LIMIT 5
        ");
        return $this->db->resultSet() ?: [];
    }

    // GET /api/dashboard/sales
    public function sales() {
        $u = $this->requirePermission('reports.read');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        $locIds = $this->resolveLocationIds($u);
        $inLoc = $this->inList('loc', $locIds);

        // 1. KPIs: Revenue & Collections
        // Today
        $this->db->query("
            SELECT COALESCE(SUM(grand_total), 0) AS revenue, COALESCE(SUM(paid_amount), 0) AS collection, COUNT(*) as cnt
            FROM invoices 
            WHERE location_id IN ($inLoc) AND issue_date = CURDATE() AND status <> 'Cancelled'
        ");
        $this->bindInList('loc', $locIds);
        $todayObj = $this->db->single();

        // Month
        $this->db->query("
            SELECT COALESCE(SUM(grand_total), 0) AS revenue, COALESCE(SUM(paid_amount), 0) AS collection
            FROM invoices 
            WHERE location_id IN ($inLoc) 
              AND issue_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01') 
              AND status <> 'Cancelled'
        ");
        $this->bindInList('loc', $locIds);
        $monthObj = $this->db->single();

        // Year
        $this->db->query("
            SELECT COALESCE(SUM(grand_total), 0) AS revenue, COALESCE(SUM(paid_amount), 0) AS collection
            FROM invoices 
            WHERE location_id IN ($inLoc) 
              AND issue_date >= DATE_FORMAT(CURDATE(), '%Y-01-01') 
              AND status <> 'Cancelled'
        ");
        $this->bindInList('loc', $locIds);
        $yearObj = $this->db->single();

        // Outstanding (All-time)
        $this->db->query("
            SELECT COALESCE(SUM(grand_total - paid_amount), 0) AS outstanding
            FROM invoices 
            WHERE location_id IN ($inLoc) AND status IN ('Unpaid', 'Partial')
        ");
        $this->bindInList('loc', $locIds);
        $outstObj = $this->db->single();

        // 2. Revenue Trend (Last 30 Days)
        $this->db->query("
            SELECT issue_date AS d, SUM(grand_total) AS revenue
            FROM invoices
            WHERE location_id IN ($inLoc) 
              AND issue_date >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
              AND status <> 'Cancelled'
            GROUP BY issue_date
            ORDER BY issue_date ASC
        ");
        $this->bindInList('loc', $locIds);
        $trendRows = $this->db->resultSet() ?: [];
        $trendMap = [];
        foreach ($trendRows as $tr) {
            $trendMap[(string)$tr->d] = (float)$tr->revenue;
        }

        $revenueTrend = [];
        for ($i = 29; $i >= 0; $i--) {
            $d = date('Y-m-d', strtotime("-{$i} day"));
            $revenueTrend[] = [
                'date' => $d,
                'revenue' => $trendMap[$d] ?? 0.0,
            ];
        }

        // 3. Payment Methods (Last 30 Days)
        $this->db->query("
            SELECT payment_method, SUM(amount) AS total
            FROM invoice_payments p
            JOIN invoices i ON i.id = p.invoice_id
            WHERE i.location_id IN ($inLoc) 
              AND p.payment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY payment_method
        ");
        $this->bindInList('loc', $locIds);
        $payRows = $this->db->resultSet() ?: [];
        $paymentMethods = array_map(function($r) {
            return [
                'method' => (string)$r->payment_method,
                'amount' => (float)$r->total
            ];
        }, $payRows);

        // 4. Top Selling Items (Month to Date)
        $this->db->query("
            SELECT description, SUM(quantity) as qty, SUM(line_total) as revenue
            FROM invoice_items ii
            JOIN invoices i ON i.id = ii.invoice_id
            WHERE i.location_id IN ($inLoc)
              AND i.issue_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
              AND i.status <> 'Cancelled'
            GROUP BY description
            ORDER BY revenue DESC
            LIMIT 5
        ");
        $this->bindInList('loc', $locIds);
        $topItemsRows = $this->db->resultSet() ?: [];
        $topItems = array_map(function($r) {
            return [
                'name' => (string)$r->description,
                'qty' => (float)$r->qty,
                'revenue' => (float)$r->revenue
            ];
        }, $topItemsRows);

        // 5. Recent Sales
        $this->db->query("
            SELECT i.id, i.invoice_no, i.grand_total, i.status, i.issue_date, c.name as customer_name
            FROM invoices i
            JOIN customers c ON c.id = i.customer_id
            WHERE i.location_id IN ($inLoc)
            ORDER BY i.id DESC
            LIMIT 5
        ");
        $this->bindInList('loc', $locIds);
        $recentRows = $this->db->resultSet() ?: [];
        $recentSales = array_map(function($r) {
            return [
                'id' => (int)$r->id,
                'invoice_no' => (string)$r->invoice_no,
                'customer_name' => (string)$r->customer_name,
                'total' => (float)$r->grand_total,
                'status' => (string)$r->status,
                'date' => (string)$r->issue_date,
            ];
        }, $recentRows);

        $this->success([
            'kpis' => [
                'today' => [
                    'revenue' => (float)($todayObj->revenue ?? 0),
                    'collection' => (float)($todayObj->collection ?? 0),
                    'count' => (int)($todayObj->cnt ?? 0)
                ],
                'month' => [
                    'revenue' => (float)($monthObj->revenue ?? 0),
                    'collection' => (float)($monthObj->collection ?? 0)
                ],
                'year' => [
                    'revenue' => (float)($yearObj->revenue ?? 0),
                    'collection' => (float)($yearObj->collection ?? 0)
                ],
                'outstanding' => (float)($outstObj->outstanding ?? 0)
            ],
            'revenueTrend' => $revenueTrend,
            'paymentMethods' => $paymentMethods,
            'topItems' => $topItems,
            'recentSales' => $recentSales,
        ]);
    }
}
