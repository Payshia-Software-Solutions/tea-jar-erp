<?php
/**
 * StorefrontMenuController
 * Managing e-commerce storefront navigation menus.
 */
class StorefrontMenuController extends Controller {
    private $menuModel;

    public function __construct() {
        $this->menuModel = $this->model('StorefrontMenu');
        require_once '../app/helpers/InventorySchema.php';
        InventorySchema::ensure();
    }

    // GET /api/storefront/menus
    public function index() {
        $activeOnly = isset($_GET['active']) && $_GET['active'] == '1';
        $locationId = isset($_GET['location_id']) ? (int)$_GET['location_id'] : null;
        $tree = $this->menuModel->getTree($activeOnly, $locationId);
        $this->success($tree);
    }

    // GET /api/storefront/menus/list
    public function list() {
        $activeOnly = isset($_GET['active']) && $_GET['active'] == '1';
        $locationId = isset($_GET['location_id']) ? (int)$_GET['location_id'] : null;
        $rows = $this->menuModel->list($activeOnly, $locationId);
        $this->success($rows);
    }

    // POST /api/storefront/menus/create
    public function create() {
        $this->requirePermission('ecommerce.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        
        if (empty($data['label'])) $this->error('Label is required', 400);
        
        $newId = $this->menuModel->create($data);
        if ($newId) {
            $this->success(['id' => (int)$newId], 'Menu item created');
        }
        $this->error('Failed to create menu item');
    }

    // POST /api/storefront/menus/update/1
    public function update($id = null) {
        $this->requirePermission('ecommerce.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);
        if (!$id) $this->error('ID required', 400);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        
        if (empty($data['label'])) $this->error('Label is required', 400);
        
        if ($this->menuModel->update($id, $data)) {
            $this->success(null, 'Menu item updated');
        }
        $this->error('Failed to update menu item');
    }

    // DELETE /api/storefront/menus/delete/1
    public function delete($id = null) {
        $this->requirePermission('ecommerce.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') $this->error('Method Not Allowed', 405);
        if (!$id) $this->error('ID required', 400);
        
        if ($this->menuModel->delete($id)) {
            $this->success(null, 'Menu item deleted');
        }
        $this->error('Failed to delete menu item');
    }

    // POST /api/storefront/menus/sort
    public function sort() {
        $this->requirePermission('ecommerce.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $items = $data['items'] ?? [];
        
        if ($this->menuModel->updateSort($items)) {
            $this->success(null, 'Sort order updated');
        }
        $this->error('Failed to update sort order');
    }
}
