<?php
/**
 * ProductionBOM Model
 */
class ProductionBOM extends Model {
    private $table = 'production_boms';
    private $itemsTable = 'production_bom_items';
    private static $schemaDone = false;

    public function __construct() {
        parent::__construct();
        // $this->ensureSchema();
    }

    private function ensureSchema() { return;
        if (self::$schemaDone) return;
        self::$schemaDone = true;

        // Use an isolated connection so DDL never touches the shared transaction connection
        try {
            $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
            $pdo = new PDO($dsn, DB_USER, DB_PASS);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $pdo->exec("CREATE TABLE IF NOT EXISTS {$this->table} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                output_part_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                version VARCHAR(50) DEFAULT '1.0',
                output_qty DECIMAL(15,3) NOT NULL DEFAULT 1.000,
                is_active TINYINT NOT NULL DEFAULT 1,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_by INT,
                updated_by INT,
                FOREIGN KEY (output_part_id) REFERENCES parts(id)
            ) ENGINE=InnoDB");

            $pdo->exec("CREATE TABLE IF NOT EXISTS {$this->itemsTable} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                bom_id INT NOT NULL,
                part_id INT NOT NULL,
                qty DECIMAL(15,3) NOT NULL,
                notes TEXT,
                FOREIGN KEY (bom_id) REFERENCES {$this->table}(id) ON DELETE CASCADE,
                FOREIGN KEY (part_id) REFERENCES parts(id)
            ) ENGINE=InnoDB");
        } catch (Exception $e) {
            // Table might already exist
        }
    }

    public function getAll($filters = []) {
        $sql = "SELECT b.*, p.part_name as output_part_name, p.sku as output_sku 
                FROM {$this->table} b
                JOIN parts p ON b.output_part_id = p.id
                WHERE 1=1";
        if (isset($filters['active'])) {
            $sql .= " AND b.is_active = :active";
        }
        $sql .= " ORDER BY b.name ASC";
        
        $this->db->query($sql);
        if (isset($filters['active'])) $this->db->bind(':active', (int)$filters['active']);
        
        $rows = $this->db->resultSet();
        foreach ($rows as $row) {
            $row->items = $this->getItems($row->id);
            $row->item_count = count($row->items);
        }
        return $rows;
    }

    public function getById($id) {
        $this->db->query("SELECT b.*, p.part_name as output_part_name, p.sku as output_sku
                         FROM {$this->table} b
                         JOIN parts p ON b.output_part_id = p.id
                         WHERE b.id = :id");
        $this->db->bind(':id', (int)$id);
        $bom = $this->db->single();
        
        if ($bom) {
            $bom->items = $this->getItems($id);
        }
        return $bom;
    }

    public function getItems($bomId) {
        $this->db->query("SELECT bi.*, p.part_name, p.sku, p.unit, p.cost_price as current_cost
                         FROM {$this->itemsTable} bi
                         JOIN parts p ON bi.part_id = p.id
                         WHERE bi.bom_id = :bom_id");
        $this->db->bind(':bom_id', (int)$bomId);
        return $this->db->resultSet();
    }

    public function create($data, $userId = null) {
        try {
            $this->db->beginTransaction();

            $this->db->query("INSERT INTO {$this->table} (output_part_id, name, version, output_qty, is_active, notes, created_by, updated_by)
                             VALUES (:output_part_id, :name, :version, :output_qty, :is_active, :notes, :created_by, :updated_by)");
            $this->db->bind(':output_part_id', $data['output_part_id']);
            $this->db->bind(':name', $data['name']);
            $this->db->bind(':version', $data['version'] ?? '1.0');
            $this->db->bind(':output_qty', $data['output_qty'] ?? 1.000);
            $this->db->bind(':is_active', $data['is_active'] ?? 1);
            $this->db->bind(':notes', $data['notes'] ?? null);
            $this->db->bind(':created_by', $userId);
            $this->db->bind(':updated_by', $userId);
            $this->db->execute();

            $bomId = $this->db->lastInsertId();

            if (!empty($data['items'])) {
                foreach ($data['items'] as $item) {
                    $this->db->query("INSERT INTO {$this->itemsTable} (bom_id, part_id, qty, notes)
                                     VALUES (:bom_id, :part_id, :qty, :notes)");
                    $this->db->bind(':bom_id', $bomId);
                    $this->db->bind(':part_id', $item['part_id']);
                    $this->db->bind(':qty', $item['qty']);
                    $this->db->bind(':notes', $item['notes'] ?? null);
                    $this->db->execute();
                }
            }

            $this->db->commit();
            return $bomId;
        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }

    public function update($id, $data, $userId = null) {
        try {
            $this->db->beginTransaction();

            $this->db->query("UPDATE {$this->table} 
                             SET name = :name, version = :version, output_qty = :output_qty, 
                                 is_active = :is_active, notes = :notes, updated_by = :updated_by
                             WHERE id = :id");
            $this->db->bind(':id', (int)$id);
            $this->db->bind(':name', $data['name']);
            $this->db->bind(':version', $data['version'] ?? '1.0');
            $this->db->bind(':output_qty', $data['output_qty'] ?? 1.000);
            $this->db->bind(':is_active', $data['is_active'] ?? 1);
            $this->db->bind(':notes', $data['notes'] ?? null);
            $this->db->bind(':updated_by', $userId);
            $this->db->execute();

            // Replace items
            $this->db->query("DELETE FROM {$this->itemsTable} WHERE bom_id = :bom_id");
            $this->db->bind(':bom_id', (int)$id);
            $this->db->execute();

            if (!empty($data['items'])) {
                foreach ($data['items'] as $item) {
                    $this->db->query("INSERT INTO {$this->itemsTable} (bom_id, part_id, qty, notes)
                                     VALUES (:bom_id, :part_id, :qty, :notes)");
                    $this->db->bind(':bom_id', (int)$id);
                    $this->db->bind(':part_id', $item['part_id']);
                    $this->db->bind(':qty', $item['qty']);
                    $this->db->bind(':notes', $item['notes'] ?? null);
                    $this->db->execute();
                }
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }

    public function getActiveBOMForPart($partId) {
        $this->db->query("SELECT id FROM {$this->table} 
                         WHERE output_part_id = :part_id AND is_active = 1 
                         LIMIT 1");
        $this->db->bind(':part_id', (int)$partId);
        $bom = $this->db->single();
        
        if ($bom) {
            return $this->getById($bom->id);
        }
        return null;
    }
}
