<?php
class SalesTargetController extends Controller {
    private $model;
    private $collectionModel;

    public function __construct() {
        SalesTarget::ensureSchema();
        $this->model = $this->model('SalesTarget');
    }

    public function list() {
        $u = $this->requirePermission('sales.read');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') $this->error('Method Not Allowed', 405);
        
        $db = new Database();
        // Get unique location+month combinations and their global target
        // We will fetch all and format
        $db->query("
            SELECT t.location_id, l.name as location_name, t.target_month,
                   SUM(CASE WHEN t.collection_id IS NULL THEN t.target_value ELSE 0 END) as global_target,
                   COUNT(t.collection_id) as collection_count
            FROM sales_targets t
            JOIN service_locations l ON t.location_id = l.id
            GROUP BY t.location_id, l.name, t.target_month
            ORDER BY t.target_month DESC, l.name ASC
        ");
        $list = $db->resultSet();
        $this->success($list);
    }

    public function get() {
        $u = $this->requirePermission('sales.read');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') $this->error('Method Not Allowed', 405);
        
        $locId = isset($_GET['location_id']) ? (int)$_GET['location_id'] : $this->currentLocationId($u);
        $month = $_GET['month'] ?? date('Y-m');

        if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
            $this->error('Invalid month format, expected YYYY-MM', 400);
        }

        // Fetch targets
        $targets = $this->model->getTargets($locId, $month);

        // Fetch all collections to populate the UI
        $db = new Database();
        $db->query("SELECT id, name FROM collections ORDER BY name ASC");
        $collections = $db->resultSet();

        $this->success([
            'targets' => $targets,
            'collections' => $collections
        ]);
    }

    public function save() {
        $u = $this->requirePermission('sales.write');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') $this->error('Method Not Allowed', 405);
        
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $locId = isset($data['location_id']) ? (int)$data['location_id'] : $this->currentLocationId($u);
        $month = $data['month'] ?? date('Y-m');

        if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
            $this->error('Invalid month format, expected YYYY-MM', 400);
        }

        $global = isset($data['global']) ? $data['global'] : 0;
        $collections = isset($data['collections']) && is_array($data['collections']) ? $data['collections'] : [];

        $res = $this->model->saveTargets($locId, $month, $global, $collections);
        
        if ($res) {
            $this->success(null, 'Targets saved successfully');
        } else {
            $this->error('Failed to save targets', 500);
        }
    }
}
