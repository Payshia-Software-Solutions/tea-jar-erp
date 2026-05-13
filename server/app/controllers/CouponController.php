<?php
/**
 * Coupon Controller
 */
class CouponController extends Controller {
    private $couponModel;

    public function __construct() {
        $this->couponModel = $this->model('Coupon');
    }

    public function index() {
        $this->requirePermission('promotions.read');
        $coupons = $this->couponModel->getAll();
        $this->success($coupons);
    }

    public function get($id) {
        $this->requirePermission('promotions.read');
        $coupon = $this->couponModel->getById($id);
        if ($coupon) {
            $this->success($coupon);
        } else {
            $this->error('Coupon not found', 404);
        }
    }

    public function store() {
        $this->requirePermission('promotions.write');
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        if (empty($data['code'])) $this->error('Coupon code is required', 400);

        try {
            $id = $this->couponModel->create($data);
            if ($id) {
                $this->success(['id' => $id], 'Coupon created successfully');
            } else {
                $this->error('Failed to create coupon');
            }
        } catch (Exception $e) {
            $this->error($e->getMessage());
        }
    }

    public function update($id) {
        $this->requirePermission('promotions.write');
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        if ($this->couponModel->update($id, $data)) {
            $this->success(null, 'Coupon updated successfully');
        } else {
            $this->error('Failed to update coupon');
        }
    }

    public function delete($id) {
        $this->requirePermission('promotions.write');
        if ($this->couponModel->delete($id)) {
            $this->success(null, 'Coupon deleted successfully');
        } else {
            $this->error('Failed to delete coupon');
        }
    }

    public function usage($id) {
        $this->requirePermission('promotions.read');
        $logs = $this->couponModel->getUsageLogs($id);
        $this->success($logs);
    }
}
