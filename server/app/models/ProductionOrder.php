<?php
/**
 * ProductionOrder Model
 */
class ProductionOrder extends Model {
    private $table = 'production_orders';
    private $itemsTable = 'production_order_items';

    public function __construct() {
        parent::__construct();
        // // // // // // $this->ensureSchema();
    }

    private function ensureSchema() { return;
        try {
            // Production Order Table
            // Statuses: Planned, InProgress, Completed, Cancelled
            $this->db->query("CREATE TABLE IF NOT EXISTS {$this->table} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_number VARCHAR(50) UNIQUE NOT NULL,
                bom_id INT NULL, -- Primary BOM (optional for multi-product)
                location_id INT NOT NULL,
                qty DECIMAL(15,3) NOT NULL DEFAULT 0, -- Total planned qty (sum)
                actual_yield DECIMAL(15,3) NULL,
                waste_reason VARCHAR(255) NULL,
                status ENUM('Planned', 'InProgress', 'Completed', 'Cancelled') DEFAULT 'Planned',
                started_at DATETIME,
                completed_at DATETIME,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_by INT,
                updated_by INT,
                FOREIGN KEY (location_id) REFERENCES service_locations(id)
            ) ENGINE=InnoDB");
            $this->db->execute();

            // Order Outputs (For batches producing multiple products)
            $this->db->query("CREATE TABLE IF NOT EXISTS production_order_outputs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                bom_id INT NOT NULL,
                part_id INT NOT NULL,
                planned_qty DECIMAL(15,3) NOT NULL,
                actual_qty DECIMAL(15,3) NULL,
                batch_number VARCHAR(100) NULL,
                expiry_date DATE NULL,
                waste_reason VARCHAR(255) NULL,
                FOREIGN KEY (order_id) REFERENCES {$this->table}(id) ON DELETE CASCADE,
                FOREIGN KEY (bom_id) REFERENCES production_boms(id),
                FOREIGN KEY (part_id) REFERENCES parts(id)
            ) ENGINE=InnoDB");
            $this->db->execute();

            // Support older installs - Add columns if missing
            try {
                $check = $this->db->query("SHOW COLUMNS FROM {$this->table} LIKE 'actual_yield'");
                if (!$this->db->single()) {
                    $this->db->query("ALTER TABLE {$this->table} ADD COLUMN actual_yield DECIMAL(15,3) NULL AFTER qty");
                    $this->db->execute();
                    $this->db->query("ALTER TABLE {$this->table} ADD COLUMN waste_reason VARCHAR(255) NULL AFTER actual_yield");
                    $this->db->execute();
                }

                $check = $this->db->query("SHOW COLUMNS FROM production_order_outputs LIKE 'batch_number'");
                if (!$this->db->single()) {
                    $this->db->query("ALTER TABLE production_order_outputs ADD COLUMN batch_number VARCHAR(100) NULL AFTER actual_qty");
                    $this->db->execute();
                    $this->db->query("ALTER TABLE production_order_outputs ADD COLUMN expiry_date DATE NULL AFTER batch_number");
                    $this->db->execute();
                }
            } catch (Exception $e) {}

            // items table if we need to track specific materials consumed vs plan
            $this->db->query("CREATE TABLE IF NOT EXISTS {$this->itemsTable} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                part_id INT NOT NULL,
                planned_qty DECIMAL(15,3) NOT NULL,
                actual_qty DECIMAL(15,3),
                unit_cost DECIMAL(15,4),
                total_cost DECIMAL(15,4),
                FOREIGN KEY (order_id) REFERENCES {$this->table}(id) ON DELETE CASCADE,
                FOREIGN KEY (part_id) REFERENCES parts(id)
            ) ENGINE=InnoDB");
            $this->db->execute();
        } catch (Exception $e) { }
    }

    public function getAll($filters = []) {
        $sql = "SELECT o.*, b.name as bom_name, sl.name as location_name 
                FROM {$this->table} o
                JOIN production_boms b ON o.bom_id = b.id
                JOIN service_locations sl ON o.location_id = sl.id
                WHERE 1=1";
        
        if (isset($filters['status'])) {
            $sql .= " AND o.status = :status";
        }
        if (isset($filters['location_id'])) {
            $sql .= " AND o.location_id = :location_id";
        }
        $sql .= " ORDER BY o.created_at DESC";
        
        $this->db->query($sql);
        if (isset($filters['status'])) $this->db->bind(':status', $filters['status']);
        if (isset($filters['location_id'])) $this->db->bind(':location_id', (int)$filters['location_id']);
        
        return $this->db->resultSet();
    }

