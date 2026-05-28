<?php
/**
 * Goods Receive Note (GRN) Model
 */
class GoodsReceiveNote extends Model {
    private $table = 'goods_receive_notes';

    public function ensureSchema() { return;
        InventorySchema::ensure();
        // Add cancellation columns if missing
        $cols = [
            'status' => "ENUM('Received', 'Cancelled') NOT NULL DEFAULT 'Received'",
            'cancelled_at' => "DATETIME NULL",
            'cancelled_by' => "INT NULL",
            'cancellation_reason' => "TEXT NULL"
        ];
        foreach ($cols as $col => $def) {
            try {
                $this->db->query("SELECT $col FROM goods_receive_notes LIMIT 1");
                $this->db->execute();
            } catch (Exception $e) {
                $this->db->query("ALTER TABLE goods_receive_notes ADD COLUMN $col $def");
                $this->db->execute();
            }
        }
    }

    public function cancel($id, $reason, $userId, $locationId = 1) {
        $data = $this->getById($id, $locationId);
        if (!$data) return false;
        $grn = $data->grn;
        if ($grn->status === 'Cancelled') return true;

        $this->db->beginTransaction();
        try {
            $items = $data->items;
            require_once 'Part.php';
            $partModel = new Part();

            foreach ($items as $item) {
                $partId = (int)$item->part_id;
                $qty = (float)$item->qty_received;
                $unitCost = (float)$item->unit_cost;

                // 1. Reverse Stock Movement
                $this->db->query("
                    INSERT INTO stock_movements (location_id, part_id, batch_id, qty_change, movement_type, ref_table, ref_id, unit_cost, notes, created_by)
                    VALUES (:loc, :part_id, :batch_id, :qty_change, 'PURCHASE_RETURN', 'goods_receive_notes', :ref_id, :unit_cost, :notes, :created_by)
                ");
                $this->db->bind(':loc', $locationId);
                $this->db->bind(':part_id', $partId);
                $this->db->bind(':batch_id', null); // Reversing the whole line, not specific batch for simplicity, or we could find the batch
                $this->db->bind(':qty_change', -1 * $qty);
                $this->db->bind(':ref_id', $id);
                $this->db->bind(':unit_cost', $unitCost);
                $this->db->bind(':notes', 'CANCELLATION: ' . $grn->grn_number);
                $this->db->bind(':created_by', $userId);
                $this->db->execute();

                // 2. Update Global Stock
                $this->db->query("UPDATE parts SET stock_quantity = stock_quantity - :qty WHERE id = :pid");
                $this->db->bind(':qty', $qty);
                $this->db->bind(':pid', $partId);
                $this->db->execute();

                // 3. Update Inventory Batch (decrement)
                if (!empty($item->batch_number)) {
                    $this->db->query("
                        UPDATE inventory_batches 
                        SET quantity_received = quantity_received - :qty,
                            quantity_on_hand = quantity_on_hand - :qty,
                            is_exhausted = (quantity_on_hand <= 0)
                        WHERE grn_id = :grn_id AND part_id = :pid AND batch_number = :bn
                    ");
                    $this->db->bind(':qty', $qty);
                    $this->db->bind(':grn_id', $id);
                    $this->db->bind(':pid', $partId);
                    $this->db->bind(':bn', $item->batch_number);
                    $this->db->execute();
                }

                // 4. Update PO Received Qty (decrement)
                if (!empty($grn->purchase_order_id)) {
                    $this->db->query("
                        UPDATE purchase_order_items
                        SET received_qty = GREATEST(0, received_qty - :qty)
                        WHERE purchase_order_id = :po_id AND part_id = :part_id
                    ");
                    $this->db->bind(':qty', $qty);
                    $this->db->bind(':po_id', $grn->purchase_order_id);
                    $this->db->bind(':part_id', $partId);
                    $this->db->execute();
                }
            }

            // 5. Update PO Status
            if (!empty($grn->purchase_order_id)) {
                $this->db->query("
                    SELECT SUM(received_qty) as total_received, SUM(qty_ordered) as total_ordered
                    FROM purchase_order_items
                    WHERE purchase_order_id = :id
                ");
                $this->db->bind(':id', $grn->purchase_order_id);
                $poStatusRow = $this->db->single();
                
                $newStatus = 'Sent';
                if ($poStatusRow->total_received >= $poStatusRow->total_ordered && $poStatusRow->total_ordered > 0) {
                    $newStatus = 'Received';
                } elseif ($poStatusRow->total_received > 0) {
                    $newStatus = 'Partially Received';
                }

                $this->db->query("UPDATE purchase_orders SET status = :s WHERE id = :id");
                $this->db->bind(':s', $newStatus);
                $this->db->bind(':id', $grn->purchase_order_id);
                $this->db->execute();
            }

            // 6. Update GRN Status
            $this->db->query("
                UPDATE goods_receive_notes 
                SET status = 'Cancelled',
                    cancelled_at = NOW(),
                    cancelled_by = :user,
                    cancellation_reason = :reason
                WHERE id = :id
            ");
            $this->db->bind(':user', $userId);
            $this->db->bind(':reason', $reason);
            $this->db->bind(':id', $id);
            $this->db->execute();

            // 7. Reverse Accounting Entries
            require_once 'Journal.php';
            $journal = new Journal();
            $journal->reverseEntries('GRN', $id, $userId);

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("GRN cancellation failed: " . $e->getMessage());
            return false;
        }
    }

    private function nextDocNumber($docType, $locationId = 1) {
        require_once __DIR__ . '/../helpers/DocumentSequenceHelper.php';
        return DocumentSequenceHelper::getStandardDocNo($docType, $locationId);
    }

    public function list($q = '', $locationId = 1) {
        // // // // // $this->ensureSchema();
        $locId = (int)$locationId;
        if ($locId <= 0) $locId = 1;
        $q = is_string($q) ? trim($q) : '';
        if ($q !== '') {
            $this->db->query("
                SELECT g.*, s.name AS supplier_name, po.po_number, u.name AS created_by_name,
                       sl.name AS location_name
                FROM {$this->table} g
                INNER JOIN suppliers s ON s.id = g.supplier_id
                LEFT JOIN purchase_orders po ON po.id = g.purchase_order_id
                LEFT JOIN users u ON u.id = g.created_by
                LEFT JOIN service_locations sl ON sl.id = g.location_id
                WHERE g.location_id = :loc AND g.status != 'Cancelled' AND (g.grn_number LIKE :q OR s.name LIKE :q OR po.po_number LIKE :q OR sl.name LIKE :q)
                ORDER BY g.id DESC
            ");
            $this->db->bind(':loc', $locId);
            $this->db->bind(':q', '%' . $q . '%');
            return $this->db->resultSet();
        }
        $this->db->query("
            SELECT g.*, s.name AS supplier_name, po.po_number, u.name AS created_by_name,
                   sl.name AS location_name
            FROM {$this->table} g
            INNER JOIN suppliers s ON s.id = g.supplier_id
            LEFT JOIN purchase_orders po ON po.id = g.purchase_order_id
            LEFT JOIN users u ON u.id = g.created_by
            LEFT JOIN service_locations sl ON sl.id = g.location_id
            WHERE g.location_id = :loc AND g.status != 'Cancelled'
            ORDER BY g.id DESC
        ");
        $this->db->bind(':loc', $locId);
        return $this->db->resultSet();
    }

    public function getById($id, $locationId = 1) {
        // // // // // $this->ensureSchema();
        $locId = (int)$locationId;
        if ($locId <= 0) $locId = 1;
        $this->db->query("
            SELECT g.*, s.name AS supplier_name, po.po_number, u.name AS created_by_name,
                   sl.name AS location_name
            FROM {$this->table} g
            INNER JOIN suppliers s ON s.id = g.supplier_id
            LEFT JOIN purchase_orders po ON po.id = g.purchase_order_id
            LEFT JOIN users u ON u.id = g.created_by
            LEFT JOIN service_locations sl ON sl.id = g.location_id
            WHERE g.id = :id AND g.location_id = :loc
            LIMIT 1
        ");
        $this->db->bind(':id', (int)$id);
        $this->db->bind(':loc', $locId);
        $grn = $this->db->single();
        if (!$grn) return null;

        $this->db->query("
            SELECT i.*, p.part_name, p.sku, b.name AS brand_name,
                   p.is_fifo, p.is_expiry
            FROM grn_items i
            INNER JOIN parts p ON p.id = i.part_id
            LEFT JOIN brands b ON b.id = p.brand_id
            WHERE i.grn_id = :id
            ORDER BY i.id ASC
        ");
        $this->db->bind(':id', (int)$id);
        $items = $this->db->resultSet();

        return (object)[
            'grn' => $grn,
            'items' => $items,
        ];
    }

    public function create($data, $userId = null, $locationId = 1) {
        // // // // // $this->ensureSchema();
        $locId = (int)$locationId;
        if ($locId <= 0) $locId = 1;
        $supplierId = (int)($data['supplier_id'] ?? 0);
        $poId = isset($data['purchase_order_id']) ? (int)$data['purchase_order_id'] : null;
        $receivedAt = $data['received_at'] ?? null;
        $items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];
        if ($supplierId <= 0 || !$receivedAt || count($items) === 0) return false;

        // Merge duplicate lines (same part_id) into a single GRN item.
        // If duplicate lines have conflicting unit_cost values, we reject the GRN create (data quality).
        $mergedItems = [];
        foreach ($items as $it) {
            $partId = (int)($it['part_id'] ?? $it['partId'] ?? 0);
            $qty = round((float)($it['qty_received'] ?? $it['qty'] ?? 0), 3);
            $unitCost = (float)($it['unit_cost'] ?? $it['unitCost'] ?? 0);
            $batchNum = trim((string)($it['batch_number'] ?? $it['batchNumber'] ?? ''));
            $mfgDate = $it['mfg_date'] ?? $it['mfgDate'] ?? null;
            $expDate = $it['expiry_date'] ?? $it['expiryDate'] ?? null;

            if ($partId <= 0 || $qty <= 0) continue;
            
            // Unique key for merging: part + batch
            $key = $partId . '_' . $batchNum;

            if (!isset($mergedItems[$key])) {
                $mergedItems[$key] = [
                    'part_id' => $partId, 
                    'qty' => 0.0, 
                    'unit_cost' => $unitCost,
                    'batch_number' => $batchNum,
                    'mfg_date' => $mfgDate,
                    'expiry_date' => $expDate
                ];
            } else {
                $prevCost = (float)$mergedItems[$key]['unit_cost'];
                if (abs($prevCost - $unitCost) > 0.0001) return false;
            }
            $mergedItems[$key]['qty'] = round(((float)$mergedItems[$key]['qty']) + $qty, 3);
        }
        if (count($mergedItems) === 0) return false;

        try {
            $this->db->exec("START TRANSACTION");

            $grnNumber = trim((string)($data['grn_number'] ?? ''));
            if ($grnNumber === '') {
                $grnNumber = $this->nextDocNumber('GRN', $locId);
            }

            // If linked to a PO, lock and validate it up-front so we can reliably close it in this same transaction.
            if ($poId) {
                $this->db->query("SELECT id, supplier_id, status, location_id FROM purchase_orders WHERE id = :id FOR UPDATE");
                $this->db->bind(':id', $poId);
                $poRow = $this->db->single();
                if (!$poRow) {
                    $this->db->exec("ROLLBACK");
                    return false;
                }
                $poStatus = (string)($poRow->status ?? '');
                if (in_array($poStatus, ['Received', 'Cancelled'], true)) {
                    $this->db->exec("ROLLBACK");
                    return false;
                }
                $poSupplierId = (int)($poRow->supplier_id ?? 0);
                if ($poSupplierId > 0 && $supplierId > 0 && $poSupplierId !== $supplierId) {
                    $this->db->exec("ROLLBACK");
                    return false;
                }
                $poLocId = (int)($poRow->location_id ?? 0);
                if ($poLocId > 0) {
                    // GRN location must match PO location.
                    $locId = $poLocId;
                }
            }

            $this->db->query("
                INSERT INTO {$this->table}
                (grn_number, purchase_order_id, location_id, supplier_id, subtotal, tax_total, total_amount, received_at, notes, created_by, updated_by)
                VALUES
                (:grn_number, :po_id, :location_id, :supplier_id, :subtotal, :tax_total, :total_amount, :received_at, :notes, :created_by, :updated_by)
            ");
            $subtotal = (float)($data['subtotal'] ?? 0);
            $taxTotal = (float)($data['tax_total'] ?? 0);

            // Safety: If subtotal is zero, recalculate from items
            if ($subtotal <= 0 && !empty($mergedItems)) {
                foreach ($mergedItems as $it) {
                    $subtotal += (float)($it['qty_received'] ?? 0) * (float)($it['unit_cost'] ?? 0);
                }
            }
            
            $this->db->bind(':grn_number', $grnNumber);
            $this->db->bind(':po_id', $poId);
            $this->db->bind(':location_id', $locId);
            $this->db->bind(':supplier_id', $supplierId);
            $this->db->bind(':subtotal', $subtotal);
            $this->db->bind(':tax_total', $taxTotal);
            $this->db->bind(':total_amount', $subtotal + $taxTotal);
            $this->db->bind(':received_at', $receivedAt);
            $this->db->bind(':notes', $data['notes'] ?? null);
            $this->db->bind(':created_by', $userId);
            $this->db->bind(':updated_by', $userId);
            $ok = $this->db->execute();
            if (!$ok) {
                $this->db->exec("ROLLBACK");
                return false;
            }
            $grnId = (int)$this->db->lastInsertId();

            foreach ($mergedItems as $row) {
                $partId = (int)$row['part_id'];
                $qty = round((float)$row['qty'], 3);
                $unitCost = (float)$row['unit_cost'];
                if ($partId <= 0 || $qty <= 0) continue;
                $lineTotal = round($qty * $unitCost, 2);

                // Insert GRN item
                $this->db->query("
                    INSERT INTO grn_items (grn_id, part_id, qty_received, unit_cost, line_total, batch_number, mfg_date, expiry_date)
                    VALUES (:grn_id, :part_id, :qty, :unit_cost, :line_total, :batch_number, :mfg_date, :expiry_date)
                ");
                $this->db->bind(':grn_id', $grnId);
                $this->db->bind(':part_id', $partId);
                $this->db->bind(':qty', $qty);
                $this->db->bind(':unit_cost', $unitCost);
                $this->db->bind(':line_total', $lineTotal);
                $this->db->bind(':batch_number', $row['batch_number']);
                $this->db->bind(':mfg_date', $row['mfg_date']);
                $this->db->bind(':expiry_date', $row['expiry_date']);
                $this->db->execute();

                // Increase stock and update avg cost price:
                // avg_cost = (current_qty*current_cost + received_qty*unit_cost) / (current_qty + received_qty)
                $this->db->query("SELECT stock_quantity, cost_price, is_fifo, is_expiry FROM parts WHERE id = :id FOR UPDATE");
                $this->db->bind(':id', $partId);
                $p = $this->db->single();
                if (!$p) {
                    $this->db->exec("ROLLBACK");
                    return false;
                }
                $currentQty = round((float)($p->stock_quantity ?? 0), 3);
                $currentCost = $p->cost_price !== null ? (float)$p->cost_price : (float)$unitCost;
                $receivedQty = (float)$qty;

                $newQty = round($currentQty + $receivedQty, 3);
                $avgCost = (float)$unitCost;
                if ($newQty > 0) {
                    $currentValue = $currentQty > 0 ? ($currentQty * $currentCost) : 0.0;
                    $newValue = $receivedQty * (float)$unitCost;
                    $avgCost = ($currentValue + $newValue) / $newQty;
                }
                $avgCost = round($avgCost, 2); // cost_price is money-like

                $this->db->query("UPDATE parts SET stock_quantity = :qty, cost_price = :avg_cost, updated_by = :u WHERE id = :id");
                $this->db->bind(':qty', $newQty);
                $this->db->bind(':avg_cost', $avgCost);
                $this->db->bind(':u', $userId);
                $this->db->bind(':id', $partId);
                $this->db->execute();

                // Create/Update Inventory Batch if product is FIFO or Expiry tracked
                $batchId = null;
                if ((int)($p->is_fifo ?? 0) === 1 || (int)($p->is_expiry ?? 0) === 1) {
                    // Try to find existing batch at this location (for additive receipts)
                    $this->db->query("
                        SELECT id FROM inventory_batches 
                        WHERE part_id = :pid AND location_id = :loc AND batch_number = :bn
                        LIMIT 1
                    ");
                    $this->db->bind(':pid', $partId);
                    $this->db->bind(':loc', $locId);
                    $this->db->bind(':bn', $row['batch_number']);
                    $existingBatch = $this->db->single();

                    if ($existingBatch) {
                        $batchId = (int)$existingBatch->id;
                        $this->db->query("
                            UPDATE inventory_batches 
                            SET quantity_received = quantity_received + :qty,
                                quantity_on_hand = quantity_on_hand + :qty,
                                mfg_date = :mfg,
                                expiry_date = :exp,
                                is_exhausted = 0
                            WHERE id = :id
                        ");
                        $this->db->bind(':qty', $qty);
                        $this->db->bind(':mfg', $row['mfg_date']);
                        $this->db->bind(':exp', $row['expiry_date']);
                        $this->db->bind(':id', $batchId);
                        $this->db->execute();
                    } else {
                        $this->db->query("
                            INSERT INTO inventory_batches 
                            (part_id, location_id, batch_number, mfg_date, expiry_date, quantity_received, quantity_on_hand, unit_cost, grn_id)
                            VALUES 
                            (:pid, :loc, :bn, :mfg, :exp, :qty, :qty, :cost, :grn_id)
                        ");
                        $this->db->bind(':pid', $partId);
                        $this->db->bind(':loc', $locId);
                        $this->db->bind(':bn', $row['batch_number']);
                        $this->db->bind(':mfg', $row['mfg_date']);
                        $this->db->bind(':exp', $row['expiry_date']);
                        $this->db->bind(':qty', $qty);
                        $this->db->bind(':cost', $unitCost);
                        $this->db->bind(':grn_id', $grnId);
                        $this->db->execute();
                        $batchId = (int)$this->db->lastInsertId();
                    }
                }

                // Stock movement ledger
                $this->db->query("
                    INSERT INTO stock_movements (location_id, part_id, batch_id, qty_change, movement_type, ref_table, ref_id, unit_cost, notes, created_by)
                    VALUES (:loc, :part_id, :batch_id, :qty_change, 'GRN', 'goods_receive_notes', :ref_id, :unit_cost, :notes, :created_by)
                ");
                $this->db->bind(':loc', $locId);
                $this->db->bind(':part_id', $partId);
                $this->db->bind(':batch_id', $batchId);
                $this->db->bind(':qty_change', $qty);
                $this->db->bind(':ref_id', $grnId);
                $this->db->bind(':unit_cost', $unitCost);
                $this->db->bind(':notes', $grnNumber);
                $this->db->bind(':created_by', $userId);
                $this->db->execute();

                // If linked to PO, bump received_qty
                if ($poId) {
                    $this->db->query("
                        UPDATE purchase_order_items
                        SET received_qty = LEAST(qty_ordered, received_qty + :qty)
                        WHERE purchase_order_id = :po_id AND part_id = :part_id
                    ");
                    $this->db->bind(':qty', $qty);
                    $this->db->bind(':po_id', $poId);
                    $this->db->bind(':part_id', $partId);
                    $this->db->execute();
                }
            }

            // Update PO status if linked
            if ($poId) {
                // IMPORTANT: do this with the same DB connection/transaction,
                // otherwise a new connection won't see uncommitted received_qty updates.
                $this->db->query("
                    SELECT SUM(CASE WHEN received_qty >= qty_ordered THEN 1 ELSE 0 END) AS done_cnt,
                           COUNT(*) AS total_cnt
                    FROM purchase_order_items
                    WHERE purchase_order_id = :id
                ");
                $this->db->bind(':id', (int)$poId);
                $row = $this->db->single();
                $done = (int)($row->done_cnt ?? 0);
                $total = (int)($row->total_cnt ?? 0);
                if ($total > 0) {
                    $status = ($done >= $total) ? 'Received' : 'Partially Received';
                    $this->db->query("UPDATE purchase_orders SET status = :s, updated_by = :u WHERE id = :id AND status <> 'Cancelled'");
                    $this->db->bind(':s', $status);
                    $this->db->bind(':u', $userId);
                    $this->db->bind(':id', (int)$poId);
                    $this->db->execute();
                }
            }

            $this->db->exec("COMMIT");
            
            // Automated Accounting
            try {
                AccountingHelper::postGRN($grnId);
            } catch (Exception $e) {
                error_log("Accounting post failed for GRN: " . $e->getMessage());
            }

            return $grnId;
        } catch (Exception $e) {
            try { $this->db->exec("ROLLBACK"); } catch (Exception $e2) {}
            return false;
        }
    }
}
