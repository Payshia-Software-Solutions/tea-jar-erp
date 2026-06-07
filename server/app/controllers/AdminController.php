<?php
/**
 * Admin Controller (Admin-only operations)
 *
 * Endpoints:
 * - GET  /api/admin/users
 * - POST /api/admin/set_user_role/{id}
 * - POST /api/admin/set_user_location/{id}
 * - GET  /api/admin/user_locations/{id}
 * - POST /api/admin/set_user_locations/{id}
 * - POST /api/admin/set_user_active/{id}
 */
class AdminController extends Controller {
    private $db;
    private $auditModel;

    public function __construct() {
        $this->db = new Database();
        $this->auditModel = $this->model('AuditLog');
    }

    private function requireAdmin() {
        $u = $this->requireAuth();
        if (($u['role'] ?? '') !== 'Admin') {
            $this->error('Forbidden', 403);
        }
        return $u;
    }

    private function ensureUserLocationsTable() {
        // Defensive: make multi-location assignment work even if /setup wasn't re-run yet.
        try {
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS user_locations (
                    user_id INT NOT NULL,
                    location_id INT NOT NULL,
                    PRIMARY KEY (user_id, location_id),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (location_id) REFERENCES service_locations(id) ON DELETE CASCADE,
                    INDEX idx_user_locations_location (location_id)
                )
            ");
        } catch (Exception $e) {
            // ignore
        }
    }

