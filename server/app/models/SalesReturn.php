<?php
/**
 * SalesReturn Model
 */
class SalesReturn extends Model {
    private $table = 'sales_returns';

    public function getAll($filters = []) {
        $sql = "
            SELECT sr.*, i.invoice_no, 
                   COALESCE(c_i.name, c_sr.name) as customer_name
            FROM sales_returns sr
            LEFT JOIN invoices i ON sr.invoice_id = i.id
            LEFT JOIN customers c_i ON i.customer_id = c_i.id
            LEFT JOIN customers c_sr ON sr.customer_id = c_sr.id
            WHERE 1=1
        ";

        if (!empty($filters['status'])) {
            $sql .= " AND sr.status = :status";
        }
        if (!empty($filters['location_id'])) {
            $sql .= " AND sr.location_id = :location_id";
        }

        $sql .= " ORDER BY sr.created_at DESC";

        $this->db->query($sql);
        if (!empty($filters['status'])) $this->db->bind(':status', $filters['status']);
        if (!empty($filters['location_id'])) $this->db->bind(':location_id', (int)$filters['location_id']);

        return $this->db->resultSet();
    }

    public function getById($id) {
        $this->db->query("
            SELECT sr.*, i.invoice_no, 
                   COALESCE(c_i.name, c_sr.name) as customer_name,
                   COALESCE(c_i.phone, c_sr.phone) as customer_phone
            FROM sales_returns sr
            LEFT JOIN invoices i ON sr.invoice_id = i.id
            LEFT JOIN customers c_i ON i.customer_id = c_i.id
            LEFT JOIN customers c_sr ON sr.customer_id = c_sr.id
            WHERE sr.id = :id
        ");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function getItems($returnId) {
        $this->db->query("SELECT * FROM sales_return_items WHERE return_id = :return_id ORDER BY id ASC");
        $this->db->bind(':return_id', $returnId);
        return $this->db->resultSet();
    }

    public function create($data) {
        try {
            $this->db->exec("START TRANSACTION");

            // 1. Generate Return Number
            $returnNo = $this->generateReturnNo($data['location_id'] ?? 1);
            
            // 2. Create Return Header
            $this->db->query("
                INSERT INTO sales_returns (
                    return_no, invoice_id, customer_id, return_date, total_amount, reason, location_id, created_by
                ) VALUES (
                    :return_no, :invoice_id, :customer_id, :return_date, :total_amount, :reason, :location_id, :created_by
                )
            ");
            $this->db->bind(':return_no', $returnNo);
            $this->db->bind(':invoice_id', $data['invoice_id'] ?? null);
            $this->db->bind(':customer_id', $data['customer_id'] ?? null);
            $this->db->bind(':return_date', $data['return_date'] ?? date('Y-m-d'));
            $this->db->bind(':total_amount', $data['total_amount']);
            $this->db->bind(':reason', $data['reason'] ?? null);
            $this->db->bind(':location_id', $data['location_id'] ?? 1);
            $this->db->bind(':created_by', $data['userId']);

            if (!$this->db->execute()) {
                $this->db->exec("ROLLBACK");
                return false;
            }

            $returnId = $this->db->lastInsertId();

            // 3. Create Items and Adjust Stock
            foreach ($data['items'] as $item) {
                if (!empty($data['invoice_id'])) {
                    $this->db->query("
                        SELECT ii.quantity as original_qty,
                               COALESCE((
                                   SELECT SUM(sri.quantity) 
                                   FROM sales_return_items sri 
                                   JOIN sales_returns sr ON sri.return_id = sr.id 
                                   WHERE sr.invoice_id = :inv_id 
                                     AND sri.item_id = :item_id 
                                     AND sri.item_type = :item_type
                                     AND sri.description = :desc
                               ), 0) as previously_returned
                        FROM invoice_items ii
                        WHERE ii.invoice_id = :inv_id 
                          AND ii.item_id = :item_id 
                          AND ii.item_type = :item_type
                          AND ii.description = :desc
                        LIMIT 1
                    ");
                    $this->db->bind(':inv_id', $data['invoice_id']);
                    $this->db->bind(':item_id', $item['item_id']);
                    $this->db->bind(':item_type', $item['item_type'] ?? 'Part');
                    $this->db->bind(':desc', $item['description']);
                    $check = $this->db->single();

                    if ($check) {
                        $available = $check->original_qty - $check->previously_returned;
                        if ($item['quantity'] > $available) {
                            throw new Exception("Return quantity ({$item['quantity']}) exceeds available returnable quantity ({$available}) for item: {$item['description']}");
                        }
                    }
                }

                $this->db->query("
                    INSERT INTO sales_return_items (
                        return_id, item_id, item_type, description, quantity, unit_price, line_total, reason
                    ) VALUES (
                        :return_id, :item_id, :item_type, :description, :quantity, :unit_price, :line_total, :reason
                    )
                ");
                $this->db->bind(':return_id', $returnId);
                $this->db->bind(':item_id', $item['item_id']);
                $this->db->bind(':item_type', $item['item_type'] ?? 'Part');
                $this->db->bind(':description', $item['description']);
                $this->db->bind(':quantity', $item['quantity']);
                $this->db->bind(':unit_price', $item['unit_price']);
                $this->db->bind(':line_total', $item['line_total']);
                $this->db->bind(':reason', $item['reason'] ?? $data['reason'] ?? null);
                $this->db->execute();

                // Increase stock for 'Part' items
                if (($item['item_type'] ?? 'Part') === 'Part') {
                    $this->db->query("UPDATE parts SET stock_quantity = stock_quantity + :qty WHERE id = :pid");
                    $this->db->bind(':qty', $item['quantity']);
                    $this->db->bind(':pid', $item['item_id']);
                    $this->db->execute();

                    // Log stock movement
                    $this->db->query("
                        INSERT INTO stock_movements (
                            part_id, location_id, qty_change, movement_type, ref_table, ref_id, unit_price, notes, created_by
                        ) VALUES (
                            :part_id, :location_id, :qty_change, 'SALES_RETURN', 'sales_returns', :ref_id, :unit_price, :notes, :created_by
                        )
                    ");
                    $this->db->bind(':part_id', $item['item_id']);
                    $this->db->bind(':location_id', $data['location_id'] ?? 1);
                    $this->db->bind(':qty_change', $item['quantity']);
                    $this->db->bind(':ref_id', $returnId);
                    $this->db->bind(':unit_price', $item['unit_price']);
                    $this->db->bind(':notes', 'Sales Return: ' . $returnNo);
                    $this->db->bind(':created_by', $data['userId']);
                    $this->db->execute();
                }
            }

            // Automated Accounting
            require_once '../app/helpers/AccountingHelper.php';
            AccountingHelper::postSalesReturn($returnId, $data);

            $this->db->exec("COMMIT");
            return ['id' => $returnId, 'return_no' => $returnNo];
        } catch (Exception $e) {
            error_log("RETURN_CREATE_ERROR: " . $e->getMessage());
            try { $this->db->exec("ROLLBACK"); } catch (Exception $ex) {}
            return ['error' => $e->getMessage()];
        }
    }

    private function generateReturnNo($locationId = 1) {
        require_once '../app/helpers/DocumentSequenceHelper.php';
        return DocumentSequenceHelper::getStandardDocNo('SR', $locationId);
    }
}
