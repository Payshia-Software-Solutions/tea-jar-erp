<?php
/**
 * Report Controller
 */
class ReportController extends Controller {
    private $db;
    private $auditModel;

    public function __construct() {
        $this->db = new Database();
        $this->auditModel = $this->model('AuditLog');
    }

    private function resolveLocationIds($u, $locationParam, $defaultAllForAdmin = true) {
        // Returns a list of location ids the user is allowed to query for reports.
        $isAdmin = (string)($u['role'] ?? '') === 'Admin';
        $locRaw = is_string($locationParam) ? trim($locationParam) : (string)($locationParam ?? '');
        $locRawLower = strtolower($locRaw);

        $allowed = [];
        if (!$isAdmin) {
            $allowed = $u['allowed_location_ids'] ?? null;
            if (!is_array($allowed) || count($allowed) === 0) {
                $allowed = [$this->currentLocationId($u)];
            }
            $allowed = array_values(array_unique(array_filter(array_map('intval', $allowed), function($x) { return $x > 0; })));
        }

        if ($isAdmin) {
            if ($locRawLower === 'all' || ($locRaw === '' && $defaultAllForAdmin)) {
                $this->db->query("SELECT id FROM service_locations ORDER BY id ASC");
                $rows = $this->db->resultSet();
                $ids = array_map(function($r) { return (int)$r->id; }, $rows ?: []);
                $ids = array_values(array_unique(array_filter($ids, function($x) { return $x > 0; })));
                return count($ids) ? $ids : [1];
            }
            $id = (int)$locRaw;
            return $id > 0 ? [$id] : [1];
        }

        if ($locRawLower === 'all' || $locRaw === '') {
            return count($allowed) ? $allowed : [1];
        }
        $want = (int)$locRaw;
        if ($want > 0 && in_array($want, $allowed, true)) return [$want];
        return count($allowed) ? $allowed : [1];
    }

    private function inList($prefix, $values) {
        $names = [];
        $i = 0;
        foreach ($values as $v) {
            $key = ':' . $prefix . $i;
            $names[] = $key;
            $i++;
        }
        return implode(',', $names);
    }

    private function bindInList($prefix, $values) {
        $i = 0;
        foreach ($values as $v) {
            $this->db->bind(':' . $prefix . $i, $v);
            $i++;
        }
    }

