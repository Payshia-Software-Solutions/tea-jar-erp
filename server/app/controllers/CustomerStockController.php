<?php
/**
 * CustomerStockController
 */
class CustomerStockController extends Controller {
    private $stockModel;

    public function __construct() {
        $this->stockModel = $this->model('CustomerStock');
    }

    public function get($customerId) {
        $this->requirePermission('customers.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        $stocks = $this->stockModel->getByCustomerId($customerId);
        $this->success($stocks);
    }

    public function update($id) {
        $this->requirePermission('customers.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (!isset($data['quantity']) && !isset($data['sold_qty'])) {
            $this->error('Quantity or Sold Quantity is required', 400);
            return;
        }

        if ($this->stockModel->update($id, $data)) {
            $this->success(['message' => 'Stock updated successfully']);
        } else {
            $this->error('Failed to update stock', 500);
        }
    }

    public function delete($id) {
        $this->requirePermission('customers.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            $this->error('Method Not Allowed', 405);
            return;
        }

        if ($this->stockModel->delete($id)) {
            $this->success(['message' => 'Stock deleted successfully']);
        } else {
            $this->error('Failed to delete stock', 500);
        }
    }
}
