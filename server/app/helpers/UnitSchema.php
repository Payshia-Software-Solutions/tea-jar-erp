<?php
/**
 * UnitSchema - units master data table auto-migration.
 */
class UnitSchema {
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

        $flagFile = __DIR__ . '/../../.schema_synced';
        if (file_exists($flagFile) && !$force) return;

        try {
            $pdo = self::pdo();
        } catch (Exception $e) {
            return;
        }

        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS units (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(50) NOT NULL UNIQUE,
                    created_by INT NULL,
                    updated_by INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            ");
            // Default units
            $pdo->exec("INSERT IGNORE INTO units (name) VALUES ('pcs'), ('ltr'), ('kg')");
        } catch (Exception $e) {
            // ignore
        }

        // Ensure RBAC permission keys exist (best-effort).
        try {
            $pdo->exec("
                INSERT IGNORE INTO permissions (perm_key, description) VALUES
                ('units.read', 'View units'),
                ('units.write', 'Create/update/delete units')
            ");

            // Best-effort grants (non-admin defaults)
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

                foreach (['units.read'] as $p) {
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
