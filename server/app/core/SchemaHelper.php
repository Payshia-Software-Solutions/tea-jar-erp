<?php
class SchemaHelper {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Captures the current database state (Not needed anymore since it's hardcoded, 
     * but could be used to generate the hardcoded file content)
     */
    public function getSnapshot() {
        // ... (can be used by a generator script)
    }

    /**
     * Compares the live database with the hardcoded definition
     */
    public function getDiff($tableNameFilter = null) {
        require_once dirname(__FILE__) . '/SchemaDefinition.php';
        $defined = SchemaDefinition::get();
        
        // Filter defined if tableNameFilter is provided
        if ($tableNameFilter) {
            if (!isset($defined[$tableNameFilter])) return ['error' => "Table $tableNameFilter not found in definition."];
            $defined = [$tableNameFilter => $defined[$tableNameFilter]];
        }

        // Get Live
        $res = $this->db->rawQuery("SHOW TABLES");
        $liveTablesList = $res->fetchAll(PDO::FETCH_COLUMN);
        
        $diff = [
            'defined_table_count' => count(SchemaDefinition::get()),
            'live_table_count' => count($liveTablesList),
            'missing_tables' => [],
            'missing_columns' => [],
            'missing_indexes' => []
        ];

        $live = [];
        foreach ($liveTablesList as $t) {
            $live[$t] = ['columns' => [], 'indexes' => []];
            try {
                $resCol = $this->db->rawQuery("DESCRIBE `$t` ");
                while ($c = $resCol->fetch(\PDO::FETCH_ASSOC)) $live[$t]['columns'][$c['Field']] = $c;
                
                $resIdx = $this->db->rawQuery("SHOW INDEX FROM `$t` ");
                while ($i = $resIdx->fetch(\PDO::FETCH_ASSOC)) {
                    $key = $i['Key_name'];
                    if (!isset($live[$t]['indexes'][$key])) $live[$t]['indexes'][$key] = ['Key_name' => $key, 'Columns' => []];
                    $live[$t]['indexes'][$key]['Columns'][] = $i['Column_name'];
                }
            } catch (\Exception $e) {
                // If a table is corrupted (e.g. MariaDB error 1932), mark it so we don't crash
                $live[$t]['corrupted'] = true;
                $live[$t]['error'] = $e->getMessage();
            }
        }

        foreach ($defined as $tableName => $table) {
            if (!isset($live[$tableName])) {
                $diff['missing_tables'][] = $tableName;
                continue;
            }

            // Check Columns
            foreach ($table['columns'] as $colName => $col) {
                if (!isset($live[$tableName]['columns'][$colName])) {
                    $diff['missing_columns'][] = [
                        'table' => $tableName,
                        'column' => $colName,
                        'definition' => $col['Type'] . ($col['Null'] === 'NO' ? ' NOT NULL' : '') . ($col['Default'] ? " DEFAULT '{$col['Default']}'" : "")
                    ];
                }
            }

            // Check Indexes
            foreach ($table['indexes'] as $keyName => $idx) {
                if (!isset($live[$tableName]['indexes'][$keyName])) {
                    $diff['missing_indexes'][] = [
                        'table' => $tableName,
                        'index' => $keyName,
                        'columns' => $idx['Columns'],
                        'unique' => $idx['Non_unique'] == 0
                    ];
                }
            }
        }

        return $diff;
    }

    /**
     * Applies missing elements to the live database
     */
    public function sync($diff) {
        $results = [];

        // 1. Handle Missing Tables
        foreach ($diff['missing_tables'] as $tableName) {
            require_once dirname(__FILE__) . '/SchemaDefinition.php';
            $defined = SchemaDefinition::get();
            $tableDef = $defined[$tableName];
            
            $sql = "CREATE TABLE `$tableName` (\n";
            $cols = [];
            foreach ($tableDef['columns'] as $colName => $c) {
                $colSql = "  `$colName` " . $c['Type'];
                if ($c['Null'] === 'NO') $colSql .= " NOT NULL";
                if ($c['Default'] !== null) {
                    if ($c['Default'] === 'current_timestamp()') {
                        $colSql .= " DEFAULT CURRENT_TIMESTAMP";
                    } else {
                        $colSql .= " DEFAULT '" . $c['Default'] . "'";
                    }
                }
                if ($c['Extra'] === 'auto_increment') $colSql .= " AUTO_INCREMENT";
                if ($c['Extra'] === 'on update current_timestamp()') $colSql .= " ON UPDATE CURRENT_TIMESTAMP";
                $cols[] = $colSql;
            }
            
            // Add PRIMARY KEY
            if (isset($tableDef['indexes']['PRIMARY'])) {
                $cols[] = "  PRIMARY KEY (`" . implode("`,`", $tableDef['indexes']['PRIMARY']['Columns']) . "`)";
            }
            
            $sql .= implode(",\n", $cols);
            $sql .= "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
            
            try {
                $this->db->rawQuery($sql);
                $results[] = "Created table $tableName";
                
                // Add other indexes
                foreach ($tableDef['indexes'] as $keyName => $idx) {
                    if ($keyName === 'PRIMARY') continue;
                    $type = ($idx['Non_unique'] == 0) ? "UNIQUE INDEX" : "INDEX";
                    $idxSql = "ALTER TABLE `$tableName` ADD $type `$keyName` (`" . implode("`,`", $idx['Columns']) . "`);";
                    $this->db->rawQuery($idxSql);
                    $results[] = "Added index $keyName to $tableName";
                }
            } catch (Exception $e) {
                $results[] = "Error creating $tableName: " . $e->getMessage();
            }
        }

        // 2. Handle Missing Columns
        foreach ($diff['missing_columns'] as $col) {
            $sql = "ALTER TABLE `{$col['table']}` ADD COLUMN `{$col['column']}` {$col['definition']}";
            try {
                $this->db->rawQuery($sql);
                $results[] = "Added column {$col['column']} to {$col['table']}";
            } catch (Exception $e) {
                $results[] = "Error adding column {$col['column']}: " . $e->getMessage();
            }
        }

        // 3. Handle Missing Indexes
        foreach ($diff['missing_indexes'] as $idx) {
            $type = $idx['unique'] ? "UNIQUE INDEX" : "INDEX";
            $cols = implode("`, `", $idx['columns']);
            $sql = "ALTER TABLE `{$idx['table']}` ADD $type `{$idx['index']}` (`$cols`)";
            try {
                $this->db->rawQuery($sql);
                $results[] = "Added index {$idx['index']} to {$idx['table']}";
            } catch (Exception $e) {
                $results[] = "Error adding index {$idx['index']}: " . $e->getMessage();
            }
        }

        return $results;
    }
}
