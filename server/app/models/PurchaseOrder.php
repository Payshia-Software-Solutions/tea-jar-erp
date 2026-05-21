<?php
/**
 * PurchaseOrder Model
 */
class PurchaseOrder extends Model {
    private $table = 'purchase_orders';

    private function ensureSchema() {
        InventorySchema::ensure();
    }

    private function nextDocNumber($docType, $locationId = 1) {
        require_once __DIR__ . '/../helpers/DocumentSequenceHelper.php';
        return DocumentSequenceHelper::getStandardDocNo($docType, $locationId);
    }

    public function list($q = '', $locationId = 1) {
        $this->ensureSchema();
        $locId = (int)$locationId;
        if ($locId <= 0) $locId = 1;
        $q = is_string($q) ? trim($q) : '';
        if ($q !== '') {
            $this->db->query("
                SELECT po.*, s.name AS supplier_name, u.name AS created_by_name, sl.name AS location_name,
                       (SELECT grn_number FROM goods_receive_notes WHERE purchase_order_id = po.id ORDER BY id DESC LIMIT 1) as last_grn_number
                FROM {$this->table} po
                INNER JOIN suppliers s ON s.id = po.supplier_id
                LEFT JOIN users u ON u.id = po.created_by
                LEFT JOIN service_locations sl ON sl.id = po.location_id
                WHERE po.location_id = :loc AND (po.po_number LIKE :q OR s.name LIKE :q)
                ORDER BY po.id DESC
            ");
            $this->db->bind(':loc', $locId);
            $this->db->bind(':q', '%' . $q . '%');
            return $this->db->resultSet();
        }

        $this->db->query("
            SELECT po.*, s.name AS supplier_name, u.name AS created_by_name, sl.name AS location_name,
                   (SELECT grn_number FROM goods_receive_notes WHERE purchase_order_id = po.id ORDER BY id DESC LIMIT 1) as last_grn_number
            FROM {$this->table} po
            INNER JOIN suppliers s ON s.id = po.supplier_id
            LEFT JOIN users u ON u.id = po.created_by
            LEFT JOIN service_locations sl ON sl.id = po.location_id
            WHERE po.location_id = :loc
            ORDER BY po.id DESC
        ");
        $this->db->bind(':loc', $locId);
        return $this->db->resultSet();
    }

    public function getById($id, $locationId = 1) {
        $this->ensureSchema();
        $locId = (int)$locationId;
        if ($locId <= 0) $locId = 1;
        $this->db->query("
            SELECT po.*, s.name AS supplier_name, u.name AS created_by_name,
                   g.grn_number AS last_grn_number, sl.name AS location_name
            FROM {$this->table} po
            INNER JOIN suppliers s ON s.id = po.supplier_id
            LEFT JOIN users u ON u.id = po.created_by
            LEFT JOIN service_locations sl ON sl.id = po.location_id
            LEFT JOIN (
                SELECT purchase_order_id, MAX(id) AS last_grn_id
                FROM goods_receive_notes
                WHERE purchase_order_id IS NOT NULL
                GROUP BY purchase_order_id
            ) lg ON lg.purchase_order_id = po.id
            LEFT JOIN goods_receive_notes g ON g.id = lg.last_grn_id
            WHERE po.id = :id AND po.location_id = :loc
            LIMIT 1
        ");
        $this->db->bind(':id', (int)$id);
        $this->db->bind(':loc', $locId);
        $po = $this->db->single();
        if (!$po) return null;

        $this->db->query("
            SELECT i.*, p.part_name, p.sku, b.name AS brand_name
            FROM purchase_order_items i
            INNER JOIN parts p ON p.id = i.part_id
            LEFT JOIN brands b ON b.id = p.brand_id
            WHERE i.purchase_order_id = :id
            ORDER BY i.id ASC
        ");
        $this->db->bind(':id', (int)$id);
        $items = $this->db->resultSet();

        return (object)[
            'purchase_order' => $po,
            'items' => $items,
        ];
    }

    public function create($data, $userId = null, $locationId = 1) {
        $this->ensureSchema();
        $locId = (int)$locationId;
        if ($locId <= 0) $locId = 1;
        $supplierId = (int)($data['supplier_id'] ?? 0);
        $items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];
        if ($supplierId <= 0 || count($items) === 0) return false;

        // Merge duplicate items (same part_id) so the PO always has a single row per item.
        // If duplicate lines have conflicting unit_cost values, we reject the create.
        $mergedItems = [];
        foreach ($items as $it) {
            $partId = (int)($it['part_id'] ?? $it['partId'] ?? 0);
            $qty = round((float)($it['qty_ordered'] ?? $it['qty'] ?? 0), 3);
            $unitCost = (float)($it['unit_cost'] ?? $it['unitCost'] ?? 0);
            if ($partId <= 0 || $qty <= 0 || $unitCost < 0) continue;
            if (!isset($mergedItems[$partId])) {
                $mergedItems[$partId] = ['part_id' => $partId, 'qty' => 0.0, 'unit_cost' => $unitCost];
            } else {
                $prevCost = (float)$mergedItems[$partId]['unit_cost'];
                if (abs($prevCost - $unitCost) > 0.0001) return false;
            }
            $mergedItems[$partId]['qty'] = round(((float)$mergedItems[$partId]['qty']) + $qty, 3);
        }
        if (count($mergedItems) === 0) return false;

        try {
            $this->db->exec("START TRANSACTION");

            $poNumber = trim((string)($data['po_number'] ?? ''));
            if ($poNumber === '') {
                $poNumber = $this->nextDocNumber('PO', $locId);
            }

            $this->db->query("
                INSERT INTO {$this->table}
                (location_id, supplier_id, po_number, status, notes, ordered_at, expected_at, created_by, updated_by)
                VALUES
                (:location_id, :supplier_id, :po_number, :status, :notes, :ordered_at, :expected_at, :created_by, :updated_by)
            ");
            $this->db->bind(':location_id', $locId);
            $this->db->bind(':supplier_id', $supplierId);
            $this->db->bind(':po_number', $poNumber);
            $this->db->bind(':status', $data['status'] ?? 'Draft');
            $this->db->bind(':notes', $data['notes'] ?? null);
            $this->db->bind(':ordered_at', $data['ordered_at'] ?? null);
            $this->db->bind(':expected_at', $data['expected_at'] ?? null);
            $this->db->bind(':created_by', $userId);
            $this->db->bind(':updated_by', $userId);
            $ok = $this->db->execute();
            if (!$ok) {
                $this->db->exec("ROLLBACK");
                return false;
            }
            $poId = (int)$this->db->lastInsertId();

            foreach ($mergedItems as $row) {
                $partId = (int)$row['part_id'];
                $qty = round((float)$row['qty'], 3);
                $unitCost = (float)$row['unit_cost'];
                if ($partId <= 0 || $qty <= 0 || $unitCost < 0) continue;
                $lineTotal = round($qty * $unitCost, 2);

                $this->db->query("
                    INSERT INTO purchase_order_items
                    (purchase_order_id, part_id, qty_ordered, unit_cost, received_qty, line_total)
                    VALUES (:po_id, :part_id, :qty, :unit_cost, 0, :line_total)
                ");
                $this->db->bind(':po_id', $poId);
                $this->db->bind(':part_id', $partId);
                $this->db->bind(':qty', $qty);
                $this->db->bind(':unit_cost', $unitCost);
                $this->db->bind(':line_total', $lineTotal);
                $this->db->execute();
            }

            $this->db->exec("COMMIT");
            return $poId;
        } catch (Exception $e) {
            try { $this->db->exec("ROLLBACK"); } catch (Exception $e2) {}
            return false;
        }
    }

    public function update($id, $data, $userId = null) {
        $this->ensureSchema();
        $poId = (int)$id;
        if ($poId <= 0) return false;

        $supplierId = (int)($data['supplier_id'] ?? 0);
        $items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];
        if ($supplierId <= 0 || count($items) === 0) return false;

        // Merge duplicate items (same part_id) so the PO always has a single row per item.
        // If duplicate lines have conflicting unit_cost values, we reject the update.
        $mergedItems = [];
        foreach ($items as $it) {
            $partId = (int)($it['part_id'] ?? $it['partId'] ?? 0);
            $qty = round((float)($it['qty_ordered'] ?? $it['qty'] ?? 0), 3);
            $unitCost = (float)($it['unit_cost'] ?? $it['unitCost'] ?? 0);
            if ($partId <= 0 || $qty <= 0 || $unitCost < 0) continue;
            if (!isset($mergedItems[$partId])) {
                $mergedItems[$partId] = ['part_id' => $partId, 'qty' => 0.0, 'unit_cost' => $unitCost];
            } else {
                $prevCost = (float)$mergedItems[$partId]['unit_cost'];
                if (abs($prevCost - $unitCost) > 0.0001) return false;
            }
            $mergedItems[$partId]['qty'] = round(((float)$mergedItems[$partId]['qty']) + $qty, 3);
        }
        if (count($mergedItems) === 0) return false;

        try {
            $this->db->exec("START TRANSACTION");

            // Only allow editing if not received/cancelled
            $this->db->query("SELECT status FROM {$this->table} WHERE id = :id FOR UPDATE");
            $this->db->bind(':id', $poId);
            $row = $this->db->single();
            if (!$row) {
                $this->db->exec("ROLLBACK");
                return false;
            }
            $status = (string)($row->status ?? '');
            if (in_array($status, ['Received', 'Cancelled'], true)) {
                $this->db->exec("ROLLBACK");
                return false;
            }

            $this->db->query("
                UPDATE {$this->table}
                SET supplier_id = :supplier_id,
                    notes = :notes,
                    ordered_at = :ordered_at,
                    expected_at = :expected_at,
                    updated_by = :updated_by
                WHERE id = :id
            ");
            $this->db->bind(':supplier_id', $supplierId);
            $this->db->bind(':notes', $data['notes'] ?? null);
            $this->db->bind(':ordered_at', $data['ordered_at'] ?? null);
            $this->db->bind(':expected_at', $data['expected_at'] ?? null);
            $this->db->bind(':updated_by', $userId);
            $this->db->bind(':id', $poId);
            $this->db->execute();

            // Replace items (keep it simple; received_qty resets only while not received)
            $this->db->query("DELETE FROM purchase_order_items WHERE purchase_order_id = :id");
            $this->db->bind(':id', $poId);
            $this->db->execute();

            foreach ($mergedItems as $row) {
                $partId = (int)$row['part_id'];
                $qty = round((float)$row['qty'], 3);
                $unitCost = (float)$row['unit_cost'];
                if ($partId <= 0 || $qty <= 0 || $unitCost < 0) continue;
                $lineTotal = round($qty * $unitCost, 2);

                $this->db->query("
                    INSERT INTO purchase_order_items
                    (purchase_order_id, part_id, qty_ordered, unit_cost, received_qty, line_total)
                    VALUES (:po_id, :part_id, :qty, :unit_cost, 0, :line_total)
                ");
                $this->db->bind(':po_id', $poId);
                $this->db->bind(':part_id', $partId);
                $this->db->bind(':qty', $qty);
                $this->db->bind(':unit_cost', $unitCost);
                $this->db->bind(':line_total', $lineTotal);
                $this->db->execute();
            }

            $this->db->exec("COMMIT");
            return true;
        } catch (Exception $e) {
            try { $this->db->exec("ROLLBACK"); } catch (Exception $e2) {}
            return false;
        }
    }

    public function setStatus($id, $status, $userId = null) {
        $this->ensureSchema();
        $poId = (int)$id;
        // "Cancelled" status marking is intentionally disabled in the UI and API.
        $allowed = ['Draft', 'Approved', 'Sent', 'Partially Received', 'Received'];
        if ($poId <= 0 || !in_array($status, $allowed, true)) return false;

        $this->db->query("UPDATE {$this->table} SET status = :s, updated_by = :u WHERE id = :id");
        $this->db->bind(':s', $status);
        $this->db->bind(':u', $userId);
        $this->db->bind(':id', $poId);
        return $this->db->execute();
    }

    public function applyReceipt($poId) {
        // Recompute PO status based on received_qty vs qty_ordered.
        $this->ensureSchema();
        $id = (int)$poId;
        if ($id <= 0) return false;
        $this->db->query("
            SELECT SUM(CASE WHEN received_qty >= qty_ordered THEN 1 ELSE 0 END) AS done_cnt,
                   COUNT(*) AS total_cnt
            FROM purchase_order_items
            WHERE purchase_order_id = :id
        ");
        $this->db->bind(':id', $id);
        $row = $this->db->single();
        $done = (int)($row->done_cnt ?? 0);
        $total = (int)($row->total_cnt ?? 0);
        if ($total <= 0) return false;
        $status = ($done >= $total) ? 'Received' : 'Partially Received';
        $this->db->query("UPDATE {$this->table} SET status = :s WHERE id = :id AND status <> 'Cancelled'");
        $this->db->bind(':s', $status);
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
