<?php
/**
 * StockAdjustment Model (batch adjustments)
 */
class StockAdjustment extends Model {
    private function ensureSchema() { return;
        InventorySchema::ensure();
    }

    private function genNumber() {
        $dt = new DateTime('now');
        $stamp = $dt->format('Ymd-His');
        $rand = substr(strtoupper(bin2hex(random_bytes(3))), 0, 6);
        return "ADJ-{$stamp}-{$rand}";
    }

    public function list($q = '', $locationId = 1) {
        // $this->ensureSchema();
        $locId = (int)$locationId;
        if ($locId <= 0) $locId = 1;
        $q = is_string($q) ? trim($q) : '';
        if ($q !== '') {
            $this->db->query("
                SELECT sa.*,
                       u.name AS created_by_name,
                       sl.name AS location_name,
                       COUNT(sai.id) AS line_count,
                       SUM(sai.qty_change) AS total_qty_change
                FROM stock_adjustments sa
                LEFT JOIN users u ON u.id = sa.created_by
                LEFT JOIN service_locations sl ON sl.id = sa.location_id
                LEFT JOIN stock_adjustment_items sai ON sai.stock_adjustment_id = sa.id
                WHERE sa.location_id = :loc AND (sa.adjustment_number LIKE :q OR sa.reason LIKE :q)
                GROUP BY sa.id
                ORDER BY sa.id DESC
            ");
            $this->db->bind(':q', '%' . $q . '%');
            $this->db->bind(':loc', $locId);
            return $this->db->resultSet();
        }

        $this->db->query("
            SELECT sa.*,
                   u.name AS created_by_name,
                   sl.name AS location_name,
                   COUNT(sai.id) AS line_count,
                   SUM(sai.qty_change) AS total_qty_change
            FROM stock_adjustments sa
            LEFT JOIN users u ON u.id = sa.created_by
            LEFT JOIN service_locations sl ON sl.id = sa.location_id
            LEFT JOIN stock_adjustment_items sai ON sai.stock_adjustment_id = sa.id
            WHERE sa.location_id = :loc
            GROUP BY sa.id
            ORDER BY sa.id DESC
        ");
        $this->db->bind(':loc', $locId);
        return $this->db->resultSet();
    }

    public function getById($id, $locationId = 1) {
        // $this->ensureSchema();
        $aid = (int)$id;
        $locId = (int)$locationId;
        if ($locId <= 0) $locId = 1;
        $this->db->query("
            SELECT sa.*, u.name AS created_by_name, sl.name AS location_name
            FROM stock_adjustments sa
            LEFT JOIN users u ON u.id = sa.created_by
            LEFT JOIN service_locations sl ON sl.id = sa.location_id
            WHERE sa.id = :id AND sa.location_id = :loc
            LIMIT 1
        ");
        $this->db->bind(':id', $aid);
        $this->db->bind(':loc', $locId);
        $hdr = $this->db->single();
        if (!$hdr) return null;

        $this->db->query("
            SELECT sai.*, p.part_name, p.sku, p.unit, b.batch_number, 
                   COALESCE(b.unit_cost, p.cost_price, 0) AS unit_cost
            FROM stock_adjustment_items sai
            INNER JOIN parts p ON p.id = sai.part_id
            LEFT JOIN inventory_batches b ON b.id = sai.batch_id
            WHERE sai.stock_adjustment_id = :id
            ORDER BY sai.id ASC
        ");
        $this->db->bind(':id', $aid);
        $items = $this->db->resultSet();

        return (object)[
            'adjustment' => $hdr,
            'items' => $items,
        ];
    }

    /**
     * Create an adjustment batch.
     *
     * $data:
     * - adjusted_at, reason, notes
     * - items[{part_id, physical_stock, notes?, include_when_zero?}]
     *
     * Behavior:
     * - System stock is taken from the DB under row lock at the moment of saving.
     * - Variance (qty_change) = physical_stock - system_stock.
     * - If variance = 0, the line is normally ignored unless include_when_zero is true.
     * - For variance != 0, stock_quantity is updated to physical_stock and a stock_movements row is written.
     * - For variance = 0 (included for audit), stock is not changed and stock_movements is not written.
     */
    public function create($data, $userId = null, $locationId = 1) {
        // $this->ensureSchema();
        $locId = (int)$locationId;
        if ($locId <= 0) $locId = 1;
        $items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];
        if (count($items) === 0) return false;

        $adjustedAt = $data['adjusted_at'] ?? null;
        if (!$adjustedAt) {
            $adjustedAt = (new DateTime('now'))->format('Y-m-d H:i:s');
        }

        // Normalize and merge duplicate part_ids (so we lock/update once)
        $merged = [];
        foreach ($items as $it) {
            $pid = (int)($it['part_id'] ?? $it['partId'] ?? 0);
            $physical = $it['physical_stock'] ?? $it['physicalStock'] ?? null;
            $physical = ($physical === '' || $physical === null) ? null : (float)$physical;
            $note = isset($it['notes']) ? trim((string)$it['notes']) : null;
            $includeWhenZero = (bool)($it['include_when_zero'] ?? $it['includeWhenZero'] ?? false);
            if ($pid <= 0) continue;
            if ($physical === null) continue;
            if (!isset($merged[$pid])) {
                $merged[$pid] = ['part_id' => $pid, 'physical_stock' => $physical, 'notes' => [], 'include_when_zero' => false];
            }
            // If duplicates somehow exist, last physical stock wins (UI also prevents duplicates).
            $merged[$pid]['physical_stock'] = $physical;
            if ($includeWhenZero) $merged[$pid]['include_when_zero'] = true;
            if ($note) $merged[$pid]['notes'][] = $note;
        }
        $lines = array_values($merged);
        if (count($lines) === 0) return false;

        $adjNumber = trim((string)($data['adjustment_number'] ?? ''));
        if ($adjNumber === '') $adjNumber = $this->genNumber();

        try {
            require_once __DIR__ . '/InventoryBatch.php';
            $batchModel = new InventoryBatch();

            $this->db->exec("START TRANSACTION");

            // Create header
            $this->db->query("
                INSERT INTO stock_adjustments (location_id, adjustment_number, adjusted_at, reason, notes, created_by)
                VALUES (:loc, :num, :dt, :reason, :notes, :u)
            ");
            $this->db->bind(':loc', $locId);
            $this->db->bind(':num', $adjNumber);
            $this->db->bind(':dt', $adjustedAt);
            $this->db->bind(':reason', $data['reason'] ?? null);
            $this->db->bind(':notes', $data['notes'] ?? null);
            $this->db->bind(':u', $userId);
            $ok = $this->db->execute();
            if (!$ok) {
                $this->db->exec("ROLLBACK");
                return false;
            }
            $adjId = (int)$this->db->lastInsertId();

            // Apply each line with row lock
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
                    // Lock and read batch stock (Batches are inherently location-specific)
                    $this->db->query("SELECT quantity_on_hand FROM inventory_batches WHERE id = :id AND location_id = :loc FOR UPDATE");
                    $this->db->bind(':id', $bid);
                    $this->db->bind(':loc', $locId);
                    $btch = $this->db->single();
                    if (!$btch) {
                        $this->db->exec("ROLLBACK");
                        return ['error' => "Batch {$bid} not found at this location"];
                    }
                    $system = round((float)($btch->quantity_on_hand ?? 0), 3);
                } else {
                    // 1. Lock part row for global stock consistency
                    $this->db->query("SELECT id FROM parts WHERE id = :id FOR UPDATE");
                    $this->db->bind(':id', $pid);
                    $this->db->execute();

                    // 2. Calculate local system stock from movements ledger
                    $this->db->query("
                        SELECT COALESCE(SUM(qty_change), 0) AS local_qty 
                        FROM stock_movements 
                        WHERE part_id = :id AND location_id = :loc
                    ");
                    $this->db->bind(':id', $pid);
                    $this->db->bind(':loc', $locId);
                    $res = $this->db->single();
                    $system = round((float)($res->local_qty ?? 0), 3);
                }

                $qty = round($physical - $system, 3); // variance
                if (abs($qty) < 0.0005) $qty = 0.000;

                if ($qty == 0.0 && !$includeWhenZero) {
                    // Skip completely when no variance and not required for audit.
                    continue;
                }

                if ($qty != 0.0) {
                    // Update global total cached stock by applying the LOCAL variance (incremental update)
                    $this->db->query("UPDATE parts SET stock_quantity = stock_quantity + :q, updated_by = :u WHERE id = :id");
                    $this->db->bind(':q', $qty);
                    $this->db->bind(':u', $userId);
                    $this->db->bind(':id', $pid);
                    $this->db->execute();

                    // Update batch-specific record to physical count if applying to a batch
                    if ($bid > 0) {
                        $this->db->query("UPDATE inventory_batches SET quantity_on_hand = :q WHERE id = :id");
                        $this->db->bind(':q', $physical);
                        $this->db->bind(':id', $bid);
                        $this->db->execute();
                    }
                }

                // Insert adjustment item
                $this->db->query("
                    INSERT INTO stock_adjustment_items (stock_adjustment_id, part_id, batch_id, system_stock, physical_stock, qty_change, notes)
                    VALUES (:aid, :pid, :bid, :system_stock, :physical_stock, :qty, :notes)
                ");
                $this->db->bind(':aid', $adjId);
                $this->db->bind(':pid', $pid);
                $this->db->bind(':bid', $bid > 0 ? $bid : null);
                $this->db->bind(':system_stock', $system);
                $this->db->bind(':physical_stock', $physical);
                $this->db->bind(':qty', $qty);
                $this->db->bind(':notes', $note);
                $this->db->execute();

                // Stock movement ledger (only when stock actually changes)
                if ($qty != 0.0) {
                    $this->db->query("
                        INSERT INTO stock_movements (location_id, part_id, batch_id, qty_change, movement_type, ref_table, ref_id, notes, created_by)
                        VALUES (:loc, :pid, :bid, :qty, 'ADJUSTMENT', 'stock_adjustments', :ref_id, :notes, :u)
                    ");
                    $this->db->bind(':loc', $locId);
                    $this->db->bind(':pid', $pid);
                    $this->db->bind(':bid', $bid > 0 ? $bid : null);
                    $this->db->bind(':qty', $qty);
                    $this->db->bind(':ref_id', $adjId);
                    $this->db->bind(':notes', $adjNumber);
                    $this->db->bind(':u', $userId);
                    $this->db->execute();
                } else if ($includeWhenZero) {
                    // Included for audit only; no stock_movements row.
                }
            }

            // Automated Accounting
            require_once '../app/helpers/AccountingHelper.php';
            AccountingHelper::postStockAdjustment($adjId);

            $this->db->exec("COMMIT");
            return $adjId;
        } catch (Throwable $e) {
            try { $this->db->exec("ROLLBACK"); } catch (Throwable $e2) {}
            return ['error' => 'Adjustment Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine()];
        }
    }
}