    // GET /api/report/overview
    public function overview() {
        $this->requirePermission('reports.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        // Orders by status
        $this->db->query("SELECT status, COUNT(*) AS cnt FROM repair_orders GROUP BY status");
        $rows = $this->db->resultSet();
        $byStatus = [];
        $totalOrders = 0;
        foreach ($rows as $r) {
            $byStatus[$r->status] = (int)$r->cnt;
            $totalOrders += (int)$r->cnt;
        }

        // Orders per day (last 7 days)
        $this->db->query("
            SELECT DATE(created_at) AS d, COUNT(*) AS cnt
            FROM repair_orders
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(created_at)
            ORDER BY d ASC
        ");
        $dailyRows = $this->db->resultSet();
        $ordersLast7Days = array_map(function($r) {
            return ['date' => (string)$r->d, 'count' => (int)$r->cnt];
        }, $dailyRows ?: []);

        // Totals
        $counts = [];
        foreach ([
            'vehicles' => 'vehicles',
            'technicians' => 'technicians',
            'service_bays' => 'service_bays',
            'repair_categories' => 'repair_categories',
            'checklist_templates' => 'checklist_templates'
        ] as $k => $tbl) {
            $this->db->query("SELECT COUNT(*) AS cnt FROM {$tbl}");
            $obj = $this->db->single();
            $counts[$k] = $obj ? (int)$obj->cnt : 0;
        }

        $this->success([
            'totalOrders' => $totalOrders,
            'ordersByStatus' => $byStatus,
            'ordersLast7Days' => $ordersLast7Days,
            'counts' => $counts,
        ]);
    }

    // GET /api/report/stock_balance?location_id=all|1&group=item|location&q=&as_of=YYYY-MM-DD
    public function stock_balance() {
        $u = $this->requirePermission('reports.read');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') $this->error('Method Not Allowed', 405);

        $q = trim((string)($_GET['q'] ?? ''));
        $group = strtolower(trim((string)($_GET['group'] ?? 'item')));
        if (!in_array($group, ['item','location'], true)) $group = 'item';
        $asOf = trim((string)($_GET['as_of'] ?? ''));
        $asOfEnd = null;
        if ($asOf !== '') $asOfEnd = $asOf . ' 23:59:59';

        $locIds = $this->resolveLocationIds($u, $_GET['location_id'] ?? null, true);
        $inLoc = $this->inList('loc', $locIds);

        $whereParts = [];
        if ($q !== '') $whereParts[] = "(p.part_name LIKE :q OR p.sku LIKE :q OR p.part_number LIKE :q OR p.barcode_number LIKE :q)";
        $wherePartsSql = count($whereParts) ? ('AND ' . implode(' AND ', $whereParts)) : '';

        if ($group === 'location') {
            $sql = "
                SELECT
                  l.id AS location_id,
                  l.name AS location_name,
                  p.id AS id,
              p.id AS part_id,
                  p.part_name,
                  p.sku,
                  p.unit,
                  b.name AS brand_name,
                  p.reorder_level,
                  p.cost_price,
                  COALESCE(SUM(sm.qty_change), 0) AS qty
                FROM parts p
                CROSS JOIN service_locations l
                LEFT JOIN brands b ON b.id = p.brand_id
                LEFT JOIN stock_movements sm
                  ON sm.part_id = p.id AND sm.location_id = l.id
                  " . ($asOfEnd ? "AND sm.created_at <= :asOfEnd" : "") . "
                WHERE l.id IN ($inLoc)
                $wherePartsSql
                GROUP BY l.id, p.id
                ORDER BY l.name ASC, p.part_name ASC
            ";
            $this->db->query($sql);
            $this->bindInList('loc', $locIds);
            if ($q !== '') $this->db->bind(':q', '%' . $q . '%');
            if ($asOfEnd) $this->db->bind(':asOfEnd', $asOfEnd);
            $rows = $this->db->resultSet();
            $this->success($rows);
            return;
        }

        $sql = "
            SELECT
              p.id AS id,
              p.id AS part_id,
              p.part_name,
              p.sku,
              p.unit,
              b.name AS brand_name,
              p.reorder_level,
              p.cost_price,
              COALESCE(SUM(sm.qty_change), 0) AS location_stock_quantity,
              (SELECT COALESCE(SUM(qty_change), 0) FROM stock_movements WHERE part_id = p.id " . ($asOfEnd ? "AND created_at <= :asOfEnd" : "") . ") AS system_stock_quantity
            FROM parts p
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN stock_movements sm
              ON sm.part_id = p.id
             AND sm.location_id IN ($inLoc)
              " . ($asOfEnd ? "AND sm.created_at <= :asOfEnd" : "") . "
            WHERE p.item_type != 'Service'
            $wherePartsSql
            GROUP BY p.id
            ORDER BY p.part_name ASC
        ";
        $this->db->query($sql);
        $this->bindInList('loc', $locIds);
        if ($q !== '') $this->db->bind(':q', '%' . $q . '%');
        if ($asOfEnd) $this->db->bind(':asOfEnd', $asOfEnd);
        $rows = $this->db->resultSet();

        if ($group === 'item' && ($rows && count($rows) > 0) && (isset($_GET['batches']) && $_GET['batches'] == '1')) {
            $partIds = array_map(function($r) { return (int)$r->part_id; }, $rows);
            if (count($partIds) > 0) {
                $inParts = $this->inList('part', $partIds);
                
                // Calculate batch balances directly from the ledger (stock_movements)
                $batchSql = "
                    SELECT 
                        sm.part_id,
                        sm.batch_id,
                        ib.batch_number,
                        ib.mfg_date,
                        ib.expiry_date,
                        COALESCE(SUM(sm.qty_change), 0) AS quantity_on_hand
                    FROM stock_movements sm
                    LEFT JOIN inventory_batches ib ON ib.id = sm.batch_id
                    WHERE sm.part_id IN ($inParts)
                      AND sm.location_id IN ($inLoc)
                      " . ($asOfEnd ? "AND sm.created_at <= :asOfEnd" : "") . "
                    GROUP BY sm.part_id, sm.batch_id
                    HAVING ABS(quantity_on_hand) > 0.0001
                    ORDER BY sm.part_id ASC, ib.mfg_date ASC, sm.batch_id ASC
                ";
                $this->db->query($batchSql);
                $this->bindInList('part', $partIds);
                $this->bindInList('loc', $locIds);
                if ($asOfEnd) $this->db->bind(':asOfEnd', $asOfEnd);
                $ledgerBatches = $this->db->resultSet();
                
                // Map to items
                $batchMap = [];
                foreach ($ledgerBatches as $lb) {
                    $item = [
                        'id' => $lb->batch_id,
                        'batch_number' => $lb->batch_number ?? 'UNCLASSIFIED',
                        'mfg_date' => $lb->mfg_date ?? null,
                        'expiry_date' => $lb->expiry_date ?? null,
                        'quantity_on_hand' => (float)$lb->quantity_on_hand,
                        'is_unclassified' => ($lb->batch_id === null)
                    ];
                    $batchMap[$lb->part_id][] = $item;
                }
                
                foreach ($rows as $r) {
                    $r->batches = $batchMap[$r->part_id] ?? [];
                }
            }
        }

        $this->success($rows);
    }

    // GET /api/report/low_stock?location_id=all|1&q=
    public function low_stock() {
        $u = $this->requirePermission('reports.read');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') $this->error('Method Not Allowed', 405);
        $q = trim((string)($_GET['q'] ?? ''));
        $locIds = $this->resolveLocationIds($u, $_GET['location_id'] ?? null, true);
        $inLoc = $this->inList('loc', $locIds);

        $sql = "
            SELECT
              p.id AS id,
              p.id AS part_id,
              p.part_name,
              p.sku,
              p.unit,
              b.name AS brand_name,
              p.reorder_level,
              COALESCE(SUM(sm.qty_change), 0) AS qty
            FROM parts p
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN stock_movements sm
              ON sm.part_id = p.id AND sm.location_id IN ($inLoc)
            WHERE p.reorder_level IS NOT NULL
              AND p.reorder_level > 0
              " . ($q !== '' ? "AND (p.part_name LIKE :q OR p.sku LIKE :q)" : "") . "
            GROUP BY p.id
            HAVING qty <= p.reorder_level
            ORDER BY qty ASC, p.part_name ASC
        ";
        $this->db->query($sql);
        $this->bindInList('loc', $locIds);
        if ($q !== '') $this->db->bind(':q', '%' . $q . '%');
        $rows = $this->db->resultSet();
        $this->success($rows);
    }

    // GET /api/report/item_movements?part_id=1&location_id=all|1&from=YYYY-MM-DD&to=YYYY-MM-DD&movement_type=&limit=200&offset=0
    public function item_movements() {
        $u = $this->requirePermission('reports.read');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') $this->error('Method Not Allowed', 405);

        $partId = (int)($_GET['part_id'] ?? 0);
        if ($partId <= 0) $this->error('part_id is required', 400);

        $locIds = $this->resolveLocationIds($u, $_GET['location_id'] ?? null, true);
        $inLoc = $this->inList('loc', $locIds);
        $from = trim((string)($_GET['from'] ?? ''));
        $to = trim((string)($_GET['to'] ?? ''));
        $type = trim((string)($_GET['movement_type'] ?? ''));
        $limit = (int)($_GET['limit'] ?? 200);
        $offset = (int)($_GET['offset'] ?? 0);
        if ($limit <= 0) $limit = 200;
        if ($limit > 1000) $limit = 1000;
        if ($offset < 0) $offset = 0;

        $where = ["sm.location_id IN ($inLoc)", "sm.part_id = :pid"];
        if ($from !== '') $where[] = "sm.created_at >= :fromDt";
        if ($to !== '') $where[] = "sm.created_at <= :toDt";
        if ($type !== '') $where[] = "sm.movement_type = :mtype";
        $whereSql = implode(' AND ', $where);

        $sql = "
            SELECT
              sm.*,
              l.name AS location_name,
              p.part_name,
              p.sku,
              b.name AS brand_name,
              CASE
                WHEN sm.ref_table = 'goods_receive_notes' THEN (SELECT grn_number FROM goods_receive_notes g WHERE g.id = sm.ref_id LIMIT 1)
                WHEN sm.ref_table = 'stock_adjustments' THEN (SELECT adjustment_number FROM stock_adjustments a WHERE a.id = sm.ref_id LIMIT 1)
                WHEN sm.ref_table = 'stock_transfer_requests' THEN (SELECT transfer_number FROM stock_transfer_requests t WHERE t.id = sm.ref_id LIMIT 1)
                WHEN sm.ref_table = 'purchase_orders' THEN (SELECT po_number FROM purchase_orders po WHERE po.id = sm.ref_id LIMIT 1)
                ELSE NULL
              END AS doc_no
            FROM stock_movements sm
            INNER JOIN parts p ON p.id = sm.part_id
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN service_locations l ON l.id = sm.location_id
            WHERE $whereSql
            ORDER BY sm.created_at DESC, sm.id DESC
            LIMIT $limit OFFSET $offset
        ";
        $this->db->query($sql);
        $this->bindInList('loc', $locIds);
        $this->db->bind(':pid', $partId);
        if ($from !== '') $this->db->bind(':fromDt', $from . ' 00:00:00');
        if ($to !== '') $this->db->bind(':toDt', $to . ' 23:59:59');
        if ($type !== '') $this->db->bind(':mtype', $type);
        $rows = $this->db->resultSet();

        // Add a best-effort frontend link for common docs
        $out = array_map(function($r) {
            $refUrl = null;
            if ($r->ref_table === 'goods_receive_notes') $refUrl = '/inventory/grn/print/' . $r->ref_id;
            if ($r->ref_table === 'purchase_orders') $refUrl = '/inventory/purchase-orders/print/' . $r->ref_id;
            if ($r->ref_table === 'stock_adjustments') $refUrl = '/inventory/stock/adjustments/' . $r->ref_id;
            if ($r->ref_table === 'stock_transfer_requests') $refUrl = '/inventory/transfers/' . $r->ref_id;
            $r->ref_url = $refUrl;
            return $r;
        }, $rows ?: []);

        $this->success($out);
    }

    // GET /api/report/stock_transfers?location_id=all|1&from=YYYY-MM-DD&to=YYYY-MM-DD&status=
    public function stock_transfers() {
        $u = $this->requirePermission('reports.read');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') $this->error('Method Not Allowed', 405);

        $locIds = $this->resolveLocationIds($u, $_GET['location_id'] ?? null, true);
        $inFrom = $this->inList('fromloc', $locIds);
        $inTo = $this->inList('toloc', $locIds);
        $from = trim((string)($_GET['from'] ?? ''));
        $to = trim((string)($_GET['to'] ?? ''));
        $status = trim((string)($_GET['status'] ?? ''));

        $where = ["(r.from_location_id IN ($inFrom) OR r.to_location_id IN ($inTo))"];
        if ($from !== '') $where[] = "r.requested_at >= :fromDt";
        if ($to !== '') $where[] = "r.requested_at <= :toDt";
        if ($status !== '') $where[] = "r.status = :st";
        $whereSql = implode(' AND ', $where);

        $sql = "
            SELECT r.*,
                   lf.name AS from_location_name,
                   lt.name AS to_location_name,
                   COUNT(i.id) AS line_count,
                   COALESCE(SUM(i.qty), 0) AS total_qty,
                   COALESCE(SUM(i.qty * COALESCE(p.cost_price, 0)), 0) AS total_value_info
            FROM stock_transfer_requests r
            LEFT JOIN service_locations lf ON lf.id = r.from_location_id
            LEFT JOIN service_locations lt ON lt.id = r.to_location_id
            LEFT JOIN stock_transfer_items i ON i.transfer_id = r.id
            LEFT JOIN parts p ON p.id = i.part_id
            WHERE $whereSql
            GROUP BY r.id
            ORDER BY r.id DESC
        ";
        $this->db->query($sql);
        $this->bindInList('fromloc', $locIds);
        $this->bindInList('toloc', $locIds);
        if ($from !== '') $this->db->bind(':fromDt', $from . ' 00:00:00');
        if ($to !== '') $this->db->bind(':toDt', $to . ' 23:59:59');
        if ($status !== '') $this->db->bind(':st', $status);
        $rows = $this->db->resultSet();
        $this->success($rows);
    }

    // GET /api/report/vehicles?q=&department_id=
    public function vehicles() {
        $this->requirePermission('reports.read');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') $this->error('Method Not Allowed', 405);
        $q = trim((string)($_GET['q'] ?? ''));
        $dep = (int)($_GET['department_id'] ?? 0);

        $sql = "
            SELECT v.*,
                   d.name AS department_name
            FROM vehicles v
            LEFT JOIN departments d ON d.id = v.department_id
            WHERE 1=1
              " . ($dep > 0 ? "AND v.department_id = :dep" : "") . "
              " . ($q !== '' ? "AND (v.make LIKE :q OR v.model LIKE :q OR v.vin LIKE :q)" : "") . "
            ORDER BY v.id DESC
        ";
        $this->db->query($sql);
        if ($dep > 0) $this->db->bind(':dep', $dep);
        if ($q !== '') $this->db->bind(':q', '%' . $q . '%');
        $rows = $this->db->resultSet();
        $this->success($rows);
    }

    // GET /api/report/vehicle_history?vehicle_id=1&from=YYYY-MM-DD&to=YYYY-MM-DD
    public function vehicle_history() {
        $this->requirePermission('reports.read');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') $this->error('Method Not Allowed', 405);

        $vehicleId = (int)($_GET['vehicle_id'] ?? 0);
        if ($vehicleId <= 0) $this->error('vehicle_id is required', 400);
        $from = trim((string)($_GET['from'] ?? ''));
        $to = trim((string)($_GET['to'] ?? ''));

        $where = ["o.vehicle_id = :vid"];
        if ($from !== '') $where[] = "o.created_at >= :fromDt";
        if ($to !== '') $where[] = "o.created_at <= :toDt";
        $whereSql = implode(' AND ', $where);

        $sql = "
            SELECT
              o.*,
              sl.name AS location_name,
              COALESCE(SUM(COALESCE(op.line_total, (op.unit_cost * op.quantity))), 0) AS parts_value
            FROM repair_orders o
            LEFT JOIN service_locations sl ON sl.id = o.location_id
            LEFT JOIN order_parts op ON op.order_id = o.id
            WHERE $whereSql
            GROUP BY o.id
            ORDER BY o.created_at DESC, o.id DESC
        ";
        $this->db->query($sql);
        $this->db->bind(':vid', $vehicleId);
        if ($from !== '') $this->db->bind(':fromDt', $from . ' 00:00:00');
        if ($to !== '') $this->db->bind(':toDt', $to . ' 23:59:59');
        $rows = $this->db->resultSet();
        $this->success($rows);
    }

    // GET /api/report/items?q=&brand_id=&supplier_id=&active=1
    public function items() {
        $this->requirePermission('reports.read');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') $this->error('Method Not Allowed', 405);
        $q = trim((string)($_GET['q'] ?? ''));
        $brandId = (int)($_GET['brand_id'] ?? 0);
        $supplierId = (int)($_GET['supplier_id'] ?? 0);
        $active = isset($_GET['active']) ? (int)$_GET['active'] : -1;

        $where = ["1=1"];
        if ($q !== '') $where[] = "(p.part_name LIKE :q OR p.sku LIKE :q OR p.part_number LIKE :q OR p.barcode_number LIKE :q)";
        if ($brandId > 0) $where[] = "p.brand_id = :bid";
        if ($active === 0 || $active === 1) $where[] = "p.is_active = :act";
        if ($supplierId > 0) {
            $where[] = "EXISTS (SELECT 1 FROM part_suppliers ps WHERE ps.part_id = p.id AND ps.supplier_id = :sid)";
        }
        $whereSql = implode(' AND ', $where);

        $sql = "
            SELECT p.*, b.name AS brand_name
            FROM parts p
            LEFT JOIN brands b ON b.id = p.brand_id
            WHERE $whereSql
            ORDER BY p.part_name ASC
        ";
        $this->db->query($sql);
        if ($q !== '') $this->db->bind(':q', '%' . $q . '%');
        if ($brandId > 0) $this->db->bind(':bid', $brandId);
        if ($active === 0 || $active === 1) $this->db->bind(':act', $active);
        if ($supplierId > 0) $this->db->bind(':sid', $supplierId);
        $rows = $this->db->resultSet();
        $this->success($rows);
    }

    // GET /api/report/sales_summary?location_id=all|1&from=YYYY-MM-DD&to=YYYY-MM-DD
    public function sales_summary() {
        $u = $this->requirePermission('reports.read');
        $locIds = $this->resolveLocationIds($u, $_GET['location_id'] ?? null);
        $inLoc = $this->inList('loc', $locIds);
        $from = $_GET['from'] ?? date('Y-m-01');
        $to = $_GET['to'] ?? date('Y-m-d');

        $this->db->query("
            SELECT 
                DATE(issue_date) as date,
                COUNT(id) as invoice_count,
                SUM(subtotal) as total_subtotal,
                SUM(tax_total) as total_tax,
                SUM(discount_total) as total_discount,
                SUM(grand_total) as total_grand,
                SUM(paid_amount) as total_paid
            FROM invoices
            WHERE status != 'Cancelled'
            AND location_id IN ($inLoc)
            AND issue_date BETWEEN :from AND :to
            GROUP BY DATE(issue_date)
            ORDER BY DATE(issue_date) DESC
        ");
        $this->bindInList('loc', $locIds);
        $this->db->bind(':from', $from);
        $this->db->bind(':to', $to);
        $this->success($this->db->resultSet());
    }

    // GET /api/report/invoice_report?location_id=all|1&from=YYYY-MM-DD&to=YYYY-MM-DD&status=
    public function invoice_report() {
        $u = $this->requirePermission('reports.read');
        $locIds = $this->resolveLocationIds($u, $_GET['location_id'] ?? null);
        $inLoc = $this->inList('loc', $locIds);
        $from = $_GET['from'] ?? date('Y-m-01');
        $to = $_GET['to'] ?? date('Y-m-d');
        $status = $_GET['status'] ?? '';

        $sql = "
            SELECT i.*, c.name as customer_name, l.name as location_name
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.id
            LEFT JOIN service_locations l ON i.location_id = l.id
            WHERE i.location_id IN ($inLoc)
            AND i.issue_date BETWEEN :from AND :to
        ";
        if ($status) {
            $sql .= " AND i.status = :status";
        }
        $sql .= " ORDER BY i.issue_date DESC, i.id DESC";

        $this->db->query($sql);
        $this->bindInList('loc', $locIds);
        $this->db->bind(':from', $from);
        $this->db->bind(':to', $to);
        if ($status) $this->db->bind(':status', $status);
        $this->success($this->db->resultSet());
    }

    // GET /api/report/payment_receipt_report?location_id=all|1&from=YYYY-MM-DD&to=YYYY-MM-DD
    public function payment_receipt_report() {
        $u = $this->requirePermission('reports.read');
        $locIds = $this->resolveLocationIds($u, $_GET['location_id'] ?? null);
        $inLoc = $this->inList('loc', $locIds);
        $from = $_GET['from'] ?? date('Y-m-01');
        $to = $_GET['to'] ?? date('Y-m-d');

        $this->db->query("
            SELECT pr.*, l.name as location_name
            FROM payment_receipts pr
            LEFT JOIN service_locations l ON pr.location_id = l.id
            WHERE pr.location_id IN ($inLoc)
            AND pr.payment_date BETWEEN :from AND :to
            ORDER BY pr.payment_date DESC, pr.id DESC
        ");
        $this->bindInList('loc', $locIds);
        $this->db->bind(':from', $from);
        $this->db->bind(':to', $to);
        $this->success($this->db->resultSet());
    }

    // GET /api/report/day_end_sales?location_id=1&date=YYYY-MM-DD
    public function day_end_sales() {
        $u = $this->requirePermission('reports.read');
        $locIds = $this->resolveLocationIds($u, $_GET['location_id'] ?? null, false);
        $inLoc = $this->inList('loc', $locIds);
        $date = $_GET['date'] ?? date('Y-m-d');

        // 1. Sales Summary by Method (Invoices created today)
        $this->db->query("
            SELECT 
                COALESCE(SUM(grand_total), 0) as total_sales,
                COALESCE(SUM(paid_amount), 0) as total_received,
                COUNT(id) as invoice_count
            FROM invoices
            WHERE location_id IN ($inLoc) AND issue_date = :date AND status != 'Cancelled'
        ");
        $this->bindInList('loc', $locIds);
        $this->db->bind(':date', $date);
        $summary = $this->db->single();

        // 2. Payments by Method
        $this->db->query("
            SELECT payment_method, SUM(amount) as total
            FROM payment_receipts
            WHERE location_id IN ($inLoc) AND payment_date = :date AND status != 'Cancelled'
            GROUP BY payment_method
        ");
        $this->bindInList('loc', $locIds);
        $this->db->bind(':date', $date);
        $payments = $this->db->resultSet();

        // 3. Returns
        $this->db->query("
            SELECT COALESCE(SUM(total_amount), 0) as total_returns
            FROM sales_returns
            WHERE location_id IN ($inLoc) AND return_date = :date AND status = 'Completed'
        ");
        $this->bindInList('loc', $locIds);
        $this->db->bind(':date', $date);
        $returns = $this->db->single();

        // 4. Items Sold
        $this->db->query("
            SELECT 
                ii.description as name, 
                SUM(ii.quantity) as quantity, 
                SUM(ii.line_total) as total
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            WHERE i.location_id IN ($inLoc) AND i.issue_date = :date AND i.status != 'Cancelled'
            GROUP BY ii.description
            ORDER BY quantity DESC
        ");
        $this->bindInList('loc', $locIds);
        $this->db->bind(':date', $date);
        $items_sold = $this->db->resultSet();

        $this->success([
            'summary' => $summary,
            'payments' => $payments,
            'returns' => $returns->total_returns ?? 0,
            'items_sold' => $items_sold,
            'date' => $date
        ]);
    }

    // GET /api/report/location_sales?from=YYYY-MM-DD&to=YYYY-MM-DD
    public function location_sales() {
        $u = $this->requirePermission('reports.read');
        $from = $_GET['from'] ?? date('Y-m-01');
        $to = $_GET['to'] ?? date('Y-m-d');

        $this->db->query("
            SELECT 
                l.name as location_name,
                COUNT(i.id) as invoice_count,
                COALESCE(SUM(i.grand_total), 0) as total_sales,
                COALESCE(SUM(i.paid_amount), 0) as total_paid
            FROM service_locations l
            LEFT JOIN invoices i ON l.id = i.location_id AND i.status != 'Cancelled' AND i.issue_date BETWEEN :from AND :to
            GROUP BY l.id
            ORDER BY total_sales DESC
        ");
        $this->db->bind(':from', $from);
        $this->db->bind(':to', $to);
        $this->success($this->db->resultSet());
    }

    // GET /api/report/top_selling_items?location_id=all|1&from=YYYY-MM-DD&to=YYYY-MM-DD&limit=20
    public function top_selling_items() {
        $u = $this->requirePermission('reports.read');
        $locIds = $this->resolveLocationIds($u, $_GET['location_id'] ?? null);
        $inLoc = $this->inList('loc', $locIds);
        $from = $_GET['from'] ?? date('Y-m-01');
        $to = $_GET['to'] ?? date('Y-m-d');
        $limit = (int)($_GET['limit'] ?? 20);

        $this->db->query("
            SELECT 
                ii.description,
                ii.item_type,
                SUM(ii.quantity) as total_qty,
                SUM(ii.line_total) as total_revenue
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            WHERE i.status != 'Cancelled'
            AND i.location_id IN ($inLoc)
            AND i.issue_date BETWEEN :from AND :to
            GROUP BY ii.description, ii.item_type
            ORDER BY total_qty DESC
            LIMIT :limit
        ");
        $this->bindInList('loc', $locIds);
        $this->db->bind(':from', $from);
        $this->db->bind(':to', $to);
        $this->db->bind(':limit', $limit);
        $this->success($this->db->resultSet());
    }

    // GET /api/report/customer_sales?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=50
    public function customer_sales() {
        $u = $this->requirePermission('reports.read');
        $from = $_GET['from'] ?? date('Y-m-01');
        $to = $_GET['to'] ?? date('Y-m-d');
        $limit = (int)($_GET['limit'] ?? 50);

        $this->db->query("
            SELECT 
                c.name as customer_name,
                c.phone,
                COUNT(i.id) as invoice_count,
                SUM(i.grand_total) as total_sales,
                SUM(i.paid_amount) as total_paid,
                SUM(i.grand_total - i.paid_amount) as outstanding
            FROM customers c
            JOIN invoices i ON c.id = i.customer_id
            WHERE i.status != 'Cancelled'
            AND i.issue_date BETWEEN :from AND :to
            GROUP BY c.id
            ORDER BY total_sales DESC
            LIMIT :limit
        ");
        $this->db->bind(':from', $from);
        $this->db->bind(':to', $to);
        $this->db->bind(':limit', $limit);
        $this->success($this->db->resultSet());
    }

    // GET /api/report/tax_report?location_id=all|1&from=YYYY-MM-DD&to=YYYY-MM-DD
    public function tax_report() {
        $u = $this->requirePermission('reports.read');
        $locIds = $this->resolveLocationIds($u, $_GET['location_id'] ?? null);
        $inLoc = $this->inList('loc', $locIds);
        $from = $_GET['from'] ?? date('Y-m-01');
        $to = $_GET['to'] ?? date('Y-m-d');

        $this->db->query("
            SELECT 
                it.tax_name,
                SUM(it.tax_amount) as total_tax,
                SUM(it.taxable_amount) as total_taxable
            FROM invoice_taxes it
            JOIN invoices i ON it.invoice_id = i.id
            WHERE i.status != 'Cancelled'
            AND i.location_id IN ($inLoc)
            AND i.issue_date BETWEEN :from AND :to
            GROUP BY it.tax_name
        ");
        $this->bindInList('loc', $locIds);
        $this->db->bind(':from', $from);
        $this->db->bind(':to', $to);
        $this->success($this->db->resultSet());
    }

    // GET /api/report/database_audit
    public function database_audit() {
        @ini_set('display_errors', '0');
        @ini_set('memory_limit', '256M');
        @set_time_limit(60);

        $u = $this->requireAuth();
        if ($u['role'] !== 'Admin') {
            $this->error('Access Denied', 403);
            return;
        }

        $res = $this->db->rawQuery("SHOW TABLES");
        $tables = $res->fetchAll(PDO::FETCH_COLUMN);
        
        require_once dirname(__FILE__) . '/../core/SchemaDefinition.php';
        $defined = SchemaDefinition::get();

        $audit = [];
        // Combine all table names from both live and defined
        $allTableNames = array_unique(array_merge($tables, array_keys($defined)));
        sort($allTableNames);

        foreach ($allTableNames as $table) {
            $tableInfo = [
                'name' => $table,
                'live' => null,
                'defined' => $defined[$table] ?? null
            ];

            if (in_array($table, $tables)) {
                $liveInfo = [
                    'columns' => [],
                    'indexes' => []
                ];
                try {
                    // Columns
                    $resCol = $this->db->rawQuery("DESCRIBE `$table` ");
                    while ($c = $resCol->fetch(\PDO::FETCH_ASSOC)) {
                        $liveInfo['columns'][$c['Field']] = $c;
                    }
                    // Indexes
                    $resIdx = $this->db->rawQuery("SHOW INDEX FROM `$table` ");
                    while ($i = $resIdx->fetch(\PDO::FETCH_ASSOC)) {
                        $key = $i['Key_name'];
                        if (!isset($liveInfo['indexes'][$key])) {
                            $liveInfo['indexes'][$key] = [
                                'Key_name' => $key,
                                'Non_unique' => $i['Non_unique'],
                                'Columns' => []
                            ];
                        }
                        $liveInfo['indexes'][$key]['Columns'][] = $i['Column_name'];
                    }
                    $tableInfo['live'] = $liveInfo;
                } catch (\Exception $e) {
                    $tableInfo['live'] = 'CORRUPTED';
                    $tableInfo['error'] = $e->getMessage();
                }
            }

            $audit[] = $tableInfo;
        }

        // Optimization Checks
        $optimizations = [
            ['table' => 'invoices', 'index' => 'idx_inv_location'],
            ['table' => 'payment_receipts', 'index' => 'idx_pr_location'],
            ['table' => 'sales_returns', 'index' => 'idx_sr_location']
        ];

        $optStatus = [];
        foreach ($optimizations as $opt) {
            $table = $opt['table'];
            $index = $opt['index'];
            $check = $this->db->rawQuery("SHOW INDEX FROM `$table` WHERE Key_name = '$index'")->fetch();
            $optStatus[] = [
                'table' => $table,
                'index' => $index,
                'status' => $check ? 'success' : 'failed'
            ];
        }

        $this->success([
            'tables' => $audit,
            'optimizations' => $optStatus
        ]);
    }

    // GET /api/report/schema_diff
    public function schema_diff() {
        $u = $this->requireAuth();
        if ($u['role'] !== 'Admin') {
            $this->error('Access Denied', 403);
            return;
        }

        require_once dirname(__FILE__) . '/../core/SchemaHelper.php';
        $helper = new SchemaHelper($this->db);
        $diff = $helper->getDiff();
        $this->success($diff);
    }

    // POST /api/report/schema_sync
    public function schema_sync() {
        $u = $this->requireAuth();
        if ($u['role'] !== 'Admin') {
            $this->error('Access Denied', 403);
            return;
        }

        $tableName = $_GET['table'] ?? null;

        require_once dirname(__FILE__) . '/../core/SchemaHelper.php';
        $helper = new SchemaHelper($this->db);
        $diff = $helper->getDiff($tableName);
        
        if (isset($diff['error'])) {
            $this->error($diff['error']);
            return;
        }

        $results = $helper->sync($diff);
        $this->success($results);
    }

    // POST /api/report/schema_snapshot?table=name
    public function schema_snapshot() {
        $u = $this->requireAuth();
        if ($u['role'] !== 'Admin') {
            $this->error('Access Denied', 403);
            return;
        }

        $targetTable = $_GET['table'] ?? null;
        require_once dirname(__FILE__) . '/../core/SchemaDefinition.php';
        $currentSchema = SchemaDefinition::get();

        $res = $this->db->rawQuery("SHOW TABLES");
        $allLiveTables = $res->fetchAll(PDO::FETCH_COLUMN);

        $tablesToProcess = $targetTable ? [$targetTable] : $allLiveTables;
        
        // If we are doing a full snapshot, we'll start fresh. 
        // If we are doing a single table, we'll merge into currentSchema.
        $newSchema = $targetTable ? $currentSchema : [];

        foreach ($tablesToProcess as $table) {
            if (!in_array($table, $allLiveTables)) continue;

            $tableInfo = [
                'name' => $table,
                'columns' => [],
                'indexes' => []
            ];
            
            try {
                // Columns
                $resCol = $this->db->rawQuery("DESCRIBE `$table` ");
                while ($c = $resCol->fetch(\PDO::FETCH_ASSOC)) {
                    $tableInfo['columns'][$c['Field']] = $c;
                }
                // Indexes
                $resIdx = $this->db->rawQuery("SHOW INDEX FROM `$table` ");
                while ($i = $resIdx->fetch(\PDO::FETCH_ASSOC)) {
                    $key = $i['Key_name'];
                    if (!isset($tableInfo['indexes'][$key])) {
                        $tableInfo['indexes'][$key] = [
                            'Key_name' => $key,
                            'Non_unique' => $i['Non_unique'],
                            'Columns' => []
                        ];
                    }
                    $tableInfo['indexes'][$key]['Columns'][] = $i['Column_name'];
                }
                $newSchema[$table] = $tableInfo;
            } catch (\Exception $e) {
                // Skip corrupted tables during snapshot
                error_log("Skipping corrupted table '$table' during snapshot: " . $e->getMessage());
            }
        }

        // Sort by table name for consistency
        ksort($newSchema);

        $code = "<?php\n\nclass SchemaDefinition {\n    public static function get() {\n        return " . var_export($newSchema, true) . ";\n    }\n}\n";
        $filePath = dirname(__FILE__) . '/../core/SchemaDefinition.php';
        
        if (file_put_contents($filePath, $code)) {
            $this->success(null, $targetTable ? "Definition for '$targetTable' updated" : "System definition updated from live database structure");
        } else {
            $this->error('Failed to write SchemaDefinition.php');
        }
    }
    // POST /api/report/database_optimize
    public function database_optimize() {
        $u = $this->requireAuth();
        if ($u['role'] !== 'Admin') {
            $this->error('Access Denied', 403);
            return;
        }

        require_once dirname(__FILE__) . '/../core/SchemaHelper.php';
        $helper = new SchemaHelper($this->db);
        
        // Get diff but ONLY for missing indexes
        $diff = $helper->getDiff();
        
        if (empty($diff['missing_indexes'])) {
            $this->success(null, "Database is already optimized. No missing indexes found.");
            return;
        }

        // Apply only missing indexes
        $results = $helper->sync(['missing_tables' => [], 'missing_columns' => [], 'missing_indexes' => $diff['missing_indexes']]);
        
        $this->success($results, "Database optimization completed.");
    }

    // POST /api/report/database_drop?table=name
    public function database_drop() {
        $u = $this->requireAuth();
        if ($u['role'] !== 'Admin') {
            $this->error('Access Denied', 403);
            return;
        }

        $tableName = $_GET['table'] ?? null;
        if (!$tableName) {
            $this->error('Table name is required');
            return;
        }

        try {
            // Disable FK checks to allow dropping parent tables with corrupted metadata
            $this->db->rawQuery("SET FOREIGN_KEY_CHECKS = 0");
            $this->db->rawQuery("DROP TABLE IF EXISTS `$tableName` ");
            $this->db->rawQuery("SET FOREIGN_KEY_CHECKS = 1");

            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'action' => 'drop_table',
                'entity' => 'database',
                'entity_id' => 0,
                'method' => 'POST',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['table' => $tableName]),
            ]);
            $this->success(null, "Table $tableName dropped successfully");
        } catch (\Exception $e) {
            $this->error("Failed to drop table $tableName: " . $e->getMessage());
        }
    }
}