    public function getById($id) {
        $this->db->query("SELECT o.*, b.name as bom_name, sl.name as location_name
                         FROM {$this->table} o
                         LEFT JOIN production_boms b ON o.bom_id = b.id
                         JOIN service_locations sl ON o.location_id = sl.id
                         WHERE o.id = :id");
        $this->db->bind(':id', (int)$id);
        $order = $this->db->single();
        
        if ($order) {
            $order->items = $this->getItems($id);
            
            // Get Outputs
            $this->db->query("SELECT po.*, p.part_name, p.sku, p.unit, p.is_expiry, p.is_fifo
                             FROM production_order_outputs po
                             JOIN parts p ON po.part_id = p.id
                             WHERE po.order_id = :oid");
            $this->db->bind(':oid', (int)$id);
            $order->outputs = $this->db->resultSet();

            // Calculate standard cost for each output based on BOM
            foreach ($order->outputs as &$out) {
                $out->standard_unit_cost = 0;
                if ($out->bom_id) {
                    $this->db->query("SELECT SUM(bi.qty * p.cost_price) as total_bom_cost
                                     FROM production_bom_items bi
                                     JOIN parts p ON bi.part_id = p.id
                                     WHERE bi.bom_id = :bid");
                    $this->db->bind(':bid', (int)$out->bom_id);
                    $bomData = $this->db->single();
                    
                    // We also need to factor in the BOM's output quantity (usually 1, but could be different)
                    $this->db->query("SELECT output_qty FROM production_boms WHERE id = :bid");
                    $this->db->bind(':bid', (int)$out->bom_id);
                    $bomHeader = $this->db->single();
                    $outputFactor = (float)($bomHeader->output_qty ?? 1.000);
                    
                    if ($bomData && $bomData->total_bom_cost) {
                        $out->standard_unit_cost = $outputFactor > 0 ? (float)$bomData->total_bom_cost / $outputFactor : (float)$bomData->total_bom_cost;
                    }
                }
            }
        }
        return $order;
    }

    public function getItems($orderId) {
        $this->db->query("SELECT oi.*, p.part_name, p.sku, p.unit
                         FROM {$this->itemsTable} oi
                         JOIN parts p ON oi.part_id = p.id
                         WHERE oi.order_id = :order_id");
        $this->db->bind(':order_id', (int)$orderId);
        return $this->db->resultSet();
    }

    public function create($data, $userId = null) {
        try {
            $this->db->exec("START TRANSACTION");

            // Generate Order Number
            $orderNumber = $data['order_number'] ?? 'PO-' . date('YmdHis');
            
            // For multi-product batches, bom_id might be null or the first one
            $primaryBomId = $data['bom_id'] ?? (isset($data['outputs'][0]['bom_id']) ? $data['outputs'][0]['bom_id'] : null);
            $totalQty = $data['qty'] ?? 0;
            if (isset($data['outputs']) && is_array($data['outputs'])) {
                $totalQty = array_reduce($data['outputs'], fn($sum, $o) => $sum + ($o['qty'] ?? 0), 0);
            }

            $this->db->query("INSERT INTO {$this->table} (order_number, bom_id, location_id, qty, status, notes, created_by, updated_by)
                             VALUES (:order_number, :bom_id, :location_id, :qty, :status, :notes, :created_by, :updated_by)");
            $this->db->bind(':order_number', $orderNumber);
            $this->db->bind(':bom_id', $primaryBomId);
            $this->db->bind(':location_id', $data['location_id']);
            $this->db->bind(':qty', $totalQty);
            $this->db->bind(':status', $data['status'] ?? 'Planned');
            $this->db->bind(':notes', $data['notes'] ?? null);
            $this->db->bind(':created_by', $userId);
            $this->db->bind(':updated_by', $userId);
            $this->db->execute();
            
            $orderId = $this->db->lastInsertId();

            $aggregatedMaterials = []; // part_id => {planned_qty, unit_cost}
            $outputs = $data['outputs'] ?? [];
            
            // If no outputs but single bomber present (legacy), mock the output
            if (empty($outputs) && isset($data['bom_id'])) {
                $outputs = [[
                    'bom_id' => $data['bom_id'],
                    'qty' => $data['qty']
                ]];
            }

            $bomModel = new ProductionBOM();

            foreach ($outputs as $out) {
                // 1. Get Part ID from BOM
                $bom = $bomModel->getById($out['bom_id']);
                if (!$bom) continue;

                // 2. Insert Output Record
                $this->db->query("INSERT INTO production_order_outputs (order_id, bom_id, part_id, planned_qty)
                                 VALUES (:order_id, :bom_id, :part_id, :qty)");
                $this->db->bind(':order_id', $orderId);
                $this->db->bind(':bom_id', $out['bom_id']);
                $this->db->bind(':part_id', $bom->output_part_id);
                $this->db->bind(':qty', $out['qty']);
                $this->db->execute();

                // 3. Gather Materials
                $bomItems = $bomModel->getItems($out['bom_id']);
                foreach ($bomItems as $bi) {
                    $pid = (int)$bi->part_id;
                    $neededQty = (float)$bi->qty * (float)$out['qty'];
                    
                    if (isset($aggregatedMaterials[$pid])) {
                        $aggregatedMaterials[$pid]['qty'] += $neededQty;
                    } else {
                        $aggregatedMaterials[$pid] = [
                            'qty' => $neededQty,
                            'cost' => $bi->current_cost
                        ];
                    }
                }
            }

            // 4. Stock Availability Check
            $partModel = new Part();
            foreach ($aggregatedMaterials as $pid => $mat) {
                $stock = $partModel->getLocationStock($pid, $data['location_id']);
                $available = (float)($stock->available ?? 0);
                if ($available < (float)$mat['qty']) {
                    $part = $partModel->getById($pid);
                    $name = $part->part_name ?? "Part #$pid";
                    throw new Exception("Insufficient stock for material: {$name}. Needed: {$mat['qty']}, Available: {$available}");
                }
            }

            // 5. Insert Aggregated Materials
            foreach ($aggregatedMaterials as $pid => $mat) {
                $this->db->query("INSERT INTO {$this->itemsTable} (order_id, part_id, planned_qty, unit_cost)
                                 VALUES (:order_id, :part_id, :planned_qty, :unit_cost)");
                $this->db->bind(':order_id', $orderId);
                $this->db->bind(':part_id', $pid);
                $this->db->bind(':planned_qty', $mat['qty']);
                $this->db->bind(':unit_cost', $mat['cost']);
                $this->db->execute();
            }

            $this->db->exec("COMMIT");
            return $orderId;
        } catch (Exception $e) {
            $this->db->exec("ROLLBACK");
            throw $e;
        }
    }

    public function updateStatus($id, $status, $userId = null) {
        $data = ['status' => $status, 'updated_by' => $userId];
        if ($status === 'InProgress') {
            $sql = "UPDATE {$this->table} SET status = :status, started_at = NOW(), updated_by = :updated_by WHERE id = :id";
        } elseif ($status === 'Completed') {
            $sql = "UPDATE {$this->table} SET status = :status, completed_at = NOW(), updated_by = :updated_by WHERE id = :id";
        } else {
            $sql = "UPDATE {$this->table} SET status = :status, updated_by = :updated_by WHERE id = :id";
        }
        
        $this->db->query($sql);
        $this->db->bind(':id', (int)$id);
        $this->db->bind(':status', $status);
        $this->db->bind(':updated_by', $userId);
        return $this->db->execute();
    }

    public function updateActuals($orderId, $items) {
        foreach ($items as $item) {
            $this->db->query("UPDATE {$this->itemsTable} 
                             SET actual_qty = :qty, unit_cost = :cost, total_cost = (:qty * :cost)
                             WHERE order_id = :order_id AND part_id = :part_id");
            $this->db->bind(':order_id', (int)$orderId);
            $this->db->bind(':part_id', $item['part_id']);
            $this->db->bind(':qty', $item['actual_qty']);
            $this->db->bind(':cost', $item['unit_cost']);
            $this->db->execute();
        }
        return true;
    }
}
