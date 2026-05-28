<?php
/**
 * BankSchema - banks and bank_branches master data table auto-migration.
 */
class BankSchema {
    private static $done = false;

    private static function pdo() {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    }

    public static function ensure($force = false) {
        if (!$force && !defined('FORCE_MIGRATIONS')) return;
        if (self::$done && !$force) return;
        self::$done = true;

        try {
            $pdo = self::pdo();
        } catch (Exception $e) {
            return;
        }

        // 1. banks table
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS banks (
                    id         INT AUTO_INCREMENT PRIMARY KEY,
                    name       VARCHAR(100) NOT NULL,
                    code       VARCHAR(20) NULL,
                    is_active  TINYINT(1) DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ");

            // Seed some common Sri Lankan banks if empty
            $stmt = $pdo->query("SELECT COUNT(*) FROM banks");
            if ((int)$stmt->fetchColumn() === 0) {
                $commonBanks = [
                    ['Bank of Ceylon', 'BOC'],
                    ['Sampath Bank', 'SAMP'],
                    ['Commercial Bank', 'COMB'],
                    ['Hatton National Bank', 'HNB'],
                    ['Peoples Bank', 'PB'],
                    ['Seylan Bank', 'SEYB'],
                    ['NDB Bank', 'NDB'],
                    ['DFCC Bank', 'DFCC'],
                    ['Nations Trust Bank', 'NTB'],
                    ['Pan Asia Bank', 'PABC']
                ];
                $ins = $pdo->prepare("INSERT INTO banks (name, code) VALUES (?, ?)");
                foreach ($commonBanks as $b) {
                    $ins->execute($b);
                }
            }
        } catch (Exception $e) {
            // ignore
        }

        // 2. bank_branches table
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS bank_branches (
                    id           INT AUTO_INCREMENT PRIMARY KEY,
                    bank_id      INT NOT NULL,
                    branch_name  VARCHAR(100) NOT NULL,
                    branch_code  VARCHAR(20) NULL,
                    is_active    TINYINT(1) DEFAULT 1,
                    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_bb_bank (bank_id)
                )
            ");
        } catch (Exception $e) {
            // ignore
        }

        // 3. RBAC permissions
        try {
            $pdo->exec("
                INSERT IGNORE INTO permissions (perm_key, description) VALUES
                ('banks.read', 'View bank master data'),
                ('banks.write', 'Create/update/delete banks and branches')
            ");

            // Default grants for staff roles
            try {
                $roleId = function($name) use ($pdo) {
                    $stmt = $pdo->prepare("SELECT id FROM roles WHERE name = ? LIMIT 1");
                    $stmt->execute([$name]);
                    return (int)$stmt->fetchColumn();
                };
                $permId = function($key) use ($pdo) {
                    $stmt = $pdo->prepare("SELECT id FROM permissions WHERE perm_key = ? LIMIT 1");
                    $stmt->execute([$key]);
                    return (int)$stmt->fetchColumn();
                };
                $grant = function($roleName, $permKey) use ($pdo, $roleId, $permId) {
                    $rid = $roleId($roleName);
                    $pid = $permId($permKey);
                    if ($rid && $pid) {
                        $stmt = $pdo->prepare("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
                        $stmt->execute([$rid, $pid]);
                    }
                };

                foreach (['banks.read'] as $p) {
                    $grant('Workshop Officer', $p);
                    $grant('Factory Officer', $p);
                }
            } catch (Exception $e2) {
                // ignore
            }
        } catch (Exception $e) {
            // ignore
        }
    }
}
