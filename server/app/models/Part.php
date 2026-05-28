<?php
/**
 * Part (Item Master) Model
 */
class Part extends Model {
    private $table = 'parts';

    private function ensureSchema() { return;
        InventorySchema::ensure();
    }

    public function getLocationStock($partId, $locationId) {
        // // // // // // $this->ensureSchema();
        $pid = (int)$partId;
        $loc = (int)$locationId;
        if ($pid <= 0 || $loc <= 0) return null;

        // Real-time ledger balance per location
        $onHand = 0.0;
        try {
            $this->db->query("
                SELECT COALESCE(SUM(qty_change), 0) AS qty
                FROM stock_movements
                WHERE location_id = :loc AND part_id = :pid
            ");
            $this->db->bind(':loc', $loc);
            $this->db->bind(':pid', $pid);
            $row = $this->db->single();
            $onHand = (float)($row->qty ?? 0);
        } catch (Exception $e) {
            $onHand = 0.0;
        }

        // Reserved qty in pending (Requested) transfers from this location.
        $reserved = 0.0;
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
            $reserved = (float)($row->reserved ?? 0);
        } catch (Exception $e) {
            $reserved = 0.0;
        }

        $available = (float)$onHand - (float)$reserved;

        return (object)[
            'part_id' => $pid,
            'location_id' => $loc,
            'on_hand' => round((float)$onHand, 3),
            'reserved' => round((float)$reserved, 3),
            'available' => round((float)$available, 3),
        ];
    }

    public function list($q = '', $supplierId = null) {
        // // // // // // $this->ensureSchema();
        $q = is_string($q) ? trim($q) : '';
        $sid = $supplierId !== null ? (int)$supplierId : 0;

        $from = "{$this->table} p";
        if ($sid > 0) {
            $from .= " INNER JOIN part_suppliers ps ON ps.part_id = p.id AND ps.supplier_id = :sid";
        }

        $sql = "
            SELECT p.*, 
                   b.name AS brand_name,
                   s.name AS section_name,
                   d.name AS department_name,
                   c.name AS category_name,
                   (SELECT COALESCE(SUM(qty_change), 0) FROM stock_movements WHERE part_id = p.id) AS stock_quantity,
                   (SELECT GROUP_CONCAT(collection_id) FROM parts_collections WHERE part_id = p.id) as collection_ids_raw,
                   (SELECT GROUP_CONCAT(CONCAT(id, ':', filename) ORDER BY sort_order ASC, id ASC) FROM part_images WHERE part_id = p.id) as gallery_raw
            FROM {$from}
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN item_sections s ON s.id = p.item_section_id
            LEFT JOIN item_departments d ON d.id = p.item_department_id
            LEFT JOIN item_categories c ON c.id = p.item_category_id
        ";

        if ($q !== '') {
            $sql .= " WHERE (p.part_name LIKE :q OR p.sku LIKE :q OR p.part_number LIKE :q OR p.barcode_number LIKE :q) ";
        }
        $sql .= " ORDER BY p.part_name ASC ";

        $this->db->query($sql);
        if ($sid > 0) $this->db->bind(':sid', $sid);
        if ($q !== '') $this->db->bind(':q', '%' . $q . '%');
        
        $rows = $this->db->resultSet();
        foreach ($rows as $row) {
            $row->collection_ids = !empty($row->collection_ids_raw) ? array_map('intval', explode(',', $row->collection_ids_raw)) : [];
            $gallery = [];
            if (!empty($row->gallery_raw)) {
                $parts = explode(',', $row->gallery_raw);
                foreach ($parts as $p_str) {
                    $bits = explode(':', $p_str, 2);
                    if (count($bits) === 2) {
                        $gallery[] = (object)['id' => (int)$bits[0], 'filename' => $bits[1]];
                    }
                }
            }
            $row->gallery = $gallery;
        }
        return $rows;
    }

