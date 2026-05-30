<?php

class SalesTarget {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public static function ensureSchema() {
        $db = new Database();
        $db->exec("
            CREATE TABLE IF NOT EXISTS sales_targets (
                id INT(11) AUTO_INCREMENT PRIMARY KEY,
                location_id INT(11) NOT NULL,
                collection_id INT(11) NULL,
                target_month VARCHAR(7) NOT NULL,
                target_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY loc_col_month (location_id, collection_id, target_month)
            )
        ");
    }

    public function getTargets($location_id, $month) {
        $stmt = $this->db->getDb()->prepare("SELECT * FROM sales_targets WHERE location_id = ? AND target_month = ?");
        $stmt->execute([$location_id, $month]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $res = ['global' => 0, 'collections' => []];
        foreach ($rows as $row) {
            if ($row['collection_id'] === null) {
                $res['global'] = (float)$row['target_value'];
            } else {
                $res['collections'][(int)$row['collection_id']] = (float)$row['target_value'];
            }
        }
        return $res;
    }

    public function saveTargets($location_id, $month, $global, $collections) {
        $this->db->beginTransaction();
        try {
            // Delete existing for this month & location
            $stmt = $this->db->getDb()->prepare("DELETE FROM sales_targets WHERE location_id = ? AND target_month = ?");
            $stmt->execute([$location_id, $month]);

            $insert = $this->db->getDb()->prepare("INSERT INTO sales_targets (location_id, collection_id, target_month, target_value) VALUES (?, ?, ?, ?)");
            
            // Insert global
            if (is_numeric($global)) {
                $insert->execute([$location_id, null, $month, (float)$global]);
            }

            // Insert collections
            if (is_array($collections)) {
                foreach ($collections as $col_id => $val) {
                    if (is_numeric($val) && (float)$val > 0) {
                        $insert->execute([$location_id, (int)$col_id, $month, (float)$val]);
                    }
                }
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
}
