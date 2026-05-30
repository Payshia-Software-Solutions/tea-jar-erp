<?php
/**
 * Inventory Batch Model
 * Handles batch-level stock management for FIFO and Expiry tracking
 */
class InventoryBatch extends Model {
    private $table = 'inventory_batches';

    /**
     * Retrieves batches with positive balance derived from stock_movements.
     * Includes unbatched stock (batch_id IS NULL) to ensure agreement with total ledger.
     */
    public function getAvailableBatches($partId, $locationId = 1, $includeNegative = false) {
        $having = $includeNegative ? "HAVING ABS(quantity_on_hand) > 0.0001" : "HAVING quantity_on_hand > 0.0001";
        $this->db->query("
            SELECT 
                COALESCE(b.id, 0) as id,
                COALESCE(b.batch_number, 'UNBATCHED') as batch_number,
                b.mfg_date,
                b.expiry_date,
                COALESCE(SUM(sm.qty_change), 0) AS quantity_on_hand
            FROM stock_movements sm
            LEFT JOIN {$this->table} b ON b.id = sm.batch_id
            WHERE sm.part_id = :part_id AND sm.location_id = :loc
            GROUP BY sm.batch_id
            {$having}
            ORDER BY 
                CASE WHEN b.mfg_date IS NULL THEN 1 ELSE 0 END, 
                b.mfg_date ASC, 
                CASE WHEN b.created_at IS NULL THEN 1 ELSE 0 END,
                b.created_at ASC, 
                b.id ASC
        ");
        $this->db->bind(':part_id', (int)$partId);
        $this->db->bind(':loc', (int)$locationId);
        return $this->db->resultSet();
    }

    /**
     * Calculates quantity deduction from batches following FIFO principle.
     * This is a PURE function (no DB updates) as stock_movements are recorded 
     * by the calling controller/model.
     * 
     * Returns array of [batch_id, qty_deducted]
     */
    public function deductStockFIFO($partId, $locationId, $qtyToDeduct) {
        $qty = (float)$qtyToDeduct;
        if ($qty <= 0) return [];

        $batches = $this->getAvailableBatches($partId, $locationId);
        $deductions = [];
        $remaining = $qty;

        foreach ($batches as $batch) {
            if ($remaining <= 0) break;

            $onHand = (float)$batch->quantity_on_hand;
            $take = min($remaining, $onHand);

            if ($take > 0.0001) {
                // We return batch_id as NULL if it was the 'UNBATCHED' group (id=0 in query)
                $realBatchId = (int)$batch->id > 0 ? (int)$batch->id : null;

                $deductions[] = [
                    'batch_id' => $realBatchId,
                    'qty_deducted' => round($take, 3)
                ];
                $remaining = round($remaining - $take, 3);
            }
        }

        return $deductions;
    }
}
