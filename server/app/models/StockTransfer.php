<?php
/**
 * StockTransfer Model
 * Handles stock transfer requests between locations.
 */
class StockTransfer extends Model {
    private function ensureSchema() { return;
        InventorySchema::ensure();
    }

    private function nextDocNumber($docType, $locationId = 1) {
        require_once __DIR__ . '/../helpers/DocumentSequenceHelper.php';
        return DocumentSequenceHelper::getStandardDocNo($docType, $locationId);
    }

    private function movementQtyIfAny($locationId, $partId) {
        // Prefer per-location ledger if there is any movement history for this part+location.
        // Fall back to parts.stock_quantity for older installs that don't have a complete ledger.
        $loc = (int)$locationId;
        $pid = (int)$partId;
        if ($loc <= 0 || $pid <= 0) return null;
        try {
            $this->db->query("
                SELECT COUNT(*) AS c, COALESCE(SUM(qty_change), 0) AS qty
                FROM stock_movements
                WHERE location_id = :loc AND part_id = :pid
            ");
            $this->db->bind(':loc', $loc);
            $this->db->bind(':pid', $pid);
            $row = $this->db->single();
            $cnt = (int)($row->c ?? 0);
            if ($cnt <= 0) return null;
            return (float)($row->qty ?? 0);
        } catch (Exception $e) {
            return null;
        }
    }

    private function reservedQtyForPendingTransfers($fromLocationId, $partId) {
        $loc = (int)$fromLocationId;
        $pid = (int)$partId;
        if ($loc <= 0 || $pid <= 0) return 0.0;
        try {
            $this->db->query("
                SELECT COALESCE(SUM(i.qty), 0) AS reserved
                FROM stock_transfer_requests r
                INNER JOIN stock_transfer_items i ON i.transfer_id = r.id
                WHERE r.status = 'Requested' AND r.from_location_id = :loc AND i.part_id = :pid
            ");
            $this->db->bind(':loc', $loc);
            $this->db->bind(':pid', $pid);
            $row = $this->db->single();
            return (float)($row->reserved ?? 0);
        } catch (Exception $e) {
            return 0.0;
        }
    }

    private function availableQtyForTransferCreate($fromLocationId, $partId) {
        $loc = (int)$fromLocationId;
        $pid = (int)$partId;
        if ($loc <= 0 || $pid <= 0) return 0.0;

        $base = $this->movementQtyIfAny($loc, $pid);
        if ($base === null) {
            // Fallback: global stock quantity (best-effort).
            try {
                $this->db->query("SELECT stock_quantity FROM parts WHERE id = :id LIMIT 1");
                $this->db->bind(':id', $pid);
                $row = $this->db->single();
                $base = (float)($row->stock_quantity ?? 0);
            } catch (Exception $e) {
                $base = 0.0;
            }
        }

        $reserved = $this->reservedQtyForPendingTransfers($loc, $pid);
        $avail = (float)$base - (float)$reserved;
        return $avail;
    }

    private function genNumber($locationId = 1) {
        // Keep old method as a fallback; prefer sequential doc numbers.
        try {
            return $this->nextDocNumber('TR', $locationId);
        } catch (Exception $e) {
            $dt = new DateTime('now');
            $stamp = $dt->format('Ymd');
            $rand = substr(strtoupper(bin2hex(random_bytes(3))), 0, 6);
            return "TR-{$stamp}-{$rand}";
        }
    }

    public function listByLocations($locationIds = []) {
        // // // // // // $this->ensureSchema();
        $ids = array_values(array_filter(array_map('intval', (array)$locationIds), function($x) { return $x > 0; }));
        if (count($ids) === 0) return [];
        $in = implode(',', array_fill(0, count($ids), '?'));
        $sql = "
            SELECT r.*, 
                   lf.name AS from_location_name,
                   lt.name AS to_location_name,
                   u.name AS created_by_name,
                   u2.name AS received_by_name,
                   COUNT(i.id) AS line_count,
                   SUM(i.qty) AS total_qty
            FROM stock_transfer_requests r
            LEFT JOIN service_locations lf ON lf.id = r.from_location_id
            LEFT JOIN service_locations lt ON lt.id = r.to_location_id
            LEFT JOIN users u ON u.id = r.created_by
            LEFT JOIN users u2 ON u2.id = r.received_by
            LEFT JOIN stock_transfer_items i ON i.transfer_id = r.id
            WHERE r.from_location_id IN ($in) OR r.to_location_id IN ($in)
            GROUP BY r.id
            ORDER BY r.id DESC
        ";
        $this->db->query($sql);
        // $in is used twice (from_location_id IN (...) OR to_location_id IN (...))
        // so we must bind the ids twice as positional parameters.
        foreach ($ids as $i => $id) {
            $this->db->bind(($i + 1), $id);
        }
        $offset = count($ids);
        foreach ($ids as $i => $id) {
            $this->db->bind(($offset + $i + 1), $id);
        }
        return $this->db->resultSet();
    }

    public function getById($id) {
        // // // // // // $this->ensureSchema();
        $this->db->query("
            SELECT r.*, 
                   lf.name AS from_location_name,
                   lt.name AS to_location_name
            FROM stock_transfer_requests r
            LEFT JOIN service_locations lf ON lf.id = r.from_location_id
            LEFT JOIN service_locations lt ON lt.id = r.to_location_id
            WHERE r.id = :id LIMIT 1
        ");
        $this->db->bind(':id', (int)$id);
        $hdr = $this->db->single();
        if (!$hdr) return null;

        $this->db->query("
            SELECT i.*, p.part_name, p.sku, p.unit, p.cost_price, b.name AS brand_name
            FROM stock_transfer_items i
            INNER JOIN parts p ON p.id = i.part_id
            LEFT JOIN brands b ON b.id = p.brand_id
            WHERE i.transfer_id = :id
            ORDER BY i.id ASC
        ");
        $this->db->bind(':id', (int)$id);
        $items = $this->db->resultSet();

        return (object)[
            'transfer' => $hdr,
            'items' => $items,
        ];
    }

    public function create($data, $userId = null) {
        // // // // // // $this->ensureSchema();
        $fromId = (int)($data['from_location_id'] ?? $data['fromLocationId'] ?? 0);
        $toId = (int)($data['to_location_id'] ?? $data['toLocationId'] ?? 0);
        $reqId = (int)($data['requisition_id'] ?? $data['requisitionId'] ?? 0);
        if ($fromId <= 0 || $toId <= 0) return ['error' => 'Invalid source or destination location'];
        if ($fromId === $toId) return ['error' => 'Source and destination locations must be different'];

        $items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];
        if (count($items) === 0) return ['error' => 'No items provided in the transfer request'];

        $processedItems = [];
        foreach ($items as $it) {
            $pid = (int)($it['part_id'] ?? $it['partId'] ?? 0);
            $bid = (int)($it['batch_id'] ?? $it['batchId'] ?? 0);
            $qty = $it['qty'] ?? $it['quantity'] ?? null;
            $qty = ($qty === '' || $qty === null) ? null : (float)$qty;
            if ($pid <= 0 || $qty === null || $qty <= 0) continue;
            
            $processedItems[] = [
                'part_id' => $pid,
                'batch_id' => $bid > 0 ? $bid : null,
                'qty' => $qty
            ];
        }
        if (count($processedItems) === 0) return ['error' => 'No valid items provided for transfer'];

        $num = trim((string)($data['transfer_number'] ?? ''));
        if ($num === '') $num = $this->genNumber($fromId);
        $requestedAt = $data['requested_at'] ?? null;
        if (!$requestedAt) $requestedAt = (new DateTime('now'))->format('Y-m-d H:i:s');

        try {
            require_once __DIR__ . '/InventoryBatch.php';
            $batchModel = new InventoryBatch();

            $this->db->beginTransaction();

            // If created from a requisition, validate it and lock destination.
            if ($reqId > 0) {
                $this->db->query("SELECT to_location_id, status FROM stock_transfer_requisitions WHERE id = :id LIMIT 1");
                $this->db->bind(':id', $reqId);
                $req = $this->db->single();
                if (!$req) {
                    $this->db->rollBack();
                    return ['error' => 'Requisition not found'];
                }
                if (!in_array((string)$req->status, ['Requested','Approved'], true)) {
                    $this->db->rollBack();
                    return ['error' => 'Requisition is not in a valid state'];
                }
                $toId = (int)$req->to_location_id;
                if ($toId <= 0) {
                    $this->db->rollBack();
                    return ['error' => 'Requisition has no valid destination location'];
                }
            }

            // Verify stock availability at source before creating the request.
            foreach ($processedItems as $it) {
                $pid = $it['part_id'];
                $bid = $it['batch_id'];
                $need = $it['qty'];

                $avail = 0;
                if ($bid) {
                    $batches = $batchModel->getAvailableBatches($pid, $fromId);
                    foreach ($batches as $b) {
                        if ((int)$b->id === (int)$bid) {
                            $avail = (float)$b->quantity_on_hand;
                            break;
                        }
                    }
                } else {
                    $avail = $this->availableQtyForTransferCreate($fromId, $pid);
                }

                if ($avail + 0.000001 < $need) {
                    $name = null;
                    try {
                        $this->db->query("SELECT part_name FROM parts WHERE id = :id LIMIT 1");
                        $this->db->bind(':id', $pid);
                        $row = $this->db->single();
                        $name = $row ? (string)($row->part_name ?? '') : null;
                    } catch (Exception $e2) {}
                    $label = $name ? $name : ("Item #" . $pid);
                    $this->db->rollBack();
                    return ['error' => "Insufficient stock at source for {$label}" . ($bid ? " (Batch #{$bid})" : "") . ". Available: " . number_format(max(0, $avail), 3, '.', '') . ", requested: " . number_format($need, 3, '.', '')];
                }
            }

            $this->db->query("
                INSERT INTO stock_transfer_requests
                (transfer_number, requisition_id, from_location_id, to_location_id, status, requested_at, notes, created_by)
                VALUES (:num, :req_id, :from_id, :to_id, 'Requested', :dt, :notes, :u)
            ");
            $this->db->bind(':num', $num);
            $this->db->bind(':req_id', $reqId > 0 ? $reqId : null);
            $this->db->bind(':from_id', $fromId);
            $this->db->bind(':to_id', $toId);
            $this->db->bind(':dt', $requestedAt);
            $this->db->bind(':notes', $data['notes'] ?? null);
            $this->db->bind(':u', $userId);
            $ok = $this->db->execute();
            if (!$ok) {
                $this->db->rollBack();
                return ['error' => 'Failed to insert transfer request into database'];
            }
            $id = (int)$this->db->lastInsertId();

            // If requisition is present, ensure shipped qty does not exceed remaining requested qty per item.
            $remaining = [];
            if ($reqId > 0) {
                $this->db->query("
                    SELECT part_id, qty_requested, qty_fulfilled
                    FROM stock_transfer_requisition_items
                    WHERE requisition_id = :id
                ");
                $this->db->bind(':id', $reqId);
                $reqItems = $this->db->resultSet() ?: [];
                foreach ($reqItems as $ri) {
                    $pid = (int)$ri->part_id;
                    $rem = (float)$ri->qty_requested - (float)$ri->qty_fulfilled;
                    if ($rem < 0) $rem = 0;
                    $remaining[$pid] = $rem;
                }
            }

            foreach ($processedItems as $it) {
                $pid = $it['part_id'];
                $bid = $it['batch_id'];
                $qty = $it['qty'];

                if ($reqId > 0) {
                    $rem = isset($remaining[$pid]) ? (float)$remaining[$pid] : 0.0;
                    if ($rem <= 0 || $qty > $rem + 0.000001) {
                        $this->db->rollBack();
                        return ['error' => "Quantity for item #{$pid} exceeds the remaining requested amount"];
                    }
                    // Subtract from the local tracker to support multiple lines of same part against one req
                    $remaining[$pid] -= $qty;
                }
                $this->db->query("INSERT INTO stock_transfer_items (transfer_id, part_id, batch_id, qty) VALUES (:tid, :pid, :bid, :qty)");
                $this->db->bind(':tid', $id);
                $this->db->bind(':pid', $pid);
                $this->db->bind(':bid', $bid);
                $this->db->bind(':qty', $qty);
                $this->db->execute();
            }

            $this->db->commit();
            return $id;
        } catch (Throwable $e) {
            error_log("Error in StockTransfer::create: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            try { $this->db->rollBack(); } catch (Throwable $e2) {}
            return ['error' => 'Stock Transfer Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine()];
        }
    }

    public function receive($id, $userId = null) {
        // // // // // // $this->ensureSchema();
        $tid = (int)$id;
        if ($tid <= 0) return ['error' => 'Invalid transfer'];

        $this->db->query("SELECT * FROM stock_transfer_requests WHERE id = :id LIMIT 1");
        $this->db->bind(':id', $tid);
        $hdr = $this->db->single();
        if (!$hdr) return ['error' => 'Transfer not found'];
        if ($hdr->status !== 'Requested') return ['error' => 'Transfer already processed'];

        $fromId = (int)$hdr->from_location_id;
        $toId = (int)$hdr->to_location_id;
        $transferNumber = (string)$hdr->transfer_number;
        $reqId = isset($hdr->requisition_id) ? (int)$hdr->requisition_id : 0;

        // If there are open requisitions for this destination, we can optionally settle fulfilled qty.
        // The UI will create shipments from a requisition; we detect it by notes prefix "REQ:" is not reliable.
        // For now, we best-effort match by transfer_number embedded in stock_movements only.

        $this->db->query("SELECT * FROM stock_transfer_items WHERE transfer_id = :id");
        $this->db->bind(':id', $tid);
        $items = $this->db->resultSet();
        if (!$items || count($items) === 0) return ['error' => 'No transfer items'];

        try {
            $this->db->beginTransaction();

            require_once 'Part.php';
            require_once 'InventoryBatch.php';
            $partModel = new Part();
            $batchModel = new InventoryBatch();

            foreach ($items as $it) {
                $pid = (int)$it->part_id;
                $qty = (float)$it->qty;
                if ($qty <= 0) continue;

                $part = $partModel->getById($pid);
                if (!$part) {
                    $this->db->rollBack();
                    return ['error' => 'Invalid part ID: ' . $pid];
                }

                $costPrice = (float)($part->cost_price ?? 0);
                $isFifo = (int)($part->is_fifo ?? 0) === 1 || (int)($part->is_expiry ?? 0) === 1;

                // Priority 1: Manual batch selection preserved from the request
                // Priority 2: Automatic FIFO deduction
                // Priority 3: Fallback (Standard/Periodic)
                
                $fixedBatchId = (int)($it->batch_id ?? 0);

                if ($fixedBatchId > 0) {
                    $deductions = [['batch_id' => $fixedBatchId, 'qty_deducted' => $qty]];
                } else if ($isFifo) {
                    $deductions = $batchModel->deductStockFIFO($pid, $fromId, $qty);
                    if (empty($deductions)) {
                        $deductions = [['batch_id' => null, 'qty_deducted' => $qty]];
                    }
                } else {
                    $deductions = [['batch_id' => null, 'qty_deducted' => $qty]];
                }

                foreach ($deductions as $d) {
                    $batchId = $d['batch_id'];
                    $dquty = (float)$d['qty_deducted'];

                    // Stock movement: out from source
                    $this->db->query("
                        INSERT INTO stock_movements (location_id, part_id, batch_id, qty_change, movement_type, ref_table, ref_id, unit_cost, notes, created_by)
                        VALUES (:loc, :pid, :bid, :qty, 'TRANSFER_OUT', 'stock_transfer_requests', :ref, :cost, :notes, :u)
                    ");
                    $this->db->bind(':loc', $fromId);
                    $this->db->bind(':pid', $pid);
                    $this->db->bind(':bid', $batchId);
                    $this->db->bind(':qty', -abs($dquty));
                    $this->db->bind(':ref', $tid);
                    $this->db->bind(':cost', $costPrice);
                    $this->db->bind(':notes', $transferNumber . ($batchId ? ' (Batch Move)' : ''));
                    $this->db->bind(':u', $userId);
                    $this->db->execute();

                    // Stock movement: in to destination (preserving batch_id)
                    $this->db->query("
                        INSERT INTO stock_movements (location_id, part_id, batch_id, qty_change, movement_type, ref_table, ref_id, unit_cost, notes, created_by)
                        VALUES (:loc, :pid, :bid, :qty, 'TRANSFER_IN', 'stock_transfer_requests', :ref, :cost, :notes, :u)
                    ");
                    $this->db->bind(':loc', $toId);
                    $this->db->bind(':pid', $pid);
                    $this->db->bind(':bid', $batchId);
                    $this->db->bind(':qty', abs($dquty));
                    $this->db->bind(':ref', $tid);
                    $this->db->bind(':cost', $costPrice);
                    $this->db->bind(':notes', $transferNumber . ($batchId ? ' (Batch Move)' : ''));
                    $this->db->bind(':u', $userId);
                    $this->db->execute();
                }

                // If this shipment came from a requisition, settle fulfilled qty on receive.
                if ($reqId > 0) {
                    try {
                        require_once 'StockRequisition.php';
                        $rq = new StockRequisition();
                        $rq->addFulfilledQty($reqId, $pid, abs($qty));
                    } catch (Exception $e3) {
                        // ignore best-effort
                    }
                }
            }

            $this->db->query("
                UPDATE stock_transfer_requests
                SET status = 'Received', received_by = :u, received_at = NOW()
                WHERE id = :id
            ");
            $this->db->bind(':u', $userId);
            $this->db->bind(':id', $tid);
            $this->db->execute();

            $this->db->commit();

            if ($reqId > 0) {
                try {
                    $rq = new StockRequisition();
                    $rq->markFulfilledIfComplete($reqId);
                } catch (Exception $e3) {}
            }
            return true;
        } catch (Exception $e) {
            error_log("Error in StockTransfer::receive: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            try { $this->db->rollBack(); } catch (Exception $e2) {}
            return ['error' => 'Receive failed'];
        }
    }
}