    // GET /api/admin/users
    public function users() {
        $this->requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        $this->ensureUserLocationsTable();
        // Keep user_locations at least in sync with each user's primary location.
        try {
            $this->db->exec("
                INSERT IGNORE INTO user_locations (user_id, location_id)
                SELECT id, location_id
                FROM users
                WHERE location_id IS NOT NULL
            ");
        } catch (Exception $e) {
            // ignore
        }

        $this->db->query("
            SELECT
                u.id,
                u.name,
                u.email,
                u.role_id,
                r.name AS role,
                u.location_id,
                sl.name AS location_name,
                u.is_active,
                GROUP_CONCAT(DISTINCT sl2.name ORDER BY sl2.name SEPARATOR ', ') AS allowed_locations,
                GROUP_CONCAT(DISTINCT ul.location_id ORDER BY ul.location_id SEPARATOR ',') AS allowed_location_ids,
                u.created_at
            FROM users u
            INNER JOIN roles r ON r.id = u.role_id
            INNER JOIN service_locations sl ON sl.id = u.location_id
            LEFT JOIN user_locations ul ON ul.user_id = u.id
            LEFT JOIN service_locations sl2 ON sl2.id = ul.location_id
            GROUP BY u.id, u.name, u.email, u.role_id, r.name, u.location_id, sl.name, u.is_active, u.created_at
            ORDER BY u.id ASC
        ");
        $rows = $this->db->resultSet();
        $this->success($rows);
    }

    // POST /api/admin/set_user_role/{id}
    public function set_user_role($id = null) {
        $u = $this->requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$id) {
            $this->error('User ID required', 400);
            return;
        }

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        $roleId = (int)($data['role_id'] ?? 0);
        if ($roleId <= 0) {
            $this->error('role_id is required', 400);
            return;
        }

        // Validate role exists.
        $this->db->query("SELECT id, name FROM roles WHERE id = :id LIMIT 1");
        $this->db->bind(':id', $roleId);
        $role = $this->db->single();
        if (!$role) {
            $this->error('Invalid role_id', 400);
            return;
        }

        // Update role_id.
        $this->db->query("UPDATE users SET role_id = :role_id WHERE id = :id");
        $this->db->bind(':role_id', $roleId);
        $this->db->bind(':id', (int)$id);
        $ok = $this->db->execute();

        if ($ok) {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'location_id' => null,
                'action' => 'update',
                'entity' => 'user',
                'entity_id' => (int)$id,
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['role_id' => $roleId, 'role' => $role->name]),
            ]);
            $this->success(null, 'User role updated');
        } else {
            $this->error('Failed to update user role');
        }
    }

    // POST /api/admin/set_user_location/{id}
    public function set_user_location($id = null) {
        $u = $this->requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$id) {
            $this->error('User ID required', 400);
            return;
        }

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        $locationId = (int)($data['location_id'] ?? 0);
        if ($locationId <= 0) {
            $this->error('location_id is required', 400);
            return;
        }

        // Validate location exists.
        $this->db->query("SELECT id, name FROM service_locations WHERE id = :id LIMIT 1");
        $this->db->bind(':id', $locationId);
        $loc = $this->db->single();
        if (!$loc) {
            $this->error('Invalid location_id', 400);
            return;
        }

        $this->db->query("UPDATE users SET location_id = :location_id WHERE id = :id");
        $this->db->bind(':location_id', $locationId);
        $this->db->bind(':id', (int)$id);
        $ok = $this->db->execute();

        if ($ok) {
            $this->ensureUserLocationsTable();
            // Ensure primary location is always included in allowed locations.
            try {
                $this->db->query("INSERT IGNORE INTO user_locations (user_id, location_id) VALUES (:uid, :lid)");
                $this->db->bind(':uid', (int)$id);
                $this->db->bind(':lid', $locationId);
                $this->db->execute();
            } catch (Exception $e) {
                // ignore
            }

            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'location_id' => null,
                'action' => 'update',
                'entity' => 'user',
                'entity_id' => (int)$id,
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['location_id' => $locationId, 'location_name' => $loc->name]),
            ]);
            $this->success(null, 'User location updated');
        } else {
            $this->error('Failed to update user location');
        }
    }

    // GET /api/admin/user_locations/{id}
    public function user_locations($id = null) {
        $this->requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$id) {
            $this->error('User ID required', 400);
            return;
        }
        $this->ensureUserLocationsTable();

        $this->db->query("SELECT location_id FROM user_locations WHERE user_id = :uid ORDER BY location_id ASC");
        $this->db->bind(':uid', (int)$id);
        $rows = $this->db->resultSet() ?: [];
        $ids = array_map(function($r) { return (int)$r->location_id; }, $rows);
        $this->success($ids);
    }

    // POST /api/admin/set_user_locations/{id}
    public function set_user_locations($id = null) {
        $u = $this->requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$id) {
            $this->error('User ID required', 400);
            return;
        }
        $this->ensureUserLocationsTable();

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        $locationIds = $data['location_ids'] ?? null;
        if (!is_array($locationIds)) {
            $this->error('location_ids must be an array', 400);
            return;
        }
        $clean = [];
        foreach ($locationIds as $lid) {
            $lid = (int)$lid;
            if ($lid > 0) $clean[] = $lid;
        }
        $clean = array_values(array_unique($clean));
        if (count($clean) === 0) {
            $this->error('At least one location is required', 400);
            return;
        }

        // Validate all locations exist.
        $in = implode(',', array_fill(0, count($clean), '?'));
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM service_locations WHERE id IN ($in)");
        $stmt->execute($clean);
        $count = (int)$stmt->fetchColumn();
        if ($count !== count($clean)) {
            $this->error('One or more locations are invalid', 400);
            return;
        }

        // Replace assignments in a transaction.
        $pdo->beginTransaction();
        try {
            $del = $pdo->prepare("DELETE FROM user_locations WHERE user_id = ?");
            $del->execute([(int)$id]);

            $ins = $pdo->prepare("INSERT INTO user_locations (user_id, location_id) VALUES (?, ?)");
            foreach ($clean as $lid) {
                $ins->execute([(int)$id, (int)$lid]);
            }

            // Ensure the primary location is included.
            $stmt = $pdo->prepare("SELECT location_id FROM users WHERE id = ? LIMIT 1");
            $stmt->execute([(int)$id]);
            $primary = (int)$stmt->fetchColumn();
            if ($primary > 0 && !in_array($primary, $clean, true)) {
                // Set primary to first allowed location for consistency.
                $upd = $pdo->prepare("UPDATE users SET location_id = ? WHERE id = ?");
                $upd->execute([(int)$clean[0], (int)$id]);
            }

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            $this->error('Failed to update user locations');
            return;
        }

        $this->auditModel->write([
            'user_id' => (int)$u['sub'],
            'location_id' => null,
            'action' => 'update',
            'entity' => 'user_locations',
            'entity_id' => (int)$id,
            'method' => $_SERVER['REQUEST_METHOD'] ?? '',
            'path' => $_SERVER['REQUEST_URI'] ?? '',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'details' => json_encode(['location_ids' => $clean]),
        ]);

        $this->success(null, 'User locations updated');
    }

    // POST /api/admin/set_user_active/{id}
    public function set_user_active($id = null) {
        $u = $this->requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$id) {
            $this->error('User ID required', 400);
            return;
        }

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        
        $val = $data['active'] ?? $data['is_active'] ?? null;
        if ($val === null) {
            $this->error('Status value required', 400);
            return;
        }

        // Convert boolean or numeric string to int
        if (is_bool($val)) {
            $isActive = $val ? 1 : 0;
        } else {
            $isActive = (int)$val;
        }

        if (!in_array($isActive, [0, 1], true)) {
            $this->error('is_active must be 0 or 1', 400);
            return;
        }
    
        // Ensure column exists (older installs).
        try {
            $this->db->exec("ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1");
        } catch (Exception $e) {
            // ignore (exists)
        }

        $this->db->query("UPDATE users SET is_active = :is_active WHERE id = :id");
        $this->db->bind(':is_active', $isActive);
        $this->db->bind(':id', (int)$id);
        $ok = $this->db->execute();
        if (!$ok) {
            $this->error('Failed to update user status');
            return;
        }

        $this->auditModel->write([
            'user_id' => (int)$u['sub'],
            'location_id' => null,
            'action' => 'update',
            'entity' => 'user',
            'entity_id' => (int)$id,
            'method' => $_SERVER['REQUEST_METHOD'] ?? '',
            'path' => $_SERVER['REQUEST_URI'] ?? '',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'details' => json_encode(['is_active' => $isActive]),
        ]);

        $this->success(null, $isActive === 1 ? 'User activated' : 'User deactivated');
    }

    // GET /api/admin/schema
    public function schema() {
        $this->requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        try {
            $this->db->query("
                SELECT 
                    TABLE_NAME as table_name, 
                    COLUMN_NAME as column_name, 
                    DATA_TYPE as data_type, 
                    IS_NULLABLE as is_nullable, 
                    COLUMN_DEFAULT as column_default, 
                    EXTRA as extra 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = :dbname 
                ORDER BY TABLE_NAME, ORDINAL_POSITION
            ");
            $this->db->bind(':dbname', DB_NAME);
            $rows = $this->db->resultSet();

            // Group by table
            $tables = [];
            foreach ($rows as $row) {
                $tableName = $row->table_name;
                if (!isset($tables[$tableName])) {
                    $tables[$tableName] = [];
                }
                $tables[$tableName][] = [
                    'column' => $row->column_name,
                    'type' => $row->data_type,
                    'nullable' => $row->is_nullable,
                    'default' => $row->column_default,
                    'extra' => $row->extra
                ];
            }

            $this->success($tables);
        } catch (Exception $e) {
            $this->error('Failed to fetch schema: ' . $e->getMessage());
        }
    }

    // POST /api/admin/sync
    public function sync() {
        $this->requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        require_once __DIR__ . '/../helpers/SyncHelper.php';
        $results = SyncHelper::runAll();
        
        $this->success($results, 'Database synchronization completed');
    }
}
