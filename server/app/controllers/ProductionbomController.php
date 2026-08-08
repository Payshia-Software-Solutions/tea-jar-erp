<?php
/**
 * ProductionBOMController
 */
class ProductionbomController extends Controller {
    private $bomModel;

    public function __construct() {
        $this->bomModel = $this->model('ProductionBOM');
    }

    public function list() {
        $this->requirePermission('production.read');
        $filters = [];
        if (isset($_GET['active'])) $filters['active'] = (int)$_GET['active'];
        $rows = $this->bomModel->getAll($filters);
        $this->success($rows);
    }

    public function get($id) {
        $this->requirePermission('production.read');
        $row = $this->bomModel->getById($id);
        if (!$row) $this->error('BOM not found', 404);
        $this->success($row);
    }

    public function create() {
        $u = $this->requirePermission('production.write');
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        
        if (empty($data['output_part_id']) || empty($data['name'])) {
            $this->error('Output part and BOM name are required', 400);
        }

        $id = $this->bomModel->create($data, (int)$u['sub']);
        if ($id) {
            $this->success(['id' => $id], 'BOM created');
        }
        $this->error('Failed to create BOM', 500);
    }

    public function update($id) {
        $u = $this->requirePermission('production.write');
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        
        if ($this->bomModel->update($id, $data, (int)$u['sub'])) {
            $this->success(null, 'BOM updated');
        }
        $this->error('Failed to update BOM', 500);
    }

    public function getByPart($partId) {
        $this->requirePermission('production.read');
        $row = $this->bomModel->getActiveBOMForPart($partId);
        // Do not error if not found, just return null data so frontend knows no BOM exists
        $this->success($row);
    }

    public function delete($id) {
        $this->requirePermission('production.write');
        try {
            if ($this->bomModel->delete($id)) {
                $this->success(null, 'BOM deleted');
                return;
            }
            $this->error('Failed to delete BOM', 500);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 400);
        }
    }
}
