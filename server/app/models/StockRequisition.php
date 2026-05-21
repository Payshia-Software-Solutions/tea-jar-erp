<?php
/**
 * StockRequisition Model
 * Destination location requests stock; shipments are created separately.
 */
class StockRequisition extends Model {
    private function ensureSchema() {
        InventorySchema::ensure();
    }

    private function nextDocNumber($docType, $locationId = 1) {
        require_once __DIR__ . '/../helpers/DocumentSequenceHelper.php';
        return DocumentSequenceHelper::getStandardDocNo($docType, $locationId);
    }

    public function listOpen() {
        $this->ensureSchema();
        $sql = "
            SELECT r.*,
                   lf.name AS from_location_name,
                   sl.name AS to_location_name,
                   u.name AS created_by_name,
                   u2.name AS approved_by_name,
                   COUNT(i.id) AS line_count,
                   SUM(i.qty_requested) AS total_qty_requested,
                   SUM(i.qty_fulfilled) AS total_qty_fulfilled
            FROM stock_transfer_requisitions r
            LEFT JOIN service_locations lf ON lf.id = r.from_location_id
            LEFT JOIN service_locations sl ON sl.id = r.to_location_id
            LEFT JOIN users u ON u.id = r.created_by
            LEFT JOIN users u2 ON u2.id = r.approved_by
            LEFT JOIN stock_transfer_requisition_items i ON i.requisition_id = r.id
            WHERE r.status IN ('Requested','Approved')
            GROUP BY r.id
            ORDER BY r.id DESC
        ";
        $this->db->query($sql);
        return $this->db->resultSet();
    }

    private function genNumber($locationId = 1) {
        // Keep old method as fallback; prefer sequential doc numbers.
        try {
            return $this->nextDocNumber('REQ', $locationId);
        } catch (Exception $e) {
            $dt = new DateTime('now');
            $stamp = $dt->format('Ymd');
            $rand = substr(strtoupper(bin2hex(random_bytes(3))), 0, 6);
            return "REQ-{$stamp}-{$rand}";
        }
    }

    public function listByLocations($locationIds = []) {
        $this->ensureSchema();
        $ids = array_values(array_filter(array_map('intval', (array)$locationIds), function($x) { return $x > 0; }));
        if (count($ids) === 0) return [];
        $in = implode(',', array_fill(0, count($ids), '?'));
        $sql = "
            SELECT r.*,
                   lf.name AS from_location_name,
                   sl.name AS to_location_name,
                   u.name AS created_by_name,
                   u2.name AS approved_by_name,
                   COUNT(i.id) AS line_count,
                   SUM(i.qty_requested) AS total_qty_requested,
                   SUM(i.qty_fulfilled) AS total_qty_fulfilled
            FROM stock_transfer_requisitions r
            LEFT JOIN service_locations lf ON lf.id = r.from_location_id
            LEFT JOIN service_locations sl ON sl.id = r.to_location_id
            LEFT JOIN users u ON u.id = r.created_by
            LEFT JOIN users u2 ON u2.id = r.approved_by
            LEFT JOIN stock_transfer_requisition_items i ON i.requisition_id = r.id
            WHERE r.to_location_id IN ($in)
            GROUP BY r.id
            ORDER BY r.id DESC
        ";
        $this->db->query($sql);
        foreach ($ids as $i => $id) {
            $this->db->bind(($i + 1), $id);
        }
        return $this->db->resultSet();
    }

