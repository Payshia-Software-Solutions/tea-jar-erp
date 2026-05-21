<?php
/**
 * Shipping Costing Sheet Model
 */
class ShippingCostingSheet extends Model {
    private $table = 'shipping_costing_sheets';
    private $itemsTable = 'shipping_costing_sheet_items';
    private $productsTable = 'shipping_costing_sheet_products';

    private function ensureSchema() {
        require_once '../app/helpers/ShippingSchema.php';
        ShippingSchema::ensure();
        require_once '../app/helpers/InventorySchema.php';
        InventorySchema::ensure();
    }

    private function nextDocNumber($docType, $locationId = 1) {
        require_once __DIR__ . '/../helpers/DocumentSequenceHelper.php';
        return DocumentSequenceHelper::getStandardDocNo($docType, $locationId);
    }

    public function list($customerId = null) {
        $sql = "SELECT s.*, c.name as customer_name, t.name as template_name 
                FROM {$this->table} s
                LEFT JOIN customers c ON c.id = s.customer_id
                LEFT JOIN shipping_costing_templates t ON t.id = s.template_id";
        
        if ($customerId) {
            $sql .= " WHERE s.customer_id = :cid";
        }
        $sql .= " ORDER BY s.created_at DESC";
        
        $this->db->query($sql);
        if ($customerId) {
            $this->db->bind(':cid', $customerId);
        }
        return $this->db->resultSet();
    }

