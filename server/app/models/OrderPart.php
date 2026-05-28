<?php
/**
 * OrderPart Model - parts issued to a repair order.
 */
class OrderPart extends Model {
    private function ensureSchema() { return;
        InventorySchema::ensure();
    }

    public function listByOrder($orderId) {
        // // // // // // $this->ensureSchema();
        $oid = (int)$orderId;
        $this->db->query("
            SELECT op.*, p.part_name, p.sku, p.unit
            FROM order_parts op
            INNER JOIN parts p ON p.id = op.part_id
            WHERE op.order_id = :oid
            ORDER BY op.id ASC
        ");
        $this->db->bind(':oid', $oid);
        return $this->db->resultSet();
    }

    public function addLine($orderId, $partId, $qty, $userId = null) {
        // // // // // // $this->ensureSchema();
        $oid = (int)$orderId;
        $pid = (int)$partId;
        $qty = (float)$qty;
        if ($oid <= 0 || $pid <= 0 || $qty <= 0) return false;

        try {
            $this->db->exec("START TRANSACTION");

            // Lock part and get metadata
            $this->db->query("SELECT item_type, cost_price, price, is_fifo, is_expiry, recipe_type, part_name, default_location_id FROM parts WHERE id = :id FOR UPDATE");
            $this->db->bind(':id', $pid);
            $p = $this->db->single();
            if (!$p) {
                $this->db->exec("ROLLBACK");
                return false;
            }

            $itemType = (string)($p->item_type ?? 'Part');
            $isService = ($itemType === 'Service');

            // Find order location
            $locationId = 1;
            $this->db->query("SELECT location_id FROM repair_orders WHERE id = :id");
            $this->db->bind(':id', $oid);
            $oRow = $this->db->single();
            if ($oRow) $locationId = (int)$oRow->location_id;

            $recipeType = (string)($p->recipe_type ?? 'Standard');

            // Stock Check for physical items
            if (!$isService && $recipeType !== 'A La Carte') {
                $this->db->query("
                    SELECT COALESCE(SUM(qty_change), 0) AS qty
                    FROM stock_movements
                    WHERE location_id = :loc AND part_id = :pid
                ");
                $this->db->bind(':loc', $locationId);
                $this->db->bind(':pid', $pid);
                $ledgerTotal = (float)($this->db->single()->qty ?? 0);

                if ($ledgerTotal < $qty) {
                    $this->db->exec("ROLLBACK");
                    return ['error' => "Insufficient stock. (Available: " . number_format($ledgerTotal, 3) . ")"];
                }
            }

            $unitCost = $p->cost_price !== null ? (float)$p->cost_price : null;
            $unitPrice = $p->price !== null ? (float)$p->price : null;

            $isFifo = ($itemType !== 'Service' && ((int)($p->is_fifo ?? 0) === 1 || (int)($p->is_expiry ?? 0) === 1));
            
            // A La Carte handling: Consume ingredients and offset main item stock
            if ($recipeType === 'A La Carte') {
                require_once 'ProductionBOM.php';
                $bomModel = new ProductionBOM();
                $bom = $bomModel->getActiveBOMForPart($pid);
                if ($bom && !empty($bom->items)) {
                    $ingredientLoc = !empty($p->default_location_id) ? (int)$p->default_location_id : $locationId;
                    foreach ($bom->items as $bi) {
                        $ingredientQty = (float)$bi->qty * $qty;
                        
                        // Deduct ingredient
                        $this->db->query("
                            INSERT INTO stock_movements (location_id, part_id, qty_change, movement_type, ref_table, ref_id, unit_cost, notes, created_by)
                            VALUES (:loc, :part_id, :qty_change, 'PRODUCTION_CONSUMPTION', 'repair_orders', :ref_id, 0, :notes, :created_by)
                        ");
                        $this->db->bind(':loc', $ingredientLoc);
                        $this->db->bind(':part_id', $bi->part_id);
                        $this->db->bind(':qty_change', -1 * $ingredientQty);
                        $this->db->bind(':ref_id', $oid);
                        $this->db->bind(':notes', 'BOM Consumption (' . $p->part_name . ')');
                        $this->db->bind(':created_by', $userId);
                        $this->db->execute();
                        
                        $this->db->query("UPDATE parts SET stock_quantity = stock_quantity - :qty WHERE id = :id");
                        $this->db->bind(':qty', $ingredientQty);
                        $this->db->bind(':id', $bi->part_id);
                        $this->db->execute();
                    }
                }
                
                // Always add main item (Assembly Offset) for A La Carte items
                $this->db->query("
                    INSERT INTO stock_movements (location_id, part_id, qty_change, movement_type, ref_table, ref_id, unit_cost, notes, created_by)
                    VALUES (:loc, :part_id, :qty_change, 'PRODUCTION_RECEIPT', 'repair_orders', :ref_id, :unit_cost, :notes, :created_by)
                ");
                $this->db->bind(':loc', $locationId);
                $this->db->bind(':part_id', $pid);
                $this->db->bind(':qty_change', $qty);
                $this->db->bind(':ref_id', $oid);
                $this->db->bind(':unit_cost', $unitCost);
                $this->db->bind(':notes', 'A La Carte Assembly');
                $this->db->bind(':created_by', $userId);
                $this->db->execute();
                
                $this->db->query("UPDATE parts SET stock_quantity = stock_quantity + :qty WHERE id = :id");
                $this->db->bind(':qty', $qty);
                $this->db->bind(':id', $pid);
                $this->db->execute();
            }
            
            if ($isFifo && $qty > 0) {
                // FIFO Batch Deduction
                $batchModel = new InventoryBatch();
                $deductions = $batchModel->deductStockFIFO($pid, $locationId, $qty);
                if (count($deductions) === 0 && $qty > 0) {
                    $this->db->exec("ROLLBACK");
                    return ['error' => 'No available batches found for this product (though ledger shows stock)'];
                }

                $totalDeducted = 0;
                $lastLineId = 0;

                foreach ($deductions as $d) {
                    $dQty = $d['qty_deducted'];
                    $bId = $d['batch_id'];
                    $totalDeducted += $dQty;
                    $lineTotal = ($unitPrice !== null) ? round($unitPrice * $dQty, 2) : null;

                    // Create line
                    $this->db->query("
                        INSERT INTO order_parts (order_id, part_id, batch_id, quantity, unit_cost, unit_price, line_total, created_by, updated_by)
                        VALUES (:order_id, :part_id, :batch_id, :qty, :unit_cost, :unit_price, :line_total, :created_by, :updated_by)
                    ");
                    $this->db->bind(':order_id', $oid);
                    $this->db->bind(':part_id', $pid);
                    $this->db->bind(':batch_id', $bId);
                    $this->db->bind(':qty', $dQty);
                    $this->db->bind(':unit_cost', $unitCost);
                    $this->db->bind(':unit_price', $unitPrice);
                    $this->db->bind(':line_total', $lineTotal);
                    $this->db->bind(':created_by', $userId);
                    $this->db->bind(':updated_by', $userId);
                    $this->db->execute();
                    $lastLineId = (int)$this->db->lastInsertId();

                    // Ledger move
                    $this->db->query("
                        INSERT INTO stock_movements (location_id, part_id, batch_id, qty_change, movement_type, ref_table, ref_id, unit_cost, unit_price, notes, created_by)
                        VALUES (:loc, :part_id, :batch_id, :qty_change, 'ORDER_ISSUE', 'repair_orders', :ref_id, :unit_cost, :unit_price, :notes, :created_by)
                    ");
                    $this->db->bind(':loc', $locationId);
                    $this->db->bind(':part_id', $pid);
                    $this->db->bind(':batch_id', $bId);
                    $this->db->bind(':qty_change', -1 * $dQty);
                    $this->db->bind(':ref_id', $oid);
                    $this->db->bind(':unit_cost', $unitCost);
                    $this->db->bind(':unit_price', $unitPrice);
                    $this->db->bind(':notes', 'Issue to order (Batch)');
                    $this->db->bind(':created_by', $userId);
                    $this->db->execute();

                    // Synchronize parts.stock_quantity column
                    $this->db->query("UPDATE parts SET stock_quantity = stock_quantity - :qty WHERE id = :id");
                    $this->db->bind(':qty', $dQty);
                    $this->db->bind(':id', $pid);
                    $this->db->execute();
                }

                $this->db->exec("COMMIT");
                return $lastLineId;

            } else {
                // Non-FIFO or Service
                $lineTotal = ($unitPrice !== null) ? round($unitPrice * $qty, 2) : null;

                // Ledger move only if not service
                if (!$isService) {
                    $this->db->query("
                        INSERT INTO stock_movements (location_id, part_id, qty_change, movement_type, ref_table, ref_id, unit_cost, unit_price, notes, created_by)
                        VALUES (:loc, :part_id, :qty_change, 'ORDER_ISSUE', 'repair_orders', :ref_id, :unit_cost, :unit_price, :notes, :created_by)
                    ");
                    $this->db->bind(':loc', $locationId);
                    $this->db->bind(':part_id', $pid);
                    $this->db->bind(':qty_change', -1 * $qty);
                    $this->db->bind(':ref_id', $oid);
                    $this->db->bind(':unit_cost', $unitCost);
                    $this->db->bind(':unit_price', $unitPrice);
                    $this->db->bind(':notes', 'Issue to order');
                    $this->db->bind(':created_by', $userId);
                    $this->db->execute();

                    // Synchronize parts.stock_quantity column
                    $this->db->query("UPDATE parts SET stock_quantity = stock_quantity - :qty WHERE id = :id");
                    $this->db->bind(':qty', $qty);
                    $this->db->bind(':id', $pid);
                    $this->db->execute();
                }

                $this->db->query("
                    INSERT INTO order_parts (order_id, part_id, quantity, unit_cost, unit_price, line_total, created_by, updated_by)
                    VALUES (:order_id, :part_id, :qty, :unit_cost, :unit_price, :line_total, :created_by, :updated_by)
                ");
                $this->db->bind(':order_id', $oid);
                $this->db->bind(':part_id', $pid);
                $this->db->bind(':qty', $qty);
                $this->db->bind(':unit_cost', $unitCost);
                $this->db->bind(':unit_price', $unitPrice);
                $this->db->bind(':line_total', $lineTotal);
                $this->db->bind(':created_by', $userId);
                $this->db->bind(':updated_by', $userId);
                $this->db->execute();
                $lineId = (int)$this->db->lastInsertId();

                $this->db->exec("COMMIT");
                return $lineId;
            }
        } catch (Exception $e) {
            try { $this->db->exec("ROLLBACK"); } catch (Exception $e2) {}
            return false;
        }
    }

    public function updateQty($lineId, $newQty, $userId = null) {
        // // // // // // $this->ensureSchema();
        $lid = (int)$lineId;
        $newQty = (float)$newQty;
        if ($lid <= 0 || $newQty <= 0) return false;

        try {
            $this->db->exec("START TRANSACTION");

            $this->db->query("SELECT * FROM order_parts WHERE id = :id FOR UPDATE");
            $this->db->bind(':id', $lid);
            $line = $this->db->single();
            if (!$line) {
                $this->db->exec("ROLLBACK");
                return false;
            }

            $oldQty = (float)$line->quantity;
            $diff = $newQty - $oldQty;
            if (abs($diff) < 0.0001) {
                $this->db->exec("COMMIT");
                return true;
            }

            $pid = (int)$line->part_id;
            $oid = (int)$line->order_id;
            $batchId = $line->batch_id;

            $this->db->query("SELECT item_type FROM parts WHERE id = :id");
            $this->db->bind(':id', $pid);
            $isService = ((string)($this->db->single()->item_type ?? 'Part') === 'Service');

            // If increasing, check stock
            if ($diff > 0 && !$isService) {
                $this->db->query("SELECT location_id FROM repair_orders WHERE id = :id");
                $this->db->bind(':id', $oid);
                $loc = (int)($this->db->single()->location_id ?? 1);

                $this->db->query("SELECT COALESCE(SUM(qty_change), 0) as qty FROM stock_movements WHERE location_id = :loc AND part_id = :pid");
                $this->db->bind(':loc', $loc);
                $this->db->bind(':pid', $pid);
                $ledgerTotal = (float)($this->db->single()->qty ?? 0);

                if ($ledgerTotal < $diff) {
                    $this->db->exec("ROLLBACK");
                    return ['error' => 'Insufficient stock.'];
                }
            }

            // Batch update if applicable
            if ($batchId && !$isService) {
                $this->db->query("UPDATE inventory_batches SET quantity_on_hand = quantity_on_hand - :diff, is_exhausted = IF(quantity_on_hand - :diff <= 0, 1, 0) WHERE id = :bid");
                $this->db->bind(':diff', $diff);
                $this->db->bind(':bid', $batchId);
                $this->db->execute();
            }

            // Ledger move if not service
            if (!$isService) {
                $this->db->query("
                    INSERT INTO stock_movements (location_id, part_id, batch_id, qty_change, movement_type, ref_table, ref_id, unit_cost, unit_price, notes, created_by)
                    VALUES ((SELECT location_id FROM repair_orders WHERE id = :oid), :part_id, :batch_id, :qty_change, 'ORDER_ISSUE', 'repair_orders', :ref_id, :unit_cost, :unit_price, :notes, :created_by)
                ");
                $this->db->bind(':oid', $oid);
                $this->db->bind(':part_id', $pid);
                $this->db->bind(':batch_id', $batchId);
                $this->db->bind(':qty_change', -1 * $diff);
                $this->db->bind(':ref_id', $oid);
                $this->db->bind(':unit_cost', (float)$line->unit_cost);
                $this->db->bind(':unit_price', (float)$line->unit_price);
                $this->db->bind(':notes', 'Update issued qty');
                $this->db->bind(':created_by', $userId);
                $this->db->execute();

                // Synchronize parts.stock_quantity column
                $this->db->query("UPDATE parts SET stock_quantity = stock_quantity - :diff WHERE id = :id");
                $this->db->bind(':diff', $diff);
                $this->db->bind(':id', $pid);
                $this->db->execute();
            }

            $unitPrice = $line->unit_price !== null ? (float)$line->unit_price : null;
            $lineTotal = ($unitPrice !== null) ? round($unitPrice * $newQty, 2) : null;

            $this->db->query("UPDATE order_parts SET quantity = :q, line_total = :t, updated_by = :u WHERE id = :id");
            $this->db->bind(':q', $newQty);
            $this->db->bind(':t', $lineTotal);
            $this->db->bind(':u', $userId);
            $this->db->bind(':id', $lid);
            $this->db->execute();

            $this->db->exec("COMMIT");
            return true;
        } catch (Exception $e) {
            try { $this->db->exec("ROLLBACK"); } catch (Exception $e2) {}
            return false;
        }
    }

    public function deleteLine($lineId, $userId = null) {
        // // // // // // $this->ensureSchema();
        $lid = (int)$lineId;
        if ($lid <= 0) return false;

        try {
            $this->db->exec("START TRANSACTION");

            $this->db->query("SELECT * FROM order_parts WHERE id = :id FOR UPDATE");
            $this->db->bind(':id', $lid);
            $line = $this->db->single();
            if (!$line) {
                $this->db->exec("ROLLBACK");
                return false;
            }

            $pid = (int)$line->part_id;
            $oid = (int)$line->order_id;
            $qty = (float)$line->quantity;
            $batchId = $line->batch_id;

            $this->db->query("SELECT item_type FROM parts WHERE id = :id");
            $this->db->bind(':id', $pid);
            $isService = ((string)($this->db->single()->item_type ?? 'Part') === 'Service');

            if (!$isService) {
                // Return to ledger
                $this->db->query("
                    INSERT INTO stock_movements (location_id, part_id, batch_id, qty_change, movement_type, ref_table, ref_id, unit_cost, unit_price, notes, created_by)
                    VALUES ((SELECT location_id FROM repair_orders WHERE id = :oid), :part_id, :batch_id, :qty, 'ORDER_RETURN', 'repair_orders', :ref_id, :unit_cost, :unit_price, 'Item removed', :created_by)
                ");
                $this->db->bind(':oid', $oid);
                $this->db->bind(':part_id', $pid);
                $this->db->bind(':batch_id', $batchId);
                $this->db->bind(':qty', $qty);
                $this->db->bind(':ref_id', $oid);
                $this->db->bind(':unit_cost', (float)$line->unit_cost);
                $this->db->bind(':unit_price', (float)$line->unit_price);
                $this->db->bind(':created_by', $userId);
                $this->db->execute();

                // Synchronize parts.stock_quantity column
                $this->db->query("UPDATE parts SET stock_quantity = stock_quantity + :qty WHERE id = :id");
                $this->db->bind(':qty', $qty);
                $this->db->bind(':id', $pid);
                $this->db->execute();

                if ($batchId) {
                    $this->db->query("UPDATE inventory_batches SET quantity_on_hand = quantity_on_hand + :qty, is_exhausted = 0 WHERE id = :bid");
                    $this->db->bind(':qty', $qty);
                    $this->db->bind(':bid', $batchId);
                    $this->db->execute();
                }
            }

            $this->db->query("DELETE FROM order_parts WHERE id = :id");
            $this->db->bind(':id', $lid);
            $this->db->execute();

            $this->db->exec("COMMIT");
            return true;
        } catch (Exception $e) {
            try { $this->db->exec("ROLLBACK"); } catch (Exception $e2) {}
            return false;
        }
    }

    public function getLine($lineId) {
        $lid = (int)$lineId;
        $this->db->query("SELECT * FROM order_parts WHERE id = :id LIMIT 1");
        $this->db->bind(':id', $lid);
        return $this->db->single();
    }
}
