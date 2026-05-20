<?php
class PrinterController extends Controller {
    public function __construct() {
        $this->printerModel = $this->model('PrinterSetting');
    }

    public function get_settings() {
        $location_id = $_GET['location_id'] ?? null;
        $settings = $this->printerModel->getSettings($location_id);
        echo json_encode(['success' => true, 'data' => $settings]);
    }

    public function save_settings() {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            echo json_encode(['success' => false, 'message' => 'Invalid data']);
            return;
        }

        foreach ($data['settings'] as $setting) {
            $this->printerModel->updateOrInsert([
                'location_id' => $data['location_id'],
                'printer_type' => $setting['printer_type'],
                'printer_name' => $setting['printer_name'],
                'paper_width' => $setting['paper_width'] ?? '80mm'
            ]);
        }

        echo json_encode(['success' => true, 'message' => 'Printer settings saved']);
    }
}