    public function getById($id) {
        $this->db->query("SELECT s.*, c.name as customer_name, t.name as template_name 
                         FROM {$this->table} s
                         LEFT JOIN customers c ON c.id = s.customer_id
                         LEFT JOIN shipping_costing_templates t ON t.id = s.template_id
                         WHERE s.id = :id");
        $this->db->bind(':id', $id);
        $sheet = $this->db->single();
        
        if ($sheet) {
            $this->db->query("SELECT * FROM {$this->itemsTable} WHERE sheet_id = :id");
            $this->db->bind(':id', $id);
            $sheet->items = $this->db->resultSet();

            // Load products
            $this->db->query("SELECT cp.*, p.part_name, p.sku, p.unit, p.hs_code as original_hs_code 
                             FROM shipping_costing_sheet_products cp
                             INNER JOIN parts p ON p.id = cp.part_id
                             WHERE cp.sheet_id = :id");
            $this->db->bind(':id', $id);
            $sheet->product_items = $this->db->resultSet();
        }
        
        return $sheet;
    }

    public function create($data, $userId = null) {
        $this->ensureSchema();
        $this->db->beginTransaction();
        try {
            $costingNumber = trim((string)($data['costing_number'] ?? ''));
            if ($costingNumber === '') {
                $costingNumber = $this->nextDocNumber('EXPQT');
            }

            $this->db->query("
                INSERT INTO {$this->table} (
                    costing_number, template_id, customer_id, reference_number, shipping_term, freight_type, shipment_mode, 
                    profit_method, profit_base, profit_value, base_carrier_cost, total_quantity, total_cost, 
                    status, overhead_absorption_method, target_currency, exchange_rate, created_by, updated_by
                )
                VALUES (
                    :cn, :tid, :cid, :ref, :term, :ftype, :smode, 
                    :pmethod, :pbase, :pval, :base, :qty, :total, 
                    :status, :oam, :curr, :rate, :u, :u
                )
            ");
            $this->db->bind(':cn', $costingNumber);
            $this->db->bind(':tid', (!empty($data['template_id']) && $data['template_id'] !== 'none') ? $data['template_id'] : null);
            $this->db->bind(':cid', !empty($data['customer_id']) ? $data['customer_id'] : null);
            $this->db->bind(':ref', $data['reference_number'] ?? null);
            $this->db->bind(':term', $data['shipping_term'] ?? null);
            $this->db->bind(':ftype', $data['freight_type'] ?? null);
            $this->db->bind(':smode', $data['shipment_mode'] ?? 'LCL');
            $this->db->bind(':pmethod', $data['profit_method'] ?? 'Markup');
            $this->db->bind(':pbase', $data['profit_base'] ?? 'Landed');
            $this->db->bind(':pval', $data['profit_value'] ?? 0);
            $this->db->bind(':base', $data['base_carrier_cost'] ?? 0);
            $this->db->bind(':qty', $data['total_quantity'] ?? 0);
            $this->db->bind(':total', $data['total_cost'] ?? 0);
            $this->db->bind(':status', $data['status'] ?? 'Draft');
            $this->db->bind(':oam', $data['overhead_absorption_method'] ?? 'Value');
            $this->db->bind(':curr', $data['target_currency'] ?? 'USD');
            $this->db->bind(':rate', $data['exchange_rate'] ?? 1);
            $this->db->bind(':u', $userId);
            $this->db->execute();
            
            $sheetId = $this->db->lastInsertId();

            if (!empty($data['items'])) {
                foreach ($data['items'] as $item) {
                    $this->db->query("
                        INSERT INTO {$this->itemsTable} (sheet_id, name, cost_type, value, calculated_amount, absorption_method)
                        VALUES (:sid, :name, :type, :val, :calc, :abs)
                    ");
                    $this->db->bind(':sid', $sheetId);
                    $this->db->bind(':name', $item['name']);
                    $this->db->bind(':type', $item['cost_type']);
                    $this->db->bind(':val', $item['value']);
                    $this->db->bind(':calc', $item['calculated_amount']);
                    $this->db->bind(':abs', $item['absorption_method'] ?? 'Value');
                    $this->db->execute();
                }
            }

            if (!empty($data['product_items'])) {
                foreach ($data['product_items'] as $p) {
                    $this->db->query("
                        INSERT INTO shipping_costing_sheet_products 
                        (sheet_id, part_id, quantity, unit_cost, profit_margin, profit_method, profit_base, weight, cbm, packaging_type_id, packing_type, hs_code, units_per_carton, carton_length_cm, carton_width_cm, carton_height_cm, volume_cbm, carton_tare_weight_kg, net_weight_kg, gross_weight_kg)
                        VALUES 
                        (:sid, :pid, :qty, :cost, :pmargin, :pmethod, :pbase, :wt, :cbm, :pkgid, :ptype, :hsc, :upc, :l, :w, :h, :vcbm, :tare, :net, :gross)
                    ");
                    $this->db->bind(':sid', $sheetId);
                    $this->db->bind(':pid', !empty($p['part_id']) ? $p['part_id'] : null);
                    $this->db->bind(':qty', $p['quantity'] ?? 0);
                    $this->db->bind(':cost', $p['unit_cost'] ?? 0);
                    $this->db->bind(':pmargin', $p['profit_margin'] ?? 0);
                    $this->db->bind(':pmethod', $p['profit_method'] ?? null);
                    $this->db->bind(':pbase', $p['profit_base'] ?? null);
                    $this->db->bind(':wt', $p['weight'] ?? 0);
                    $this->db->bind(':cbm', $p['cbm'] ?? 0);
                    $this->db->bind(':pkgid', isset($p['packaging_type_id']) && $p['packaging_type_id'] !== 'none' ? $p['packaging_type_id'] : null);
                    $this->db->bind(':ptype', $p['packing_type'] ?? 'Carton');
                    $this->db->bind(':hsc', $p['hs_code'] ?? null);
                    $this->db->bind(':upc', $p['units_per_carton'] ?? 1);
                    $this->db->bind(':l', $p['carton_length_cm'] ?? $p['carton_length'] ?? 0);
                    $this->db->bind(':w', $p['carton_width_cm'] ?? $p['carton_width'] ?? 0);
                    $this->db->bind(':h', $p['carton_height_cm'] ?? $p['carton_height'] ?? 0);
                    $this->db->bind(':vcbm', $p['volume_cbm'] ?? 0);
                    $this->db->bind(':tare', $p['carton_tare_weight_kg'] ?? $p['carton_tare_weight'] ?? 0);
                    $this->db->bind(':net', $p['net_weight_kg'] ?? $p['net_weight'] ?? 0);
                    $this->db->bind(':gross', $p['gross_weight_kg'] ?? $p['gross_weight'] ?? 0);
                    $this->db->execute();
                }
            }

            $this->db->commit();
            return $sheetId;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("ShippingCostingSheet::create error: " . $e->getMessage());
            return false;
        }
    }

    public function update($id, $data, $userId = null) {
        $this->ensureSchema();
        $this->db->beginTransaction();
        try {
            $this->db->query("
                UPDATE {$this->table}
                SET costing_number = :cn,
                    template_id = :tid,
                    customer_id = :cid,
                    reference_number = :ref,
                    shipping_term = :term,
                    freight_type = :ftype,
                    shipment_mode = :smode,
                    profit_method = :pmethod,
                    profit_base = :pbase,
                    profit_value = :pval,
                    base_carrier_cost = :base,
                    total_quantity = :qty,
                    total_cost = :total,
                    status = :status,
                    overhead_absorption_method = :oam,
                    target_currency = :curr,
                    exchange_rate = :rate,
                    updated_by = :u
                WHERE id = :id
            ");
            $this->db->bind(':cn', $data['costing_number'] ?? null);
            $this->db->bind(':tid', (!empty($data['template_id']) && $data['template_id'] !== 'none') ? $data['template_id'] : null);
            $this->db->bind(':cid', !empty($data['customer_id']) ? $data['customer_id'] : null);
            $this->db->bind(':ref', $data['reference_number'] ?? null);
            $this->db->bind(':term', $data['shipping_term'] ?? null);
            $this->db->bind(':ftype', $data['freight_type'] ?? null);
            $this->db->bind(':smode', $data['shipment_mode'] ?? 'LCL');
            $this->db->bind(':pmethod', $data['profit_method'] ?? 'Markup');
            $this->db->bind(':pbase', $data['profit_base'] ?? 'Landed');
            $this->db->bind(':pval', $data['profit_value'] ?? 0);
            $this->db->bind(':base', $data['base_carrier_cost'] ?? 0);
            $this->db->bind(':qty', $data['total_quantity'] ?? 0);
            $this->db->bind(':total', $data['total_cost'] ?? 0);
            $this->db->bind(':status', $data['status'] ?? 'Draft');
            $this->db->bind(':oam', $data['overhead_absorption_method'] ?? 'Value');
            $this->db->bind(':curr', $data['target_currency'] ?? 'USD');
            $this->db->bind(':rate', $data['exchange_rate'] ?? 1);
            $this->db->bind(':u', $userId);
            $this->db->bind(':id', $id);
            $this->db->execute();

            // Replace items
            $this->db->query("DELETE FROM {$this->itemsTable} WHERE sheet_id = :id");
            $this->db->bind(':id', $id);
            $this->db->execute();

            if (!empty($data['items'])) {
                foreach ($data['items'] as $item) {
                    $this->db->query("
                        INSERT INTO {$this->itemsTable} (sheet_id, name, cost_type, value, calculated_amount, absorption_method)
                        VALUES (:sid, :name, :type, :val, :calc, :abs)
                    ");
                    $this->db->bind(':sid', $id);
                    $this->db->bind(':name', $item['name']);
                    $this->db->bind(':type', $item['cost_type']);
                    $this->db->bind(':val', $item['value']);
                    $this->db->bind(':calc', $item['calculated_amount']);
                    $this->db->bind(':abs', $item['absorption_method'] ?? 'Value');
                    $this->db->execute();
                }
            }

            // Replace products
            $this->db->query("DELETE FROM shipping_costing_sheet_products WHERE sheet_id = :id");
            $this->db->bind(':id', $id);
            $this->db->execute();

            if (!empty($data['product_items'])) {
                foreach ($data['product_items'] as $p) {
                    $this->db->query("
                        INSERT INTO shipping_costing_sheet_products 
                        (sheet_id, part_id, quantity, unit_cost, profit_margin, profit_method, profit_base, weight, cbm, packaging_type_id, packing_type, hs_code, units_per_carton, carton_length_cm, carton_width_cm, carton_height_cm, volume_cbm, carton_tare_weight_kg, net_weight_kg, gross_weight_kg)
                        VALUES 
                        (:sid, :pid, :qty, :cost, :pmargin, :pmethod, :pbase, :wt, :cbm, :pkgid, :ptype, :hsc, :upc, :l, :w, :h, :vcbm, :tare, :net, :gross)
                    ");
                    $this->db->bind(':sid', $id);
                    $this->db->bind(':pid', !empty($p['part_id']) ? $p['part_id'] : null);
                    $this->db->bind(':qty', $p['quantity'] ?? 0);
                    $this->db->bind(':cost', $p['unit_cost'] ?? 0);
                    $this->db->bind(':pmargin', $p['profit_margin'] ?? 0);
                    $this->db->bind(':pmethod', $p['profit_method'] ?? null);
                    $this->db->bind(':pbase', $p['profit_base'] ?? null);
                    $this->db->bind(':wt', $p['weight'] ?? 0);
                    $this->db->bind(':cbm', $p['cbm'] ?? 0);
                    $this->db->bind(':pkgid', isset($p['packaging_type_id']) && $p['packaging_type_id'] !== 'none' ? $p['packaging_type_id'] : null);
                    $this->db->bind(':ptype', $p['packing_type'] ?? 'Carton');
                    $this->db->bind(':hsc', $p['hs_code'] ?? null);
                    $this->db->bind(':upc', $p['units_per_carton'] ?? 1);
                    $this->db->bind(':l', $p['carton_length_cm'] ?? $p['carton_length'] ?? 0);
                    $this->db->bind(':w', $p['carton_width_cm'] ?? $p['carton_width'] ?? 0);
                    $this->db->bind(':h', $p['carton_height_cm'] ?? $p['carton_height'] ?? 0);
                    $this->db->bind(':vcbm', $p['volume_cbm'] ?? 0);
                    $this->db->bind(':tare', $p['carton_tare_weight_kg'] ?? $p['carton_tare_weight'] ?? 0);
                    $this->db->bind(':net', $p['net_weight_kg'] ?? $p['net_weight'] ?? 0);
                    $this->db->bind(':gross', $p['gross_weight_kg'] ?? $p['gross_weight'] ?? 0);
                    $this->db->execute();
                }
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("ShippingCostingSheet::update error: " . $e->getMessage());
            return false;
        }
    }

    public function delete($id) {
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function deleteBulk($ids) {
        if (empty($ids)) return true;
        // Ensure all IDs are integers
        $ids = array_map('intval', $ids);
        $idList = implode(',', $ids);
        $this->db->query("DELETE FROM {$this->table} WHERE id IN ($idList)");
        return $this->db->execute();
    }

    public function duplicate($id, $userId) {
        $sheet = $this->getById($id);
        if (!$sheet) return false;

        $this->ensureSchema();
        $this->db->beginTransaction();
        try {
            $costingNumber = $this->nextDocNumber('EXPQT');
            
            $this->db->query("
                INSERT INTO {$this->table} (
                    costing_number, template_id, customer_id, reference_number, shipping_term, freight_type, shipment_mode, 
                    profit_method, profit_base, profit_value, base_carrier_cost, total_quantity, total_cost, 
                    status, overhead_absorption_method, target_currency, exchange_rate, created_by, updated_by
                )
                VALUES (
                    :cn, :tid, :cid, :ref, :term, :ftype, :smode, 
                    :pmethod, :pbase, :pval, :base, :qty, :total, 
                    'Draft', :oam, :curr, :rate, :u, :u
                )
            ");
            $this->db->bind(':cn', $costingNumber);
            $this->db->bind(':tid', $sheet->template_id ?? null);
            $this->db->bind(':cid', $sheet->customer_id ?? null);
            $this->db->bind(':ref', ($sheet->reference_number ?? '') ? ($sheet->reference_number . ' (Copy)') : 'COPY');
            $this->db->bind(':term', $sheet->shipping_term ?? 'EXW');
            $this->db->bind(':ftype', $sheet->freight_type ?? 'Sea');
            $this->db->bind(':smode', $sheet->shipment_mode ?? 'LCL');
            $this->db->bind(':pmethod', $sheet->profit_method ?? 'Markup');
            $this->db->bind(':pbase', $sheet->profit_base ?? 'Landed');
            $this->db->bind(':pval', $sheet->profit_value ?? 0);
            $this->db->bind(':base', $sheet->base_carrier_cost ?? 0);
            $this->db->bind(':qty', $sheet->total_quantity ?? 0);
            $this->db->bind(':total', $sheet->total_cost ?? 0);
            $this->db->bind(':oam', $sheet->overhead_absorption_method ?? 'Value');
            $this->db->bind(':curr', $sheet->target_currency ?? 'USD');
            $this->db->bind(':rate', $sheet->exchange_rate ?? 1);
            $this->db->bind(':u', $userId);
            $this->db->execute();
            
            $newId = $this->db->lastInsertId();

            // Copy items (manual costs)
            if (!empty($sheet->items)) {
                foreach ($sheet->items as $item) {
                    $this->db->query("
                        INSERT INTO {$this->itemsTable} (sheet_id, name, cost_type, value, calculated_amount, absorption_method)
                        VALUES (:sid, :name, :type, :val, :calc, :abs)
                    ");
                    $this->db->bind(':sid', $newId);
                    $this->db->bind(':name', $item->name ?? 'Charge');
                    $this->db->bind(':type', $item->cost_type ?? 'Fixed');
                    $this->db->bind(':val', $item->value ?? 0);
                    $this->db->bind(':calc', $item->calculated_amount ?? 0);
                    $this->db->bind(':abs', $item->absorption_method ?? 'Value');
                    $this->db->execute();
                }
            }

            // Copy products
            if (!empty($sheet->product_items)) {
                foreach ($sheet->product_items as $p) {
                    $this->db->query("
                        INSERT INTO shipping_costing_sheet_products 
                        (sheet_id, part_id, quantity, unit_cost, profit_margin, profit_method, profit_base, weight, cbm, packaging_type_id, packing_type, hs_code, units_per_carton, carton_length_cm, carton_width_cm, carton_height_cm, volume_cbm, carton_tare_weight_kg, net_weight_kg, gross_weight_kg)
                        VALUES 
                        (:sid, :pid, :qty, :cost, :pmargin, :pmethod, :pbase, :wt, :cbm, :pkgid, :ptype, :hsc, :upc, :l, :w, :h, :vcbm, :tare, :net, :gross)
                    ");
                    $this->db->bind(':sid', $newId);
                    $this->db->bind(':pid', $p->part_id ?? null);
                    $this->db->bind(':qty', $p->quantity ?? 0);
                    $this->db->bind(':cost', $p->unit_cost ?? 0);
                    $this->db->bind(':pmargin', $p->profit_margin ?? 0);
                    $this->db->bind(':pmethod', $p->profit_method ?? null);
                    $this->db->bind(':pbase', $p->profit_base ?? null);
                    $this->db->bind(':wt', $p->weight ?? 0);
                    $this->db->bind(':cbm', $p->cbm ?? 0);
                    $this->db->bind(':pkgid', $p->packaging_type_id ?? null);
                    $this->db->bind(':ptype', $p->packing_type ?? 'Carton');
                    $this->db->bind(':hsc', $p->hs_code ?? null);
                    $this->db->bind(':upc', $p->units_per_carton ?? 1);
                    $this->db->bind(':l', $p->carton_length_cm ?? 0);
                    $this->db->bind(':w', $p->carton_width_cm ?? 0);
                    $this->db->bind(':h', $p->carton_height_cm ?? 0);
                    $this->db->bind(':vcbm', $p->volume_cbm ?? 0);
                    $this->db->bind(':tare', $p->carton_tare_weight_kg ?? 0);
                    $this->db->bind(':net', $p->net_weight_kg ?? 0);
                    $this->db->bind(':gross', $p->gross_weight_kg ?? 0);
                    $this->db->execute();
                }
            }

            $this->db->commit();
            return (int)$newId;
        } catch (Throwable $e) {
            if (isset($this->db)) $this->db->rollBack();
            error_log("ShippingCostingSheet::duplicate ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return false;
        }
    }
}
