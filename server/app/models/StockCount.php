<?php
/**
 * StockCount Model (auditing count sheets / Stock Take sessions)
 */
class StockCount extends Model {
    private function genNumber() {
        $dt = new DateTime('now');
        $stamp = $dt->format('Ymd-His');
        $rand = substr(strtoupper(bin2hex(random_bytes(3))), 0, 6);
        return "CNT-{$stamp}-{$rand}";
    }

    public function list($q = '', $locationId = 1, $status = null) {
        $locId = (int)$locationId;
        if ($locId <= 0) $locId = 1;
        $q = is_string($q) ? trim($q) : '';

        $statusCond = '';
        if ($status !== null && $status !== '') {
            $statusCond = " AND sc.status = :status ";
        }

        if ($q !== '') {
            $this->db->query("
                SELECT sc.*,
                       u.name AS created_by_name,
                       sl.name AS location_name,
                       COUNT(sci.id) AS line_count,
                       SUM(sci.variance) AS total_qty_change
                FROM stock_counts sc
                LEFT JOIN users u ON u.id = sc.created_by
                LEFT JOIN service_locations sl ON sl.id = sc.location_id
                LEFT JOIN stock_count_items sci ON sci.stock_count_id = sc.id
                WHERE sc.location_id = :loc {$statusCond} AND (sc.count_number LIKE :q OR sc.reason LIKE :q)
                GROUP BY sc.id
                ORDER BY sc.id DESC
            ");
            $this->db->bind(':q', '%' . $q . '%');
            $this->db->bind(':loc', $locId);
            if ($status !== null && $status !== '') {
                $this->db->bind(':status', $status);
            }
            return $this->db->resultSet();
        }

        $this->db->query("
            SELECT sc.*,
                   u.name AS created_by_name,
                   sl.name AS location_name,
                   COUNT(sci.id) AS line_count,
                   SUM(sci.variance) AS total_qty_change
            FROM stock_counts sc
            LEFT JOIN users u ON u.id = sc.created_by
            LEFT JOIN service_locations sl ON sl.id = sc.location_id
            LEFT JOIN stock_count_items sci ON sci.stock_count_id = sc.id
            WHERE sc.location_id = :loc {$statusCond}
            GROUP BY sc.id
            ORDER BY sc.id DESC
        ");
        $this->db->bind(':loc', $locId);
        if ($status !== null && $status !== '') {
            $this->db->bind(':status', $status);
        }
        return $this->db->resultSet();
    }

    public function getById($id, $locationId = 1) {
        $cid = (int)$id;
        $locId = (int)$locationId;
        if ($locId <= 0) $locId = 1;
        $this->db->query("
            SELECT sc.*, u.name AS created_by_name, u2.name AS approved_by_name, sl.name AS location_name
            FROM stock_counts sc
            LEFT JOIN users u ON u.id = sc.created_by
            LEFT JOIN users u2 ON u2.id = sc.approved_by
            LEFT JOIN service_locations sl ON sl.id = sc.location_id
            WHERE sc.id = :id AND sc.location_id = :loc
            LIMIT 1
        ");
        $this->db->bind(':id', $cid);
        $this->db->bind(':loc', $locId);
        $hdr = $this->db->single();
        if (!$hdr) return null;

        $this->db->query("
            SELECT sci.*, p.part_name, p.sku, p.unit, b.batch_number,
                   COALESCE(b.unit_cost, p.cost_price, 0) AS unit_cost,
                   p.price AS selling_price,
                   sci.variance AS qty_change
            FROM stock_count_items sci
            INNER JOIN parts p ON p.id = sci.part_id
            LEFT JOIN inventory_batches b ON b.id = sci.batch_id
            WHERE sci.stock_count_id = :id
            ORDER BY sci.id ASC
        ");
        $this->db->bind(':id', $cid);
        $items = $this->db->resultSet();

        return (object)[
            'adjustment' => $hdr, // Keep standard key name for front-end compatibility
            'items' => $items,
        ];
    }

    public function create($data, $userId = null, $locationId = 1) {
        $locId = (int)$locationId;
        if ($locId <= 0) $locId = 1;
        $items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];
        if (count($items) === 0) return false;

        $countedAt = $data['adjusted_at'] ?? null; // Map from front-end adjusted_at key
        if (!$countedAt) {
            $countedAt = (new DateTime('now'))->format('Y-m-d H:i:s');
        }

        // Normalize and merge duplicate part_ids
        $merged = [];
        foreach ($items as $it) {
            $pid = (int)($it['part_id'] ?? $it['partId'] ?? 0);
            $physical = $it['physical_stock'] ?? $it['physicalStock'] ?? null;
            $physical = ($physical === '' || $physical === null) ? null : (float)$physical;
            $note = isset($it['notes']) ? trim((string)$it['notes']) : null;
            $includeWhenZero = (bool)($it['include_when_zero'] ?? $it['includeWhenZero'] ?? false);
            $bid = (int)($it['batch_id'] ?? $it['batchId'] ?? 0);
            if ($pid <= 0) continue;
            if ($physical === null) continue;
            
            $key = $pid . '-' . $bid;
            if (!isset($merged[$key])) {
                $merged[$key] = ['part_id' => $pid, 'batch_id' => $bid, 'physical_stock' => $physical, 'notes' => [], 'include_when_zero' => false];
            }
            $merged[$key]['physical_stock'] = $physical;
            if ($includeWhenZero) $merged[$key]['include_when_zero'] = true;
            if ($note) $merged[$key]['notes'][] = $note;
        }
        $lines = array_values($merged);
        if (count($lines) === 0) return false;

        $countNumber = $this->genNumber();

        try {
            $this->db->exec("START TRANSACTION");

            // Create stock count session header
            $this->db->query("
                INSERT INTO stock_counts (location_id, count_number, counted_at, reason, notes, created_by, status)
                VALUES (:loc, :num, :dt, :reason, :notes, :u, 'Pending')
            ");
            $this->db->bind(':loc', $locId);
            $this->db->bind(':num', $countNumber);
            $this->db->bind(':dt', $countedAt);
            $this->db->bind(':reason', $data['reason'] ?? null);
            $this->db->bind(':notes', $data['notes'] ?? null);
            $this->db->bind(':u', $userId);
            $ok = $this->db->execute();
            if (!$ok) {
                $this->db->exec("ROLLBACK");
                return false;
            }
            $countId = (int)$this->db->lastInsertId();

            // Insert each line item
            foreach ($lines as $ln) {
                $pid = (int)$ln['part_id'];
                $physical = (float)($ln['physical_stock'] ?? 0);
                $includeWhenZero = (bool)($ln['include_when_zero'] ?? false);
                $note = null;
                if (!empty($ln['notes'])) {
                    $note = implode('; ', array_slice($ln['notes'], 0, 3));
                }

                $physical = round($physical, 3);
                if ($physical < 0) {
                    $this->db->exec("ROLLBACK");
                    return ['error' => "Invalid physical stock for part {$pid}"];
                }

                $system = 0;
                $bid = (int)($ln['batch_id'] ?? 0);

                if ($bid > 0) {
                    $this->db->query("SELECT quantity_on_hand FROM inventory_batches WHERE id = :id AND location_id = :loc");
                    $this->db->bind(':id', $bid);
                    $this->db->bind(':loc', $locId);
                    $btch = $this->db->single();
                    if (!$btch) {
                        $this->db->exec("ROLLBACK");
                        return ['error' => "Batch {$bid} not found at this location"];
                    }
                    $system = round((float)($btch->quantity_on_hand ?? 0), 3);
                } else {
                    $this->db->query("
                        SELECT COALESCE(SUM(qty_change), 0) AS local_qty 
                        FROM stock_movements 
                        WHERE part_id = :id AND location_id = :loc AND batch_id IS NULL
                    ");
                    $this->db->bind(':id', $pid);
                    $this->db->bind(':loc', $locId);
                    $res = $this->db->single();
                    $system = round((float)($res->local_qty ?? 0), 3);
                }

                $qty = round($physical - $system, 3); // variance
                if (abs($qty) < 0.0005) $qty = 0.000;

                // Insert count session item
                $this->db->query("
                    INSERT INTO stock_count_items (stock_count_id, part_id, batch_id, system_stock, physical_stock, variance, notes)
                    VALUES (:cid, :pid, :bid, :system_stock, :physical_stock, :qty, :notes)
                ");
                $this->db->bind(':cid', $countId);
                $this->db->bind(':pid', $pid);
                $this->db->bind(':bid', $bid > 0 ? $bid : null);
                $this->db->bind(':system_stock', $system);
                $this->db->bind(':physical_stock', $physical);
                $this->db->bind(':qty', $qty);
                $this->db->bind(':notes', $note);
                $this->db->execute();
            }

            $this->db->exec("COMMIT");
            return $countId;
        } catch (Throwable $e) {
            try { $this->db->exec("ROLLBACK"); } catch (Throwable $e2) {}
            return ['error' => 'Stock Count Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine()];
        }
    }

    /**
     * Approve a stock count session.
     * On approval, a completely separate, finalized StockAdjustment is spawned!
     */
    public function approve($id, $userId) {
        $cid = (int)$id;
        try {
            $this->db->exec("START TRANSACTION");

            // Lock and load stock count header
            $this->db->query("SELECT * FROM stock_counts WHERE id = :id FOR UPDATE");
            $this->db->bind(':id', $cid);
            $hdr = $this->db->single();
            if (!$hdr) {
                $this->db->exec("ROLLBACK");
                return ['error' => "Count session not found"];
            }
            if ($hdr->status !== 'Pending') {
                $this->db->exec("ROLLBACK");
                return ['error' => "Count session is already " . $hdr->status];
            }

            $locId = (int)$hdr->location_id;

            // Load stock count items
            $this->db->query("SELECT * FROM stock_count_items WHERE stock_count_id = :id FOR UPDATE");
            $this->db->bind(':id', $cid);
            $items = $this->db->resultSet();

            if (empty($items)) {
                $this->db->exec("ROLLBACK");
                return ['error' => "No items in count session"];
            }

            // Create a brand new, separate StockAdjustment record
            require_once __DIR__ . '/StockAdjustment.php';
            $adjModel = new StockAdjustment();

            $adjItems = [];
            foreach ($items as $it) {
                $adjItems[] = [
                    'part_id' => $it->part_id,
                    'batch_id' => $it->batch_id,
                    'physical_stock' => $it->physical_stock,
                    'notes' => $it->notes,
                    'include_when_zero' => true
                ];
            }

            $adjPayload = [
                'reason' => 'Stock count commitment: ' . $hdr->count_number,
                'notes' => 'Generated automatically from approved Stock Count sheet ID #' . $hdr->id . '. Count notes: ' . ($hdr->notes ?? '-'),
                'items' => $adjItems
            ];

            // StockAdjustment->create executes immediately and commits the stock balance updates!
            $adjId = $adjModel->create($adjPayload, $userId, $locId);

            if (is_array($adjId) && isset($adjId['error'])) {
                $this->db->exec("ROLLBACK");
                return ['error' => "Spawn Adjustment Failed: " . $adjId['error']];
            }
            if (!$adjId) {
                $this->db->exec("ROLLBACK");
                return ['error' => "Failed to spawn stock adjustment transaction"];
            }

            // Update Stock Count header status to Approved
            $this->db->query("
                UPDATE stock_counts 
                SET status = 'Approved', approved_by = :u, approved_at = NOW() 
                WHERE id = :id
            ");
            $this->db->bind(':u', $userId);
            $this->db->bind(':id', $cid);
            $this->db->execute();

            $this->db->exec("COMMIT");
            return true;
        } catch (Throwable $e) {
            try { $this->db->exec("ROLLBACK"); } catch (Throwable $e2) {}
            return ['error' => 'Approve Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine()];
        }
    }

    /**
     * Reject a pending count session.
     */
    public function reject($id, $userId) {
        $cid = (int)$id;
        try {
            $this->db->exec("START TRANSACTION");

            // Lock and load header
            $this->db->query("SELECT * FROM stock_counts WHERE id = :id FOR UPDATE");
            $this->db->bind(':id', $cid);
            $hdr = $this->db->single();
            if (!$hdr) {
                $this->db->exec("ROLLBACK");
                return ['error' => "Count session not found"];
            }
            if ($hdr->status !== 'Pending') {
                $this->db->exec("ROLLBACK");
                return ['error' => "Count session is already " . $hdr->status];
            }

            // Set to Rejected
            $this->db->query("
                UPDATE stock_counts 
                SET status = 'Rejected', approved_by = :u, approved_at = NOW() 
                WHERE id = :id
            ");
            $this->db->bind(':u', $userId);
            $this->db->bind(':id', $cid);
            $this->db->execute();

            $this->db->exec("COMMIT");
            return true;
        } catch (Throwable $e) {
            try { $this->db->exec("ROLLBACK"); } catch (Throwable $e2) {}
            return ['error' => 'Reject Error: ' . $e->getMessage()];
        }
    }
}
