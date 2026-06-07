<?php
/**
 * IssueNote Model
 * Tracks raw stock consumption and issues directed at production/cost centers.
 */
class IssueNote extends Model {
    private function nextDocNumber($docType, $locationId = 1) {
        require_once __DIR__ . '/../helpers/DocumentSequenceHelper.php';
        return DocumentSequenceHelper::getStandardDocNo($docType, $locationId);
    }

    private function genNumber($locationId = 1) {
        try {
            return $this->nextDocNumber('ISN', $locationId);
        } catch (Exception $e) {
            $dt = new DateTime('now');
            $stamp = $dt->format('Ymd');
            $rand = substr(strtoupper(bin2hex(random_bytes(3))), 0, 6);
            return "ISN-{$stamp}-{$rand}";
        }
    }

    public function list($q = '', $allowedLocs = []) {
        $q = is_string($q) ? trim($q) : '';

        $sql = "
            SELECT isn.*,
                   u.name AS created_by_name,
                   sl.name AS location_name,
                   cc.name AS cost_center_name,
                   COUNT(ini.id) AS line_count,
                   SUM(ini.qty_issued) AS total_qty_issued,
                   SUM(ini.line_total) AS total_amount
            FROM issue_notes isn
            LEFT JOIN users u ON u.id = isn.created_by
            LEFT JOIN service_locations sl ON sl.id = isn.location_id
            LEFT JOIN service_locations cc ON cc.id = isn.cost_center_id
            LEFT JOIN issue_note_items ini ON ini.issue_note_id = isn.id
            WHERE 1=1
        ";
        
        if (is_array($allowedLocs) && count($allowedLocs) > 0) {
            $cleanIds = array_map('intval', $allowedLocs);
            $sql .= " AND isn.location_id IN (" . implode(',', $cleanIds) . ")";
        }
        
        if ($q !== '') {
            $sql .= " AND (isn.issue_number LIKE :q OR cc.name LIKE :q)";
        }
        $sql .= " GROUP BY isn.id ORDER BY isn.id DESC";

        $this->db->query($sql);
        if ($q !== '') {
            $this->db->bind(':q', '%' . $q . '%');
        }
        return $this->db->resultSet();
    }