    public function getById($id) {
        $this->ensureSchema();
        $this->db->query("
            SELECT r.*, lf.name AS from_location_name, sl.name AS to_location_name
            FROM stock_transfer_requisitions r
            LEFT JOIN service_locations lf ON lf.id = r.from_location_id
            LEFT JOIN service_locations sl ON sl.id = r.to_location_id
            WHERE r.id = :id LIMIT 1
        ");
        $this->db->bind(':id', (int)$id);
        $hdr = $this->db->single();
        if (!$hdr) return null;

        $this->db->query("
            SELECT i.*, p.part_name, p.sku, p.unit, b.name AS brand_name
            FROM stock_transfer_requisition_items i
            INNER JOIN parts p ON p.id = i.part_id
            LEFT JOIN brands b ON b.id = p.brand_id
            WHERE i.requisition_id = :id
            ORDER BY i.id ASC
        ");
        $this->db->bind(':id', (int)$id);
        $items = $this->db->resultSet();

        return (object)[
            'requisition' => $hdr,
            'items' => $items,
        ];
    }

    public function create($data, $userId = null) {
        $this->ensureSchema();
        $fromId = (int)($data['from_location_id'] ?? $data['fromLocationId'] ?? 0);
        $toId = (int)($data['to_location_id'] ?? $data['toLocationId'] ?? 0);
        if ($toId <= 0) return false;

        $items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];
        if (count($items) === 0) return false;

        $merged = [];
        foreach ($items as $it) {
            $pid = (int)($it['part_id'] ?? $it['partId'] ?? 0);
            $qty = $it['qty_requested'] ?? $it['qty'] ?? $it['quantity'] ?? null;
            $qty = ($qty === '' || $qty === null) ? null : (float)$qty;
            $note = isset($it['notes']) ? trim((string)$it['notes']) : null;
            if ($pid <= 0 || $qty === null || $qty <= 0) continue;
            if (!isset($merged[$pid])) $merged[$pid] = ['qty' => 0.0, 'notes' => []];
            $merged[$pid]['qty'] += $qty;
            if ($note) $merged[$pid]['notes'][] = $note;
        }
        if (count($merged) === 0) return false;

        $num = trim((string)($data['requisition_number'] ?? ''));
        if ($num === '') $num = $this->genNumber($toId);
        $requestedAt = $data['requested_at'] ?? null;
        if (!$requestedAt) $requestedAt = (new DateTime('now'))->format('Y-m-d H:i:s');

        try {
            $this->db->exec("START TRANSACTION");
            $this->db->query("
                INSERT INTO stock_transfer_requisitions
                (requisition_number, from_location_id, to_location_id, status, requested_at, notes, created_by)
                VALUES (:num, :from_id, :to_id, 'Requested', :dt, :notes, :u)
            ");
            $this->db->bind(':num', $num);
            $this->db->bind(':from_id', $fromId > 0 ? $fromId : null);
            $this->db->bind(':to_id', $toId);
            $this->db->bind(':dt', $requestedAt);
            $this->db->bind(':notes', $data['notes'] ?? null);
            $this->db->bind(':u', $userId);
            $ok = $this->db->execute();
            if (!$ok) {
                $this->db->exec("ROLLBACK");
                return false;
            }
            $id = (int)$this->db->lastInsertId();

            foreach ($merged as $pid => $row) {
                $notes = count($row['notes']) ? implode('; ', $row['notes']) : null;
                $this->db->query("
                    INSERT INTO stock_transfer_requisition_items (requisition_id, part_id, qty_requested, qty_fulfilled, notes)
                    VALUES (:rid, :pid, :qty, 0.000, :notes)
                ");
                $this->db->bind(':rid', $id);
                $this->db->bind(':pid', (int)$pid);
                $this->db->bind(':qty', (float)$row['qty']);
                $this->db->bind(':notes', $notes);
                $this->db->execute();
            }

            $this->db->exec("COMMIT");
            return $id;
        } catch (Exception $e) {
            try { $this->db->exec("ROLLBACK"); } catch (Exception $e2) {}
            return false;
        }
    }

    public function approve($id, $userId = null) {
        $this->ensureSchema();
        $rid = (int)$id;
        if ($rid <= 0) return false;
        $this->db->query("UPDATE stock_transfer_requisitions SET status = 'Approved', approved_by = :u, approved_at = NOW() WHERE id = :id AND status = 'Requested'");
        $this->db->bind(':u', $userId);
        $this->db->bind(':id', $rid);
        return $this->db->execute();
    }

    public function markFulfilledIfComplete($id) {
        $this->ensureSchema();
        $rid = (int)$id;
        if ($rid <= 0) return false;
        $this->db->query("
            SELECT COUNT(*) AS open_lines
            FROM stock_transfer_requisition_items
            WHERE requisition_id = :id AND qty_fulfilled < qty_requested
        ");
        $this->db->bind(':id', $rid);
        $row = $this->db->single();
        $open = (int)($row->open_lines ?? 0);
        if ($open > 0) return true;
        $this->db->query("UPDATE stock_transfer_requisitions SET status = 'Fulfilled' WHERE id = :id AND status IN ('Requested','Approved')");
        $this->db->bind(':id', $rid);
        return $this->db->execute();
    }

    public function addFulfilledQty($id, $partId, $qty) {
        $this->ensureSchema();
        $rid = (int)$id;
        $pid = (int)$partId;
        $qty = (float)$qty;
        if ($rid <= 0 || $pid <= 0 || $qty <= 0) return false;
        $this->db->query("
            UPDATE stock_transfer_requisition_items
            SET qty_fulfilled = qty_fulfilled + :qty
            WHERE requisition_id = :rid AND part_id = :pid
        ");
        $this->db->bind(':qty', $qty);
        $this->db->bind(':rid', $rid);
        $this->db->bind(':pid', $pid);
        return $this->db->execute();
    }
}
