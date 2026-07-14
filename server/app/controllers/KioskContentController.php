<?php
/**
 * KioskContentController - Handles Kiosk rich content management
 */
class KioskContentController extends Controller {
    private $kioskContentModel;

    public function __construct() {
        $this->kioskContentModel = $this->model('KioskContent');
    }

    // GET /api/kioskcontent/list?q=
    public function list() {
        $u = $this->requirePermission('ecommerce.write'); // Or parts.read
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') $this->error('Method Not Allowed', 405);
        $q = $_GET['q'] ?? '';
        $rows = $this->kioskContentModel->listAll($q);
        $this->success($rows);
    }

    // GET /api/kioskcontent/get/1
    public function get($id = null) {
        $this->requirePermission('ecommerce.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') $this->error('Method Not Allowed', 405);
        if (!$id) $this->error('Content ID required', 400);
        $row = $this->kioskContentModel->getById($id);
        if (!$row) $this->error('Not found', 404);
        $this->success($row);
    }

    // GET /api/kioskcontent/getByPart/1
    public function getByPart($partId = null) {
        $this->requirePermission('ecommerce.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') $this->error('Method Not Allowed', 405);
        if (!$partId) $this->error('Part ID required', 400);
        $row = $this->kioskContentModel->getByPartId($partId);
        // If not found, return an empty object so the frontend knows it doesn't exist yet but doesn't error
        if (!$row) {
            $this->success(null);
            return;
        }
        $this->success($row);
    }

    // POST /api/kioskcontent/save
    public function save() {
        $u = $this->requirePermission('ecommerce.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);
        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        $id = $data['id'] ?? null;
        $payload = [
            'part_id' => !empty($data['part_id']) ? (int)$data['part_id'] : null,
            'title' => trim((string)($data['title'] ?? '')),
            'content_html' => trim((string)($data['content_html'] ?? '')),
            'video_url' => trim((string)($data['video_url'] ?? '')),
        ];

        if ($id) {
            $success = $this->kioskContentModel->update($id, $payload, (int)$u['sub']);
            if ($success) {
                $this->success(['id' => $id]);
            } else {
                $this->error('Failed to update content', 500);
            }
        } else {
            $newId = $this->kioskContentModel->create($payload, (int)$u['sub']);
            if ($newId) {
                $this->success(['id' => $newId]);
            } else {
                $this->error('Failed to create content', 500);
            }
        }
    }

    // POST /api/kioskcontent/delete/1
    public function delete($id = null) {
        $u = $this->requirePermission('ecommerce.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);
        if (!$id) $this->error('Content ID required', 400);
        
        $success = $this->kioskContentModel->delete($id);
        if ($success) {
            $this->success(['status' => 'success']);
        } else {
            $this->error('Failed to delete content', 500);
        }
    }
}
