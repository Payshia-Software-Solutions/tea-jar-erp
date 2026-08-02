<?php
/**
 * Database Auto-Increment Fixer (Interactive AJAX Version)
 * Upload this script to your server's public folder and run it via browser
 * e.g., https://your-api-domain.com/fix_auto_increment.php
 */

require_once __DIR__ . '/../config/config.php';

// Handle AJAX actions
if (isset($_GET['action'])) {
    header('Content-Type: application/json');
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        if ($_GET['action'] === 'get_tables') {
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            echo json_encode(['success' => true, 'tables' => $tables]);
            exit;
        }

        if ($_GET['action'] === 'fix_table' && !empty($_GET['table'])) {
            $table = $_GET['table'];
            
            // Disable foreign key checks to allow structure changes safely
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
            
            $columnsStmt = $pdo->prepare("SHOW COLUMNS FROM `$table`");
            $columnsStmt->execute();
            $columns = $columnsStmt->fetchAll(PDO::FETCH_ASSOC);
            
            $status = 'ok';
            $message = 'No changes needed (already has primary key & auto_increment)';
            
            // Find the column named 'id' (case-insensitive)
            $idColumn = null;
            foreach ($columns as $column) {
                if (strtolower($column['Field']) === 'id') {
                    $idColumn = $column;
                    break;
                }
            }

            if ($idColumn) {
                $colName = $idColumn['Field'];
                $colType = $idColumn['Type'];
                $extra = strtolower($idColumn['Extra']);
                $isPri = ($idColumn['Key'] === 'PRI');
                $hasAuto = (strpos($extra, 'auto_increment') !== false);
                $isInteger = (strpos(strtolower($colType), 'int') !== false);
                
                if (!$isInteger) {
                    $message = "Skipped: Column 'id' type is '$colType' (not an integer type)";
                } else {
                    // Check if any OTHER column has auto_increment
                    $otherAutoColumn = null;
                    foreach ($columns as $column) {
                        if (strtolower($column['Field']) !== 'id' && strpos(strtolower($column['Extra']), 'auto_increment') !== false) {
                            $otherAutoColumn = $column;
                            break;
                        }
                    }
                    
                    if (!$isPri || !$hasAuto || $otherAutoColumn !== null) {
                        $message = "";
                        
                        // Check if a row with id = 0 exists
                        $zeroCheck = $pdo->prepare("SELECT COUNT(*) FROM `$table` WHERE `$colName` = 0");
                        $zeroCheck->execute();
                        $hasZero = $zeroCheck->fetchColumn();
                        
                        if ($hasZero > 0) {
                            // Find maximum ID to safely shift ID 0
                            $maxCheck = $pdo->query("SELECT MAX(`$colName`) FROM `$table`");
                            $maxId = (int)$maxCheck->fetchColumn();
                            $newId = ($maxId > 0) ? $maxId + 1 : 1;
                            
                            $updateZero = $pdo->prepare("UPDATE `$table` SET `$colName` = :newId WHERE `$colName` = 0");
                            $updateZero->execute([':newId' => $newId]);
                            $message = "Resolved row with ID 0 to ID $newId. ";
                        }
                        
                        $fixes = [];
                        
                        // 1. If another column has auto_increment, we MUST remove it first!
                        if ($otherAutoColumn !== null) {
                            $oName = $otherAutoColumn['Field'];
                            $oType = $otherAutoColumn['Type'];
                            $oNull = (strtoupper($otherAutoColumn['Null']) === 'YES') ? 'NULL' : 'NOT NULL';
                            try {
                                $pdo->exec("ALTER TABLE `$table` MODIFY COLUMN `$oName` $oType $oNull");
                                $fixes[] = "Removed AUTO_INCREMENT from wrong column `$oName`";
                            } catch (Exception $e) {
                                $fixes[] = "Failed to remove AUTO_INCREMENT from wrong column `$oName` (" . $e->getMessage() . ")";
                            }
                        }
                        
                        // 2. Ensure the 'id' column is the PRIMARY KEY first
                        if (!$isPri) {
                            try {
                                $pdo->exec("ALTER TABLE `$table` ADD PRIMARY KEY (`$colName`)");
                                $fixes[] = "Added PRIMARY KEY";
                            } catch (Exception $e) {
                                $fixes[] = "Failed to add PRIMARY KEY (" . $e->getMessage() . ")";
                            }
                        }
                        
                        // 3. Alter the column to add AUTO_INCREMENT
                        if (!$hasAuto) {
                            try {
                                $alterSql = "ALTER TABLE `$table` MODIFY COLUMN `$colName` $colType NOT NULL AUTO_INCREMENT";
                                $pdo->exec($alterSql);
                                $fixes[] = "Added AUTO_INCREMENT to `$colName`";
                            } catch (Exception $e) {
                                $fixes[] = "Failed to add AUTO_INCREMENT to `$colName` (" . $e->getMessage() . ")";
                            }
                        }
                        
                        $status = 'fixed';
                        $message .= "Applied fixes: " . implode(', ', $fixes) . " on column `$colName` ($colType).";
                    }
                }
            } else {
                $message = "No column named 'id' found (case-insensitive)";
            }
            
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
            echo json_encode(['success' => true, 'status' => $status, 'message' => $message]);
            exit;
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Schema Repair Toolkit</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-dark: #0a0e17;
            --card-bg: #111827;
            --accent-cyan: #06b6d4;
            --accent-blue: #3b82f6;
            --accent-green: #10b981;
            --accent-red: #ef4444;
            --accent-amber: #f59e0b;
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
            --border-color: #1f2937;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg-dark);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            overflow-x: hidden;
        }

        .container {
            width: 100%;
            max-width: 900px;
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            padding: 2.5rem;
            position: relative;
            overflow: hidden;
        }

        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, var(--accent-cyan), var(--accent-blue));
        }

        header {
            text-align: center;
            margin-bottom: 2.5rem;
        }

        h1 {
            font-size: 2.2rem;
            font-weight: 800;
            letter-spacing: -0.5px;
            background: linear-gradient(to right, #00f2fe, #4facfe);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }

        .subtitle {
            color: var(--text-muted);
            font-size: 1rem;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background-color: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1rem;
            text-align: center;
            transition: all 0.3s ease;
        }

        .stat-card:hover {
            border-color: rgba(6, 182, 212, 0.3);
            transform: translateY(-2px);
        }

        .stat-val {
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--text-main);
            margin-bottom: 0.25rem;
        }

        .stat-val.cyan { color: var(--accent-cyan); }
        .stat-val.green { color: var(--accent-green); }
        .stat-val.amber { color: var(--accent-amber); }
        .stat-val.red { color: var(--accent-red); }

        .stat-label {
            font-size: 0.8rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .progress-container {
            margin-bottom: 2rem;
        }

        .progress-bar-bg {
            height: 10px;
            background-color: rgba(255, 255, 255, 0.05);
            border-radius: 5px;
            overflow: hidden;
            margin-bottom: 0.5rem;
            border: 1px solid rgba(255, 255, 255, 0.02);
        }

        .progress-bar-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, var(--accent-cyan), var(--accent-blue));
            border-radius: 5px;
            transition: width 0.1s linear;
        }

        .progress-text {
            display: flex;
            justify-content: space-between;
            font-size: 0.9rem;
            color: var(--text-muted);
        }

        .console-container {
            background-color: #05070c;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.25rem;
            margin-bottom: 2rem;
            height: 300px;
            overflow-y: auto;
            font-family: 'Fira Code', monospace;
            font-size: 0.85rem;
            line-height: 1.5;
            box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        .console-line {
            margin-bottom: 0.5rem;
            display: flex;
            align-items: flex-start;
        }

        .console-line.success { color: var(--accent-green); }
        .console-line.info { color: var(--accent-cyan); }
        .console-line.warning { color: var(--accent-amber); }
        .console-line.error { color: var(--accent-red); }

        .console-timestamp {
            color: rgba(255, 255, 255, 0.25);
            margin-right: 0.75rem;
            user-select: none;
        }

        .action-container {
            display: flex;
            justify-content: center;
            gap: 1rem;
        }

        .btn {
            font-family: 'Outfit', sans-serif;
            font-weight: 600;
            font-size: 1rem;
            padding: 0.85rem 2rem;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue));
            color: #fff;
            box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(6, 182, 212, 0.5);
        }

        .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* Custom Scrollbar for Console */
        .console-container::-webkit-scrollbar {
            width: 8px;
        }
        .console-container::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
        }
        .console-container::-webkit-scrollbar-thumb {
            background: var(--border-color);
            border-radius: 4px;
        }
        .console-container::-webkit-scrollbar-thumb:hover {
            background: #374151;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Database Repair Utility</h1>
            <p class="subtitle">Real-time Schema Optimization & AUTO_INCREMENT restoration</p>
        </header>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-val cyan" id="stat-total">0</div>
                <div class="stat-label">Total Tables</div>
            </div>
            <div class="stat-card">
                <div class="stat-val green" id="stat-ok">0</div>
                <div class="stat-label">Already OK</div>
            </div>
            <div class="stat-card">
                <div class="stat-val amber" id="stat-fixed">0</div>
                <div class="stat-label">Fixed</div>
            </div>
            <div class="stat-card">
                <div class="stat-val red" id="stat-failed">0</div>
                <div class="stat-label">Failed</div>
            </div>
        </div>

        <div class="progress-container">
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" id="progress-fill"></div>
            </div>
            <div class="progress-text">
                <span id="progress-status">Ready to initialize database scan</span>
                <span id="progress-percent">0%</span>
            </div>
        </div>

        <div class="console-container" id="console">
            <div class="console-line info">
                <span class="console-timestamp">[SYSTEM]</span>
                <span>Press "Start Diagnostics" to scan tables and begin the repairs.</span>
            </div>
        </div>

        <div class="action-container">
            <button class="btn btn-primary" id="start-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Start Diagnostics
            </button>
        </div>
    </div>

    <script>
        const consoleEl = document.getElementById('console');
        const startBtn = document.getElementById('start-btn');
        const progressFill = document.getElementById('progress-fill');
        const progressStatus = document.getElementById('progress-status');
        const progressPercent = document.getElementById('progress-percent');

        const statTotal = document.getElementById('stat-total');
        const statOk = document.getElementById('stat-ok');
        const statFixed = document.getElementById('stat-fixed');
        const statFailed = document.getElementById('stat-failed');

        let tables = [];
        let countOk = 0;
        let countFixed = 0;
        let countFailed = 0;

        function log(message, type = 'info') {
            const time = new Date().toLocaleTimeString();
            const line = document.createElement('div');
            line.className = `console-line ${type}`;
            line.innerHTML = `<span class="console-timestamp">[${time}]</span><span>${message}</span>`;
            consoleEl.appendChild(line);
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }

        startBtn.addEventListener('click', async () => {
            startBtn.disabled = true;
            log('Starting database diagnostic check...', 'info');
            progressStatus.innerText = 'Fetching list of tables...';
            
            try {
                const response = await fetch('?action=get_tables');
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.error || 'Failed to fetch table list');
                }
                
                tables = data.tables;
                statTotal.innerText = tables.length;
                log(`Successfully identified ${tables.length} tables in database.`, 'success');
                
                // Reset stats
                countOk = 0;
                countFixed = 0;
                countFailed = 0;
                statOk.innerText = '0';
                statFixed.innerText = '0';
                statFailed.innerText = '0';

                // Process tables one by one
                for (let i = 0; i < tables.length; i++) {
                    const table = tables[i];
                    const percent = Math.round(((i + 1) / tables.length) * 100);
                    
                    progressStatus.innerText = `Processing table (${i + 1}/${tables.length}): ${table}`;
                    progressFill.style.width = `${percent}%`;
                    progressPercent.innerText = `${percent}%`;

                    try {
                        const tableResponse = await fetch(`?action=fix_table&table=${encodeURIComponent(table)}`);
                        const tableData = await tableResponse.json();

                        if (tableData.success) {
                            if (tableData.status === 'fixed') {
                                countFixed++;
                                statFixed.innerText = countFixed;
                                log(`Table [${table}]: ${tableData.message}`, 'warning');
                            } else {
                                countOk++;
                                statOk.innerText = countOk;
                            }
                        } else {
                            throw new Error(tableData.error || 'Unknown error occurred');
                        }
                    } catch (tableErr) {
                        countFailed++;
                        statFailed.innerText = countFailed;
                        log(`Table [${table}] failed: ${tableErr.message}`, 'error');
                    }
                }

                progressStatus.innerText = 'Diagnostic check and repair process completed.';
                log('=== REPAIR COMPLETED ===', 'success');
                log(`Successfully checked ${tables.length} tables.`, 'info');
                log(`Fixed: ${countFixed} tables | Already OK: ${countOk} tables | Failed: ${countFailed} tables`, 'info');

            } catch (err) {
                log(`Fatal error during execution: ${err.message}`, 'error');
                progressStatus.innerText = 'Execution stopped due to a fatal error.';
            } finally {
                startBtn.disabled = false;
            }
        });
    </script>
</body>
</html>
