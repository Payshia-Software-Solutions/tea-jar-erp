<?php
/**
 * Public Coupon Controller
 */
class PubliccouponController extends Controller {
    private $couponModel;
    private $apiClientModel;

    public function __construct() {
        $this->couponModel = $this->model('Coupon');
        $this->apiClientModel = $this->model('ApiClient');
    }

    private function handlePublicCors() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: X-API-Key, Content-Type');
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            if (!empty($apiKey) && !empty($origin) && $this->apiClientModel->validate($apiKey, $origin)) {
                header('Access-Control-Allow-Origin: ' . $origin);
            } else {
                header('Access-Control-Allow-Origin: *');
            }
            http_response_code(204);
            exit;
        }
        if (!empty($origin) && !empty($apiKey) && $this->apiClientModel->validate($apiKey, $origin)) {
            header('Access-Control-Allow-Origin: ' . $origin);
        } else {
            header('Access-Control-Allow-Origin: *');
        }
    }

    public function validate() {
        $this->handlePublicCors();
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if (!$this->apiClientModel->validate($apiKey, $origin)) {
            $this->error('Unauthorized', 403);
        }

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        $code = $data['code'] ?? '';
        $subtotal = $data['subtotal'] ?? 0;
        $customerId = $data['customer_id'] ?? null;

        if (empty($code)) $this->error('Coupon code is required', 400);

        $result = $this->couponModel->validate($code, $subtotal, $customerId);
        
        if ($result['valid']) {
            $this->success([
                'code' => $result['coupon']->code,
                'discount_amount' => $result['discount_amount'],
                'discount_type' => $result['coupon']->discount_type,
                'discount_value' => $result['coupon']->discount_value
            ]);
        } else {
            $this->error($result['message'], 400);
        }
    }
}
