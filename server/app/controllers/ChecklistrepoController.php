<?php
/**
 * Checklist Repository Controller (Global checklist templates)
 */
class ChecklistrepoController extends Controller {
    private $templateModel;
    private $auditModel;

    public function __construct() {
        $this->templateModel = $this->model('ChecklistTemplate');
        $this->auditModel = $this->model('AuditLog');
    }

    // GET /api/checklistrepo/list
    public function list() {
        $this->requirePermission('checklists.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        $this->success($this->templateModel->getAll());
    }

    // POST /api/checklistrepo/create
    public function create() {
        $u = $this->requirePermission('checklists.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        $description = trim((string)($data['description'] ?? ''));
        $mileage = isset($data['standard_mileage']) && $data['standard_mileage'] !== '' ? (int)$data['standard_mileage'] : null;
        $extendedDesc = trim((string)($data['extended_description'] ?? ''));

        if ($description === '') {
            $this->error('Description is required', 400);
            return;
        }
        $ok = $this->templateModel->create($description, $mileage, $extendedDesc, (int)$u['sub']);
        if ($ok) {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'action' => 'create',
                'entity' => 'checklist_template',
                'entity_id' => null,
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['description' => $description]),
            ]);
            $this->success(null, 'Template created');
        } else {
            $this->error('Failed to create template');
        }
    }

    // POST /api/checklistrepo/update/{id}
    public function update($id = null) {
        $u = $this->requirePermission('checklists.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }
        if (!$id) {
            $this->error('Template ID required', 400);
            return;
        }
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        $description = trim((string)($data['description'] ?? ''));
        $mileage = isset($data['standard_mileage']) && $data['standard_mileage'] !== '' ? (int)$data['standard_mileage'] : null;
        $extendedDesc = trim((string)($data['extended_description'] ?? ''));

        if ($description === '') {
            $this->error('Description is required', 400);
            return;
        }
        $ok = $this->templateModel->update($id, $description, $mileage, $extendedDesc, (int)$u['sub']);
        if ($ok) {
            $this->success(null, 'Template updated');
        } else {
            $this->error('Failed to update template');
        }
    }

    // DELETE /api/checklistrepo/delete/{id}
    public function delete($id = null) {
        $u = $this->requirePermission('checklists.write');
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
            $this->error('Template ID required', 400);
            return;
        }
        $ok = $this->templateModel->delete($id);
        if ($ok) {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'action' => 'delete',
                'entity' => 'checklist_template',
                'entity_id' => (int)$id,
                'method' => $method,
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => null,
            ]);
            $this->success(null, 'Template deleted');
        } else {
            $this->error('Failed to delete template');
        }
    }
}