    public function listLocationBalances($locationId, $q = '') {
        // // // // // // $this->ensureSchema();
        $locId = (int)$locationId;
        if ($locId <= 0) $locId = 1;
        $q = is_string($q) ? trim($q) : '';

        $sqlBase = "
            SELECT p.id,
                   p.id AS part_id,
                   p.part_name,
                   p.sku,
                   p.unit,
                   p.brand_id,
                   b.name AS brand_name,
                   p.item_section_id,
                   s.name AS section_name,
                   p.item_department_id,
                   d.name AS department_name,
                   p.item_category_id,
                   c.name AS category_name,
                   p.cost_price,
                   p.price,
                   p.reorder_level,
                   p.is_active,
                   p.is_online,
                   p.public_description,
                   p.image_filename,
                   p.item_type,
                   p.slug,
                   p.is_fifo,
                   p.is_expiry,
                   p.recipe_type,
                   p.discount_type,
                   p.discount_value,
                   (SELECT COALESCE(SUM(qty_change), 0) FROM stock_movements WHERE part_id = p.id) AS system_stock_quantity,
                   (SELECT GROUP_CONCAT(collection_id) FROM parts_collections WHERE part_id = p.id) as collection_ids_raw,
                   (SELECT GROUP_CONCAT(CONCAT(id, ':', filename) ORDER BY sort_order ASC, id ASC) FROM part_images WHERE part_id = p.id) as gallery_raw,
                   COALESCE(SUM(sm.qty_change), 0) AS location_stock_quantity,
                   COALESCE(SUM(sm.qty_change), 0) AS stock_quantity
            FROM {$this->table} p
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN item_sections s ON s.id = p.item_section_id
            LEFT JOIN item_departments d ON d.id = p.item_department_id
            LEFT JOIN item_categories c ON c.id = p.item_category_id
            LEFT JOIN stock_movements sm ON sm.part_id = p.id AND sm.location_id = :loc
        ";

        if ($q !== '') {
            $this->db->query($sqlBase . "
                WHERE (p.part_name LIKE :q OR p.sku LIKE :q OR p.part_number LIKE :q OR p.barcode_number LIKE :q)
                GROUP BY p.id
                ORDER BY p.part_name ASC
            ");
            $this->db->bind(':loc', $locId);
            $this->db->bind(':q', '%' . $q . '%');
        } else {
            $this->db->query($sqlBase . "
                GROUP BY p.id
                ORDER BY p.part_name ASC
            ");
            $this->db->bind(':loc', $locId);
        }

        $rows = $this->db->resultSet();
        foreach ($rows as $row) {
            $row->collection_ids = !empty($row->collection_ids_raw) ? array_map('intval', explode(',', $row->collection_ids_raw)) : [];
            $gallery = [];
            if (!empty($row->gallery_raw)) {
                $parts = explode(',', $row->gallery_raw);
                foreach ($parts as $p_str) {
                    $bits = explode(':', $p_str, 2);
                    if (count($bits) === 2) {
                        $gallery[] = (object)['id' => (int)$bits[0], 'filename' => $bits[1]];
                    }
                }
            }
            $row->gallery = $gallery;
        }
        return $rows;
    }

    public function getById($id) {
        // // // // // // $this->ensureSchema();
        $this->db->query("
            SELECT p.*, b.name AS brand_name,
                   s.name AS section_name,
                   d.name AS department_name,
                   c.name AS category_name,
                   (SELECT COALESCE(SUM(qty_change), 0) FROM stock_movements WHERE part_id = p.id) AS stock_quantity
            FROM {$this->table} p
            LEFT JOIN brands b ON b.id = p.brand_id
            LEFT JOIN item_sections s ON s.id = p.item_section_id
            LEFT JOIN item_departments d ON d.id = p.item_department_id
            LEFT JOIN item_categories c ON c.id = p.item_category_id
            WHERE p.id = :id
            LIMIT 1
        ");
        $this->db->bind(':id', (int)$id);
        $row = $this->db->single();
        if (!$row) return null;

        // Supplier mapping
        $this->db->query("
            SELECT s.id, s.name
            FROM part_suppliers ps
            INNER JOIN suppliers s ON s.id = ps.supplier_id
            WHERE ps.part_id = :id
            ORDER BY s.name ASC
        ");
        $this->db->bind(':id', (int)$id);
        $suppliers = $this->db->resultSet();
        $supplierIds = [];
        if (is_array($suppliers)) {
            foreach ($suppliers as $s) {
                $supplierIds[] = (int)($s->id ?? 0);
            }
        }
        $row->supplier_ids = $supplierIds;
        $row->suppliers = $suppliers;

        // Collection mapping
        $collectionModel = new Collection();
        $collections = $collectionModel->getPartCollections($id);
        $row->collection_ids = array_map(function($c) { return (int)$c->id; }, $collections ?: []);
        $row->collections = $collections;

        // Gallery mapping
        require_once __DIR__ . '/PartImage.php';
        $imageModel = new PartImage();
        $row->gallery = $imageModel->getByPart($id);

        // Attributes mapping
        require_once __DIR__ . '/PartAttribute.php';
        $attrModel = new PartAttribute();
        $row->attributes_grouped = $attrModel->getPartAttributesGrouped($id);

        return $row;
    }

    public function setSuppliers($partId, $supplierIds, $userId = null) {
        // // // // // // $this->ensureSchema();
        $pid = (int)$partId;
        if ($pid <= 0) return false;
        $ids = is_array($supplierIds) ? $supplierIds : [];
        $norm = [];
        foreach ($ids as $v) {
            $sid = (int)$v;
            if ($sid > 0) $norm[$sid] = true;
        }
        $uniqueIds = array_keys($norm);

        try {
            $this->db->exec("START TRANSACTION");
            $this->db->query("DELETE FROM part_suppliers WHERE part_id = :pid");
            $this->db->bind(':pid', $pid);
            $this->db->execute();

            foreach ($uniqueIds as $sid) {
                $this->db->query("
                    INSERT IGNORE INTO part_suppliers (part_id, supplier_id, created_by)
                    VALUES (:pid, :sid, :u)
                ");
                $this->db->bind(':pid', $pid);
                $this->db->bind(':sid', (int)$sid);
                $this->db->bind(':u', $userId);
                $this->db->execute();
            }

            $this->db->exec("COMMIT");
            return true;
        } catch (Exception $e) {
            try { $this->db->exec("ROLLBACK"); } catch (Exception $e2) {}
            return false;
        }
    }

    public function create($data, $userId = null) {
        // // // // // // $this->ensureSchema();
        
        $finalSlug = $data['slug'] ?? null;
        if (!$finalSlug) {
            $finalSlug = $this->generateSlug($data['part_name']);
        }

        $this->db->query("
            INSERT INTO {$this->table}
            (sku, part_number, barcode_number, part_name, slug, unit, brand_id, item_section_id, item_department_id, item_category_id, stock_quantity, cost_price, price, discount_type, discount_value, wholesale_price, min_selling_price, price_2, reorder_level, is_active, is_fifo, is_expiry, image_filename, item_type, recipe_type, default_location_id, allowed_locations, created_by, updated_by, net_weight_kg, gross_weight_kg, units_per_carton, packing_type, hs_code, carton_length_cm, carton_width_cm, carton_height_cm, volume_cbm, carton_tare_weight_kg, is_online, out_of_stock, public_description)
            VALUES
            (:sku, :part_number, :barcode_number, :part_name, :slug, :unit, :brand_id, :item_section_id, :item_department_id, :item_category_id, :stock_quantity, :cost_price, :price, :discount_type, :discount_value, :wholesale_price, :min_selling_price, :price_2, :reorder_level, :is_active, :is_fifo, :is_expiry, :image_filename, :item_type, :recipe_type, :default_location_id, :allowed_locations, :created_by, :updated_by, :net_weight_kg, :gross_weight_kg, :units_per_carton, :packing_type, :hs_code, :carton_length_cm, :carton_width_cm, :carton_height_cm, :volume_cbm, :carton_tare_weight_kg, :is_online, :out_of_stock, :public_description)
        ");
        $this->db->bind(':sku', $data['sku'] ?? null);
        $this->db->bind(':part_number', $data['part_number'] ?? null);
        $this->db->bind(':barcode_number', $data['barcode_number'] ?? null);
        $this->db->bind(':part_name', $data['part_name']);
        $this->db->bind(':slug', $finalSlug);
        $this->db->bind(':unit', $data['unit'] ?? null);
        $this->db->bind(':brand_id', isset($data['brand_id']) && (int)$data['brand_id'] > 0 ? (int)$data['brand_id'] : null);
        $this->db->bind(':item_section_id', isset($data['item_section_id']) && (int)$data['item_section_id'] > 0 ? (int)$data['item_section_id'] : null);
        $this->db->bind(':item_department_id', isset($data['item_department_id']) && (int)$data['item_department_id'] > 0 ? (int)$data['item_department_id'] : null);
        $this->db->bind(':item_category_id', isset($data['item_category_id']) && (int)$data['item_category_id'] > 0 ? (int)$data['item_category_id'] : null);
        $this->db->bind(':stock_quantity', isset($data['stock_quantity']) ? round((float)$data['stock_quantity'], 3) : 0.000);
        $this->db->bind(':cost_price', $data['cost_price'] ?? null);
        $this->db->bind(':price', $data['price']);
        $this->db->bind(':discount_type', $data['discount_type'] ?? 'None');
        $this->db->bind(':discount_value', $data['discount_value'] ?? 0);
        $this->db->bind(':wholesale_price', $data['wholesale_price'] ?? null);
        $this->db->bind(':min_selling_price', $data['min_selling_price'] ?? null);
        $this->db->bind(':price_2', $data['price_2'] ?? null);
        $this->db->bind(':reorder_level', $data['reorder_level'] ?? null);
        $this->db->bind(':is_active', isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1);
        $this->db->bind(':is_fifo', isset($data['is_fifo']) ? (int)(bool)$data['is_fifo'] : 0);
        $this->db->bind(':is_expiry', isset($data['is_expiry']) ? (int)(bool)$data['is_expiry'] : 0);
        $this->db->bind(':image_filename', $data['image_filename'] ?? null);
        $this->db->bind(':item_type', $data['item_type'] ?? 'Part');
        $this->db->bind(':recipe_type', $data['recipe_type'] ?? 'Standard');
        $this->db->bind(':default_location_id', isset($data['default_location_id']) ? (int)$data['default_location_id'] : null);
        $this->db->bind(':allowed_locations', $data['allowed_locations'] ?? null);
        $this->db->bind(':created_by', $userId);
        $this->db->bind(':updated_by', $userId);
        $this->db->bind(':net_weight_kg', isset($data['net_weight_kg']) ? (float)$data['net_weight_kg'] : 0);
        $this->db->bind(':gross_weight_kg', isset($data['gross_weight_kg']) ? (float)$data['gross_weight_kg'] : 0);
        $this->db->bind(':units_per_carton', isset($data['units_per_carton']) ? (int)$data['units_per_carton'] : 1);
        $this->db->bind(':packing_type', $data['packing_type'] ?? null);
        $this->db->bind(':hs_code', $data['hs_code'] ?? null);
        $this->db->bind(':carton_length_cm', isset($data['carton_length_cm']) ? (float)$data['carton_length_cm'] : 0);
        $this->db->bind(':carton_width_cm', isset($data['carton_width_cm']) ? (float)$data['carton_width_cm'] : 0);
        $this->db->bind(':carton_height_cm', isset($data['carton_height_cm']) ? (float)$data['carton_height_cm'] : 0);
        $this->db->bind(':volume_cbm', isset($data['volume_cbm']) ? (float)$data['volume_cbm'] : 0);
        $this->db->bind(':carton_tare_weight_kg', isset($data['carton_tare_weight_kg']) ? (float)$data['carton_tare_weight_kg'] : 0);
        $this->db->bind(':is_online', isset($data['is_online']) ? (int)(bool)$data['is_online'] : 1);
        $this->db->bind(':out_of_stock', isset($data['out_of_stock']) ? (int)(bool)$data['out_of_stock'] : 0);
        $this->db->bind(':public_description', $data['public_description'] ?? null);
        $ok = $this->db->execute();
        if (!$ok) return false;
        $partId = (int)$this->db->lastInsertId();

        // Sync Collections if present
        if (isset($data['collection_ids']) && is_array($data['collection_ids'])) {
            $collectionModel = new Collection();
            $collectionModel->syncProductCollections($partId, $data['collection_ids']);
        }

        // Sync Attributes if present
        if (isset($data['attribute_values']) && is_array($data['attribute_values'])) {
            require_once __DIR__ . '/PartAttribute.php';
            $attrModel = new PartAttribute();
            $attrModel->syncPartAttributes($partId, $data['attribute_values']);
        }

        return $partId;
    }

    public function update($id, $data, $userId = null) {
        // // // // // // $this->ensureSchema();
        
        $finalSlug = $data['slug'] ?? null;
        if (!$finalSlug) {
            $finalSlug = $this->generateSlug($data['part_name'], $id);
        }

        $this->db->query("
            UPDATE {$this->table}
            SET sku = :sku,
                part_number = :part_number,
                barcode_number = :barcode_number,
                part_name = :part_name,
                slug = :slug,
                unit = :unit,
                brand_id = :brand_id,
                item_section_id = :item_section_id,
                item_department_id = :item_department_id,
                item_category_id = :item_category_id,
                cost_price = :cost_price,
                price = :price,
                discount_type = :discount_type,
                discount_value = :discount_value,
                wholesale_price = :wholesale_price,
                min_selling_price = :min_selling_price,
                price_2 = :price_2,
                reorder_level = :reorder_level,
                is_active = :is_active,
                is_fifo = :is_fifo,
                is_expiry = :is_expiry,
                image_filename = :image_filename,
                item_type = :item_type,
                recipe_type = :recipe_type,
                default_location_id = :default_location_id,
                allowed_locations = :allowed_locations,
                net_weight_kg = :net_weight_kg,
                gross_weight_kg = :gross_weight_kg,
                units_per_carton = :units_per_carton,
                packing_type = :packing_type,
                hs_code = :hs_code,
                carton_length_cm = :carton_length_cm,
                carton_width_cm = :carton_width_cm,
                carton_height_cm = :carton_height_cm,
                volume_cbm = :volume_cbm,
                carton_tare_weight_kg = :carton_tare_weight_kg,
                is_online = :is_online,
                out_of_stock = :out_of_stock,
                public_description = :public_description,
                updated_by = :updated_by
            WHERE id = :id
        ");
        $this->db->bind(':sku', $data['sku'] ?? null);
        $this->db->bind(':part_number', $data['part_number'] ?? null);
        $this->db->bind(':barcode_number', $data['barcode_number'] ?? null);
        $this->db->bind(':part_name', $data['part_name']);
        $this->db->bind(':slug', $finalSlug);
        $this->db->bind(':unit', $data['unit'] ?? null);
        $this->db->bind(':brand_id', isset($data['brand_id']) && (int)$data['brand_id'] > 0 ? (int)$data['brand_id'] : null);
        $this->db->bind(':item_section_id', isset($data['item_section_id']) && (int)$data['item_section_id'] > 0 ? (int)$data['item_section_id'] : null);
        $this->db->bind(':item_department_id', isset($data['item_department_id']) && (int)$data['item_department_id'] > 0 ? (int)$data['item_department_id'] : null);
        $this->db->bind(':item_category_id', isset($data['item_category_id']) && (int)$data['item_category_id'] > 0 ? (int)$data['item_category_id'] : null);
        $this->db->bind(':cost_price', $data['cost_price'] ?? null);
        $this->db->bind(':price', $data['price']);
        $this->db->bind(':discount_type', $data['discount_type'] ?? 'None');
        $this->db->bind(':discount_value', $data['discount_value'] ?? 0);
        $this->db->bind(':wholesale_price', $data['wholesale_price'] ?? null);
        $this->db->bind(':min_selling_price', $data['min_selling_price'] ?? null);
        $this->db->bind(':price_2', $data['price_2'] ?? null);
        $this->db->bind(':reorder_level', $data['reorder_level'] ?? null);
        $this->db->bind(':is_active', isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1);
        $this->db->bind(':is_fifo', isset($data['is_fifo']) ? (int)(bool)$data['is_fifo'] : 0);
        $this->db->bind(':is_expiry', isset($data['is_expiry']) ? (int)(bool)$data['is_expiry'] : 0);
        $this->db->bind(':image_filename', $data['image_filename'] ?? null);
        $this->db->bind(':item_type', $data['item_type'] ?? 'Part');
        $this->db->bind(':recipe_type', $data['recipe_type'] ?? 'Standard');
        $this->db->bind(':default_location_id', isset($data['default_location_id']) ? (int)$data['default_location_id'] : null);
        $this->db->bind(':allowed_locations', $data['allowed_locations'] ?? null);
        $this->db->bind(':net_weight_kg', isset($data['net_weight_kg']) ? (float)$data['net_weight_kg'] : 0);
        $this->db->bind(':gross_weight_kg', isset($data['gross_weight_kg']) ? (float)$data['gross_weight_kg'] : 0);
        $this->db->bind(':units_per_carton', isset($data['units_per_carton']) ? (int)$data['units_per_carton'] : 1);
        $this->db->bind(':packing_type', $data['packing_type'] ?? null);
        $this->db->bind(':hs_code', $data['hs_code'] ?? null);
        $this->db->bind(':carton_length_cm', isset($data['carton_length_cm']) ? (float)$data['carton_length_cm'] : 0);
        $this->db->bind(':carton_width_cm', isset($data['carton_width_cm']) ? (float)$data['carton_width_cm'] : 0);
        $this->db->bind(':carton_height_cm', isset($data['carton_height_cm']) ? (float)$data['carton_height_cm'] : 0);
        $this->db->bind(':volume_cbm', isset($data['volume_cbm']) ? (float)$data['volume_cbm'] : 0);
        $this->db->bind(':carton_tare_weight_kg', isset($data['carton_tare_weight_kg']) ? (float)$data['carton_tare_weight_kg'] : 0);
        $this->db->bind(':is_online', isset($data['is_online']) ? (int)(bool)$data['is_online'] : 1);
        $this->db->bind(':out_of_stock', isset($data['out_of_stock']) ? (int)(bool)$data['out_of_stock'] : 0);
        $this->db->bind(':public_description', $data['public_description'] ?? null);
        $this->db->bind(':updated_by', $userId);
        $this->db->bind(':id', (int)$id);
        $ok = $this->db->execute();

        if ($ok && isset($data['collection_ids']) && is_array($data['collection_ids'])) {
            $collectionModel = new Collection();
            $collectionModel->syncProductCollections($id, $data['collection_ids']);
        }

        if ($ok && isset($data['attribute_values']) && is_array($data['attribute_values'])) {
            require_once __DIR__ . '/PartAttribute.php';
            $attrModel = new PartAttribute();
            $attrModel->syncPartAttributes($id, $data['attribute_values']);
        }

        if ($ok && isset($data['gallery']) && is_array($data['gallery'])) {
            require_once __DIR__ . '/PartImage.php';
            $imageModel = new PartImage();
            $imageModel->syncGallery($id, $data['gallery']);
        }

        return $ok;
    }

    public function setImage($id, $filename, $userId = null) {
        // // // // // // $this->ensureSchema();
        $this->db->query("UPDATE {$this->table} SET image_filename = :fn, updated_by = :u WHERE id = :id");
        $this->db->bind(':fn', $filename);
        $this->db->bind(':u', $userId);
        $this->db->bind(':id', (int)$id);
        return $this->db->execute();
    }

    public function delete($id) {
        // // // // // // $this->ensureSchema();
        $this->db->query("DELETE FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', (int)$id);
        return $this->db->execute();
    }

    public function adjustStock($partId, $qtyChange, $notes = null, $userId = null, $locationId = 1, $movementType = 'ADJUSTMENT', $batchId = null) {
        // // // // // // $this->ensureSchema();
        $pid = (int)$partId;
        $delta = (float)$qtyChange;
        $loc = (int)$locationId;
        if ($pid <= 0 || $delta === 0.0) return false;

        try {
            $this->db->exec("START TRANSACTION");

            // lock row
            $this->db->query("SELECT stock_quantity, is_fifo FROM {$this->table} WHERE id = :id FOR UPDATE");
            $this->db->bind(':id', $pid);
            $row = $this->db->single();
            if (!$row) {
                $this->db->exec("ROLLBACK");
                return false;
            }

            // If it's a deduction and the item is marked as FIFO, and no specific batch is provided, 
            // we should ideally use deductStockFIFO. But for backward compatibility and explicit adjustments, 
            // we allow adjustStock to work directly.
            
            $current = (float)($row->stock_quantity ?? 0);
            $next = $current + $delta;
            
            $this->db->query("UPDATE {$this->table} SET stock_quantity = :q, updated_by = :u WHERE id = :id");
            $this->db->bind(':q', $next);
            $this->db->bind(':u', $userId);
            $this->db->bind(':id', $pid);
            $this->db->execute();

            // movement
            $this->db->query("
                INSERT INTO stock_movements (location_id, part_id, batch_id, qty_change, movement_type, ref_table, ref_id, notes, created_by)
                VALUES (:loc, :part_id, :batch_id, :qty_change, :type, :ref_table, :ref_id, :notes, :created_by)
            ");
            $this->db->bind(':loc', $loc);
            $this->db->bind(':part_id', $pid);
            $this->db->bind(':batch_id', $batchId);
            $this->db->bind(':qty_change', $delta);
            $this->db->bind(':type', $movementType);
            $this->db->bind(':ref_table', 'parts');
            $this->db->bind(':ref_id', $pid);
            $this->db->bind(':notes', $notes);
            $this->db->bind(':created_by', $userId);
            $this->db->execute();

            $this->db->exec("COMMIT");
            return true;
        } catch (Exception $e) {
            try { $this->db->exec("ROLLBACK"); } catch (Exception $e2) {}
            return false;
        }
    }

    /**
     * Deduct Stock using FIFO logic across batches
     */
    public function deductStockFIFO($partId, $qtyToDeduct, $notes = null, $userId = null, $locationId = 1, $movementType = 'SALE', $refTable = null, $refId = null) {
        // // // // // // $this->ensureSchema();
        $pid = (int)$partId;
        $totalNeeded = abs((float)$qtyToDeduct);
        $loc = (int)$locationId;
        if ($pid <= 0 || $totalNeeded <= 0) return false;

        try {
            $this->db->exec("START TRANSACTION");

            // 1. Get batches ordered by FIFO (oldest first)
            $this->db->query("
                SELECT * FROM inventory_batches 
                WHERE part_id = :pid AND location_id = :loc AND is_exhausted = 0 
                ORDER BY created_at ASC, id ASC 
                FOR UPDATE
            ");
            $this->db->bind(':pid', $pid);
            $this->db->bind(':loc', $loc);
            $batches = $this->db->resultSet();

            $remaining = $totalNeeded;
            foreach ($batches as $batch) {
                if ($remaining <= 0) break;

                $batchQty = (float)$batch->quantity_on_hand;
                $take = min($remaining, $batchQty);
                $newBatchQty = $batchQty - $take;
                $isExhausted = ($newBatchQty <= 0.001) ? 1 : 0;

                // Update Batch
                $this->db->query("UPDATE inventory_batches SET quantity_on_hand = :q, is_exhausted = :ex WHERE id = :id");
                $this->db->bind(':q', $newBatchQty);
                $this->db->bind(':ex', $isExhausted);
                $this->db->bind(':id', $batch->id);
                $this->db->execute();

                // Create Movement for this batch
                $this->db->query("
                    INSERT INTO stock_movements (location_id, part_id, batch_id, qty_change, movement_type, ref_table, ref_id, notes, created_by)
                    VALUES (:loc, :part_id, :batch_id, :qty_change, :type, :ref_table, :ref_id, :notes, :created_by)
                ");
                $this->db->bind(':loc', $loc);
                $this->db->bind(':part_id', $pid);
                $this->db->bind(':batch_id', $batch->id);
                $this->db->bind(':qty_change', -$take);
                $this->db->bind(':type', $movementType);
                $this->db->bind(':ref_table', $refTable ?: 'parts');
                $this->db->bind(':ref_id', $refId ?: $pid);
                $this->db->bind(':notes', $notes . " (Batch: {$batch->batch_number})");
                $this->db->bind(':created_by', $userId);
                $this->db->execute();

                $remaining -= $take;
            }

            // If we still have remaining, it means we oversold/over-consumed based on batches
            // We still deduct from the main parts table to keep total stock consistent
            if ($remaining > 0) {
                // You might want to throw an error here if strict FIFO is required
                // For now, we'll create an unbatched movement for the negative balance
                 $this->db->query("
                    INSERT INTO stock_movements (location_id, part_id, batch_id, qty_change, movement_type, ref_table, ref_id, notes, created_by)
                    VALUES (:loc, :part_id, NULL, :qty_change, :type, :ref_table, :ref_id, :notes, :created_by)
                ");
                $this->db->bind(':loc', $loc);
                $this->db->bind(':part_id', $pid);
                $this->db->bind(':qty_change', -$remaining);
                $this->db->bind(':type', $movementType);
                $this->db->bind(':ref_table', $refTable ?: 'parts');
                $this->db->bind(':ref_id', $refId ?: $pid);
                $this->db->bind(':notes', $notes . " (Unbatched Overflow)");
                $this->db->bind(':created_by', $userId);
                $this->db->execute();
            }

            // 2. Update Master Stock
            $this->db->query("UPDATE parts SET stock_quantity = stock_quantity - :q WHERE id = :id");
            $this->db->bind(':q', $totalNeeded);
            $this->db->bind(':id', $pid);
            $this->db->execute();

            $this->db->exec("COMMIT");
            return true;
        } catch (Exception $e) {
            try { $this->db->exec("ROLLBACK"); } catch (Exception $e2) {}
            error_log("FIFO Deduction Error: " . $e->getMessage());
            return false;
        }
    }

    public function listMovements($partId, $limit = 200, $locationId = 0, $from = null, $to = null, $offset = 0) {
        // // // // // // $this->ensureSchema();
        $pid = (int)$partId;
        $lim = (int)$limit;
        if ($lim <= 0) $lim = 200;
        if ($lim > 1000) $lim = 1000;
        $off = (int)$offset;
        if ($off < 0) $off = 0;
        $locId = (int)$locationId;
        if ($locId < 0) $locId = 0;
        $fromDt = is_string($from) && trim($from) !== '' ? trim($from) : null;
        $toDt = is_string($to) && trim($to) !== '' ? trim($to) : null;

        $where = "WHERE sm.part_id = :pid AND (:loc = 0 OR sm.location_id = :loc)";
        if ($fromDt) $where .= " AND sm.created_at >= :from_dt";
        if ($toDt) $where .= " AND sm.created_at <= :to_dt";

        $this->db->query("SELECT COUNT(*) as total FROM stock_movements sm " . $where);
        $this->db->bind(':pid', $pid);
        $this->db->bind(':loc', $locId);
        if ($fromDt) $this->db->bind(':from_dt', $fromDt);
        if ($toDt) $this->db->bind(':to_dt', $toDt);
        $totalRow = $this->db->single();
        $totalCount = $totalRow ? (int)$totalRow->total : 0;

        $this->db->query("
            SELECT sm.*,
                   p.part_name, p.sku,
                   sl.name AS location_name,
                   grn.grn_number,
                   grn.received_at AS grn_received_at,
                   s1.name AS grn_supplier_name,
                   po.po_number AS grn_po_number,
                   sa.adjustment_number,
                   sa.adjusted_at AS adjustment_at,
                   sa.reason AS adjustment_reason,
                   ro.vehicle_identifier,
                   ro.vehicle_model,
                   ro.priority AS order_priority,
                   ro.status AS order_status,
                   ro.expected_time AS order_expected_time,
                   tr.transfer_number,
                   tr.from_location_id AS transfer_from_location_id,
                   tr.to_location_id AS transfer_to_location_id,
                   lf.name AS transfer_from_location_name,
                   lt.name AS transfer_to_location_name,
                   inv.invoice_no,
                   CASE
                     WHEN sm.ref_table = 'goods_receive_notes' THEN grn.grn_number
                     WHEN sm.ref_table = 'stock_adjustments' THEN sa.adjustment_number
                     WHEN sm.ref_table = 'repair_orders' THEN COALESCE(ro.vehicle_identifier, CONCAT('Order #', sm.ref_id))
                     WHEN sm.ref_table = 'stock_transfer_requests' THEN tr.transfer_number
                     WHEN sm.ref_table = 'invoices' THEN inv.invoice_no
                     ELSE CONCAT(COALESCE(sm.ref_table,''), '#', COALESCE(sm.ref_id,''))
                   END AS ref_label,
                   CASE
                     WHEN sm.ref_table = 'goods_receive_notes' THEN CONCAT('/inventory/grn/print/', sm.ref_id)
                     WHEN sm.ref_table = 'stock_adjustments' THEN CONCAT('/inventory/stock/adjustments/print/', sm.ref_id)
                     WHEN sm.ref_table = 'repair_orders' THEN CONCAT('/orders/', sm.ref_id)
                     WHEN sm.ref_table = 'stock_transfer_requests' THEN CONCAT('/inventory/transfers/', sm.ref_id)
                     WHEN sm.ref_table = 'invoices' THEN CONCAT('/cms/invoices/view/', sm.ref_id)
                     ELSE NULL
                   END AS ref_url,
                   CASE
                     WHEN sm.ref_table = 'goods_receive_notes' THEN 'GRN'
                     WHEN sm.ref_table = 'stock_adjustments' THEN 'Stock Adjustment'
                     WHEN sm.ref_table = 'repair_orders' THEN 'Repair Order'
                     WHEN sm.ref_table = 'stock_transfer_requests' THEN 'Stock Transfer'
                     WHEN sm.ref_table = 'invoices' THEN 'Sale'
                     ELSE NULL
                   END AS ref_type,
                   u.name AS created_by_name
            FROM stock_movements sm
            INNER JOIN parts p ON p.id = sm.part_id
            LEFT JOIN users u ON u.id = sm.created_by
            LEFT JOIN service_locations sl ON sl.id = sm.location_id
            LEFT JOIN goods_receive_notes grn ON sm.ref_table = 'goods_receive_notes' AND grn.id = sm.ref_id
            LEFT JOIN suppliers s1 ON s1.id = grn.supplier_id
            LEFT JOIN purchase_orders po ON po.id = grn.purchase_order_id
            LEFT JOIN stock_adjustments sa ON sm.ref_table = 'stock_adjustments' AND sa.id = sm.ref_id
            LEFT JOIN repair_orders ro ON sm.ref_table = 'repair_orders' AND ro.id = sm.ref_id
            LEFT JOIN stock_transfer_requests tr ON sm.ref_table = 'stock_transfer_requests' AND tr.id = sm.ref_id
            LEFT JOIN service_locations lf ON lf.id = tr.from_location_id
            LEFT JOIN service_locations lt ON lt.id = tr.to_location_id
            LEFT JOIN invoices inv ON sm.ref_table = 'invoices' AND inv.id = sm.ref_id
            {$where}
            ORDER BY sm.id DESC
            LIMIT {$lim} OFFSET {$off}
        ");
        $this->db->bind(':pid', $pid);
        $this->db->bind(':loc', $locId);
        if ($fromDt) $this->db->bind(':from_dt', $fromDt);
        if ($toDt) $this->db->bind(':to_dt', $toDt);
        $rows = $this->db->resultSet();
        return ['data' => $rows, 'total' => $totalCount];
    }

    public function bulkUpdateDiscount($ids, $type, $value) {
        // // // // // // $this->ensureSchema();
        if (empty($ids)) return false;
        
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $this->db->query("
            UPDATE {$this->table} 
            SET discount_type = ?, 
                discount_value = ? 
            WHERE id IN ({$placeholders})
        ");
        
        $this->db->bind(1, $type);
        $this->db->bind(2, $value);
        foreach ($ids as $i => $id) {
            $this->db->bind($i + 3, (int)$id);
        }
        
        return $this->db->execute();
    }

    public function generateSlug($name, $id = null) {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-'));
        if (empty($slug)) $slug = 'product-' . ($id ?: uniqid());
        
        // Check if slug exists
        $this->db->query("SELECT id FROM parts WHERE slug = :slug AND id != :id LIMIT 1");
        $this->db->bind(':slug', $slug);
        $this->db->bind(':id', $id ? (int)$id : 0);
        $exists = $this->db->single();
        if ($exists) {
            $slug .= '-' . substr(md5(uniqid()), 0, 5);
        }
        return $slug;
    }

    public function getBySlug($slug) {
        // // // // // // $this->ensureSchema();
        $this->db->query("SELECT id FROM parts WHERE slug = :slug LIMIT 1");
        $this->db->bind(':slug', $slug);
        $row = $this->db->single();
        if ($row) return $this->getById($row->id);
        return null;
    }

    public function syncSlugs() {
        // // // // // // $this->ensureSchema();
        $this->db->query("SELECT id, part_name FROM parts WHERE slug IS NULL OR slug = ''");
        $items = $this->db->resultSet();
        $count = 0;
        foreach ($items as $item) {
            $slug = $this->generateSlug($item->part_name, $item->id);
            $this->db->query("UPDATE parts SET slug = :slug WHERE id = :id");
            $this->db->bind(':slug', $slug);
            $this->db->bind(':id', $item->id);
            $this->db->execute();
            $count++;
        }
        return $count;
    }
}
