<?php
/**
 * VehicleDocumentController
 */
class VehicleDocumentController extends Controller {
    private $documentModel;

    public function __construct() {
        $this->documentModel = $this->model('VehicleDocument');
    }

    public function list($vehicleId) {
        $this->requirePermission('vehicles.read');
        $status = isset($_GET['status']) ? $_GET['status'] : 'Active';
        $docs = $this->documentModel->getByVehicle($vehicleId, $status);
        $this->success($docs);
    }

    public function create() {
        $this->requirePermission('vehicles.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['vehicle_id']) || empty($data['document_type'])) {
            $this->error('Missing required fields');
            return;
        }

        if (empty($data['expiry_date'])) $data['expiry_date'] = null;

        // Archive previous active documents of same type (Renewal Logic)
        $this->documentModel->archiveByInfo($data['vehicle_id'], $data['document_type']);

        if ($this->documentModel->create($data)) {
            $this->success(null, 'Document added');
        } else {
            $this->error('Failed to add document');
        }
    }

    public function delete($id) {
        $this->requirePermission('vehicles.write');
        if ($this->documentModel->delete($id)) {
            $this->success(null, 'Document removed');
        } else {
            $this->error('Failed to remove document');
        }
    }

    public function expiring() {
        $this->requirePermission('vehicles.read');
        $days = $_GET['days'] ?? 30;
        $docs = $this->documentModel->getExpiring((int)$days);
        $this->success($docs);
    }
}