    public function getById($id) {
        $this->db->query("
            SELECT isn.*, u.name AS created_by_name, sl.name AS location_name, cc.name AS cost_center_name
            FROM issue_notes isn
            LEFT JOIN users u ON u.id = isn.created_by
            LEFT JOIN service_locations sl ON sl.id = isn.location_id
            LEFT JOIN service_locations cc ON cc.id = isn.cost_center_id
            WHERE isn.id = :id
            LIMIT 1
        ");
        $this->db->bind(':id', (int)$id);
        $hdr = $this->db->single();
        if (!$hdr) return null;

        $this->db->query("
            SELECT ini.*, p.part_name, p.sku, p.unit, b.batch_number
            FROM issue_note_items ini
            INNER JOIN parts p ON p.id = ini.part_id
            LEFT JOIN inventory_batches b ON b.id = ini.batch_id
            WHERE ini.issue_note_id = :id
            ORDER BY ini.id ASC
        ");
        $this->db->bind(':id', (int)$id);
        $items = $this->db->resultSet();

        return (object)[
            'issue_note' => $hdr,
            'items' => $items,
        ];
    }

    public function create($data, $userId = null) {
        $locId = (int)($data['location_id'] ?? 1);
        if ($locId <= 0) $locId = 1;
        $items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];
        if (count($items) === 0) return ['error' => 'No items provided'];

        $costCenterId = (int)($data['cost_center_id'] ?? 0);
        if ($costCenterId <= 0) return ['error' => 'Cost Center location required'];

        $num = trim((string)($data['issue_number'] ?? ''));
        if ($num === '') $num = $this->genNumber($locId);

        try {
            $this->db->beginTransaction();

            $this->db->query("
                INSERT INTO issue_notes (location_id, issue_number, cost_center_id, status, notes, created_by)
                VALUES (:loc, :num, :cc, 'Draft', :notes, :u)
            ");
            $this->db->bind(':loc', $locId);
            $this->db->bind(':num', $num);
            $this->db->bind(':cc', $costCenterId);
            $this->db->bind(':notes', $data['notes'] ?? null);
            $this->db->bind(':u', $userId);
            $this->db->execute();
            $id = (int)$this->db->lastInsertId();

            require_once 'Part.php';
            $partModel = new Part();

            foreach ($items as $it) {
                $pid = (int)($it['part_id'] ?? 0);
                $qty = (float)($it['qty_issued'] ?? 0);
                $bid = !empty($it['batch_id']) ? (int)$it['batch_id'] : null;
                $note = isset($it['notes']) ? trim((string)$it['notes']) : null;

                if ($pid <= 0 || $qty <= 0) continue;

                $part = $partModel->getById($pid);
                if (!$part) {
                    $this->db->rollBack();
                    return ['error' => "Product ID {$pid} not found"];
                }

                $cost = (float)$part->cost_price;
                $total = round($cost * $qty, 2);

                $this->db->query("
                    INSERT INTO issue_note_items (issue_note_id, part_id, batch_id, qty_issued, unit_cost, line_total, notes)
                    VALUES (:note_id, :part_id, :batch_id, :qty, :cost, :total, :notes)
                ");
                $this->db->bind(':note_id', $id);
                $this->db->bind(':part_id', $pid);
                $this->db->bind(':batch_id', $bid);
                $this->db->bind(':qty', $qty);
                $this->db->bind(':cost', $cost);
                $this->db->bind(':total', $total);
                $this->db->bind(':notes', $note);
                $this->db->execute();
            }

            $this->db->commit();
            
            // If user wants to immediately issue it
            if (!empty($data['immediate_issue'])) {
                $issueResult = $this->issue($id, $userId);
                if ($issueResult !== true) {
                    return $issueResult;
                }
            }

            return $id;
        } catch (Exception $e) {
            try { $this->db->rollBack(); } catch (Exception $ex) {}
            return ['error' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function issue($id, $userId = null) {
        $note = $this->getById($id);
        if (!$note || !$note->issue_note) return ['error' => 'Issue note not found'];
        if ($note->issue_note->status !== 'Draft') return ['error' => 'Only Draft issue notes can be issued'];

        $locId = (int)$note->issue_note->location_id;
        $costCenterName = $note->issue_note->cost_center_name ?? ("Location ID: " . $note->issue_note->cost_center_id);
        $num = $note->issue_note->issue_number;

        try {
            $this->db->beginTransaction();

            require_once 'Part.php';
            require_once 'InventoryBatch.php';
            $partModel = new Part();
            $batchModel = new InventoryBatch();

            foreach ($note->items as $it) {
                $pid = (int)$it->part_id;
                $qty = (float)$it->qty_issued;
                $bid = !empty($it->batch_id) ? (int)$it->batch_id : null;

                // Check stock availability
                $this->db->query("
                    SELECT COALESCE(SUM(qty_change), 0) AS qty
                    FROM stock_movements
                    WHERE location_id = :loc AND part_id = :pid
                ");
                $this->db->bind(':loc', $locId);
                $this->db->bind(':pid', $pid);
                $ledgerTotal = (float)($this->db->single()->qty ?? 0);

                if ($ledgerTotal < $qty) {
                    $this->db->rollBack();
                    return ['error' => "Insufficient stock for product ID {$pid}. Available: {$ledgerTotal}"];
                }

                // Deduct stock from parts
                $this->db->query("UPDATE parts SET stock_quantity = stock_quantity - :qty WHERE id = :id");
                $this->db->bind(':qty', $qty);
                $this->db->bind(':id', $pid);
                $this->db->execute();

                // Deduct stock from batch if applicable
                if ($bid) {
                    $this->db->query("UPDATE inventory_batches SET quantity_on_hand = quantity_on_hand - :qty, is_exhausted = IF(quantity_on_hand - :qty <= 0, 1, 0) WHERE id = :bid");
                    $this->db->bind(':qty', $qty);
                    $this->db->bind(':bid', $bid);
                    $this->db->execute();
                }

                // Add stock movement log
                $this->db->query("
                    INSERT INTO stock_movements (location_id, part_id, batch_id, qty_change, movement_type, ref_table, ref_id, unit_cost, notes, created_by)
                    VALUES (:loc, :part_id, :batch_id, :qty, 'MATERIAL_ISSUE', 'issue_notes', :ref_id, :cost, :notes, :u)
                ");
                $this->db->bind(':loc', $locId);
                $this->db->bind(':part_id', $pid);
                $this->db->bind(':batch_id', $bid);
                $this->db->bind(':qty', -1 * $qty);
                $this->db->bind(':ref_id', $id);
                $this->db->bind(':cost', $it->unit_cost);
                $this->db->bind(':notes', "Issue Note {$num} to {$costCenterName}");
                $this->db->bind(':u', $userId);
                $this->db->execute();
            }

            // Update status
            $this->db->query("UPDATE issue_notes SET status = 'Issued', issued_at = NOW() WHERE id = :id");
            $this->db->bind(':id', $id);
            $this->db->execute();

            $this->db->commit();

            // Accounting Post
            try {
                require_once __DIR__ . '/../helpers/AccountingHelper.php';
                AccountingHelper::postIssueNote($id);
            } catch (Exception $e) {
                error_log("Accounting post failed for Issue Note: " . $e->getMessage());
            }

            return true;
        } catch (Exception $e) {
            try { $this->db->rollBack(); } catch (Exception $ex) {}
            return ['error' => 'Database error: ' . $e->getMessage()];
        }
    }

    public function cancel($id, $userId = null) {
        $note = $this->getById($id);
        if (!$note || !$note->issue_note) return ['error' => 'Issue note not found'];
        if ($note->issue_note->status !== 'Issued') return ['error' => 'Only Issued notes can be cancelled'];

        $locId = (int)$note->issue_note->location_id;
        $num = $note->issue_note->issue_number;

        try {
            $this->db->beginTransaction();

            foreach ($note->items as $it) {
                $pid = (int)$it->part_id;
                $qty = (float)$it->qty_issued;
                $bid = !empty($it->batch_id) ? (int)$it->batch_id : null;

                // Revert stock in parts
                $this->db->query("UPDATE parts SET stock_quantity = stock_quantity + :qty WHERE id = :id");
                $this->db->bind(':qty', $qty);
                $this->db->bind(':id', $pid);
                $this->db->execute();

                // Revert stock in batch if applicable
                if ($bid) {
                    $this->db->query("UPDATE inventory_batches SET quantity_on_hand = quantity_on_hand + :qty, is_exhausted = 0 WHERE id = :bid");
                    $this->db->bind(':qty', $qty);
                    $this->db->bind(':bid', $bid);
                    $this->db->execute();
                }

                // Add reverse stock movement log
                $this->db->query("
                    INSERT INTO stock_movements (location_id, part_id, batch_id, qty_change, movement_type, ref_table, ref_id, unit_cost, notes, created_by)
                    VALUES (:loc, :part_id, :batch_id, :qty, 'MATERIAL_ISSUE', 'issue_notes', :ref_id, :cost, :notes, :u)
                ");
                $this->db->bind(':loc', $locId);
                $this->db->bind(':part_id', $pid);
                $this->db->bind(':batch_id', $bid);
                $this->db->bind(':qty', $qty); // Positive to revert
                $this->db->bind(':ref_id', $id);
                $this->db->bind(':cost', $it->unit_cost);
                $this->db->bind(':notes', "CANCELLED: Issue Note {$num}");
                $this->db->bind(':u', $userId);
                $this->db->execute();
            }

            // Update status
            $this->db->query("UPDATE issue_notes SET status = 'Cancelled' WHERE id = :id");
            $this->db->bind(':id', $id);
            $this->db->execute();

            $this->db->commit();

            // Reverse journal entries on cancellation
            try {
                require_once 'Journal.php';
                $journal = new Journal();
                $journal->reverseEntries('IssueNote', $id, $userId);
            } catch (Exception $e) {
                error_log("Failed to reverse journal entries for cancelled Issue Note: " . $e->getMessage());
            }

            return true;
        } catch (Exception $e) {
            try { $this->db->rollBack(); } catch (Exception $ex) {}
            return ['error' => 'Database error: ' . $e->getMessage()];
        }
    }
}
