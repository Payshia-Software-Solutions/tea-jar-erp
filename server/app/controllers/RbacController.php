<?php
/**
 * RBAC Controller (Admin only)
 *
 * Endpoints:
 * - GET  /api/rbac/roles
 * - POST /api/rbac/roles/create
 * - DELETE /api/rbac/roles/delete/{id}
 * - GET  /api/rbac/permissions
 * - GET  /api/rbac/role_permissions/{roleId}
 * - POST /api/rbac/role_permissions/set/{roleId}
 */
class RbacController extends Controller {
    private $db;

    public function __construct() {
        // Ensure any newly-added modules (like inventory) can seed their permission keys
        // so they appear in the RBAC UI without requiring a full reinstall.
        // try { InventorySchema::ensure(); } catch (Exception $e) {}
        try { UnitSchema::ensure(); } catch (Exception $e) {}
        try { TaxSchema::ensure(); } catch (Exception $e) {}
        try { BanquetSchema::ensure(); } catch (Exception $e) {}
        $this->db = new Database();
    }

    private function requireAdmin() {
        $u = $this->requireAuth();
        if (($u['role'] ?? '') !== 'Admin') {
            $this->error('Forbidden', 403);
        }
        return $u;
    }

    // GET /api/rbac/roles
    public function roles() {
        $this->requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        $this->db->query("SELECT id, name, created_at FROM roles ORDER BY name ASC");
        $rows = $this->db->resultSet();
        $this->success($rows);
    }

    // POST /api/rbac/create_role
    public function create_role() {
        $this->requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        $name = trim((string)($data['name'] ?? ''));
        if ($name === '') {
            $this->error('Role name is required', 400);
            return;
        }
        $this->db->query("INSERT INTO roles (name) VALUES (:name)");
        $this->db->bind(':name', $name);
        try {
            $ok = $this->db->execute();
        } catch (Exception $e) {
            $ok = false;
        }
        if ($ok) {
            $this->success(null, 'Role created');
        } else {
            $this->error('Failed to create role');
        }
    }

    // DELETE /api/rbac/delete_role/{id}
    public function delete_role($id = null) {
        $this->requireAdmin();
        $method = $_SERVER['REQUEST_METHOD'];
        if ($method === 'POST') {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);
            if (isset($data['_method']) && $data['_method'] === 'DELETE') {
                $method = 'DELETE';
            }
        }
        if ($method !== 'DELETE') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$id) {
            $this->error('Role ID required', 400);
            return;
        }

        // Prevent deleting core roles.
        $this->db->query("SELECT name FROM roles WHERE id = :id");
        $this->db->bind(':id', (int)$id);
        $role = $this->db->single();
        if ($role && in_array($role->name, ['Admin', 'Workshop Officer', 'Factory Officer'], true)) {
            $this->error('Cannot delete core role', 400);
            return;
        }

        $this->db->query("DELETE FROM roles WHERE id = :id");
        $this->db->bind(':id', (int)$id);
        $ok = $this->db->execute();
        if ($ok) {
            $this->success(null, 'Role deleted');
        } else {
            $this->error('Failed to delete role');
        }
    }

    // GET /api/rbac/permissions
    public function permissions() {
        $this->requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        $this->db->query("SELECT id, perm_key, description FROM permissions ORDER BY perm_key ASC");
        $rows = $this->db->resultSet();
        $this->success($rows);
    }

    // GET /api/rbac/role_permissions/{roleId}
    public function role_permissions($roleId = null) {
        $this->requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$roleId) {
            $this->error('Role ID required', 400);
            return;
        }
        $this->db->query("
            SELECT p.perm_key
            FROM role_permissions rp
            INNER JOIN permissions p ON p.id = rp.permission_id
            WHERE rp.role_id = :role_id
            ORDER BY p.perm_key ASC
        ");
        $this->db->bind(':role_id', (int)$roleId);
        $rows = $this->db->resultSet();
        $keys = array_map(function($r) { return $r->perm_key; }, $rows ?: []);
        $this->success($keys);
    }

    // POST /api/rbac/set_role_permissions/{roleId}
    public function set_role_permissions($roleId = null) {
        $this->requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$roleId) {
            $this->error('Role ID required', 400);
            return;
        }

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        $keys = $data['permissions'] ?? $data['permission_keys'] ?? null;
        if (!is_array($keys)) {
            $this->error('permission_keys must be an array', 400);
            return;
        }

        // Prevent editing Admin role permissions (Admin is superuser).
        $this->db->query("SELECT name FROM roles WHERE id = :id");
        $this->db->bind(':id', (int)$roleId);
        $role = $this->db->single();
        if ($role && $role->name === 'Admin') {
            $this->error('Admin permissions are implicit', 400);
            return;
        }

        // Transactionally replace role permissions.
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("DELETE FROM role_permissions WHERE role_id = ?");
            $stmt->execute([(int)$roleId]);

            if (count($keys) > 0) {
                $in = implode(',', array_fill(0, count($keys), '?'));
                $stmt = $pdo->prepare("SELECT id, perm_key FROM permissions WHERE perm_key IN ($in)");
                $stmt->execute(array_values($keys));
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

                $ins = $pdo->prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
                foreach ($rows as $r) {
                    $ins->execute([(int)$roleId, (int)$r['id']]);
                }
            }

            $pdo->commit();
            $this->success(null, 'Role permissions updated');
        } catch (Exception $e) {
            $pdo->rollBack();
            $this->error('Failed to update role permissions');
        }
    }
}
