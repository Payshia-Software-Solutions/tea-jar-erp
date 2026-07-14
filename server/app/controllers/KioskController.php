<?php
class KioskController extends Controller {
    public function __construct() {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-API-Key');
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
        header('Content-Type: application/json');
    }

    public function bookings($action = 'index', $id = null) {
        $model = $this->model('KioskBooking');

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            // Create a new booking
            $data = json_decode(file_get_contents('php://input'), true);
            $bookingNo = 'KB-' . time() . rand(100, 999);
            $bookingId = $model->create([
                'booking_no' => $bookingNo,
                'room_number' => $data['room_number'] ?? '',
                'guest_name' => $data['guest_name'] ?? '',
                'experience_id' => $data['experience_id'] ?? 0,
                'pax_count' => $data['pax_count'] ?? 1,
                'preferred_date_time' => $data['preferred_date_time'] ?? null,
                'total_amount' => $data['total_amount'] ?? 0,
                'status' => 'Pending',
                'notes' => $data['notes'] ?? ''
            ]);

            if ($bookingId) {
                // Check notifications
                require_once '../app/models/StorefrontSetting.php';
                $settingsModel = new StorefrontSetting();
                $settings = $settingsModel->getAll();

                if (!empty($settings['kiosk_notify_email_enabled']) && $settings['kiosk_notify_email_enabled'] === '1' && !empty($settings['kiosk_notify_email_addr'])) {
                    require_once '../app/helpers/EmailHelper.php';
                    $subject = "New Kiosk Booking: {$bookingNo}";
                    $message = "A new experience booking ($bookingNo) was placed by {$data['guest_name']} for Room {$data['room_number']}.<br><br>Total: Rs. {$data['total_amount']}<br>Date/Time: {$data['preferred_date_time']}";
                    
                    $emails = array_map('trim', explode(',', $settings['kiosk_notify_email_addr']));
                    foreach ($emails as $email) {
                        if (!empty($email)) {
                            EmailHelper::sendGlobalEmail($email, $subject, $message);
                        }
                    }
                }

                if (!empty($settings['kiosk_notify_sms_enabled']) && $settings['kiosk_notify_sms_enabled'] === '1' && !empty($settings['kiosk_notify_sms_phone'])) {
                    require_once '../app/helpers/SmsHelper.php';
                    $msg = "New Kiosk Booking: {$bookingNo} from Room {$data['room_number']}. Total: Rs. {$data['total_amount']}";
                    
                    $phones = array_map('trim', explode(',', $settings['kiosk_notify_sms_phone']));
                    foreach ($phones as $phone) {
                        if (!empty($phone)) {
                            SmsHelper::send($phone, $msg);
                        }
                    }
                }

                echo json_encode(['success' => true, 'booking_id' => $bookingId, 'booking_no' => $bookingNo]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to create booking']);
            }
        } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
            // Get all bookings (for Admin)
            $bookings = $model->getAllBookings();
            echo json_encode($bookings);
        } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'PATCH') {
            // Update status
            $data = json_decode(file_get_contents('php://input'), true);
            $actualId = is_numeric($action) ? $action : $id;
            if ($actualId && isset($data['status'])) {
                $ok = $model->updateStatus($actualId, $data['status']);
                echo json_encode(['success' => $ok]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid data']);
            }
        }
    }

    public function orders($action = 'index', $id = null) {
        $model = $this->model('KioskOrder');

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            // Create a new order
            $data = json_decode(file_get_contents('php://input'), true);
            $orderNo = 'KO-' . time() . rand(100, 999);
            
            $guestName = $data['guestName'] ?? $data['name'] ?? '';
            $roomNumber = $data['roomNumber'] ?? '';
            $totalAmount = $data['totalAmount'] ?? 0;
            $locationId = isset($data['locationId']) ? (int)$data['locationId'] : 1;

            $orderId = $model->createOrder([
                'order_no' => $orderNo,
                'room_number' => $roomNumber,
                'guest_name' => $guestName,
                'phone_number' => $data['phoneNumber'] ?? '',
                'special_instructions' => $data['specialInstructions'] ?? '',
                'total_amount' => $totalAmount,
                'status' => 'Pending'
            ]);

            if ($orderId) {
                // Insert items
                if (isset($data['items']) && is_array($data['items'])) {
                    $partModel = $this->model('Part');
                    foreach ($data['items'] as $item) {
                        $part = $partModel->getById($item['productId']);
                        $price = $part ? $part->price : 0;
                        if ($part && $part->discount_type && $part->discount_value > 0) {
                            if ($part->discount_type === 'Percentage') {
                                $price = $price - ($price * ($part->discount_value / 100));
                            } else {
                                $price = $price - $part->discount_value;
                            }
                        }

                        $model->createOrderItem([
                            'kiosk_order_id' => $orderId,
                            'product_id' => $item['productId'],
                            'quantity' => $item['qty'],
                            'price' => $price
                        ]);
                    }
                }

                // Check notifications
                require_once '../app/models/StorefrontSetting.php';
                $settingsModel = new StorefrontSetting();
                $settings = $settingsModel->getAll($locationId);

                if (!empty($settings['kiosk_notify_email_enabled']) && $settings['kiosk_notify_email_enabled'] === '1' && !empty($settings['kiosk_notify_email_addr'])) {
                    require_once '../app/helpers/EmailHelper.php';
                    $subject = "New Kiosk Order: {$orderNo}";
                    $message = "A new room order ($orderNo) was placed by {$guestName} for Room {$roomNumber}.<br><br>Total: Rs. {$totalAmount}";
                    
                    $emails = array_map('trim', explode(',', $settings['kiosk_notify_email_addr']));
                    foreach ($emails as $email) {
                        if (!empty($email)) {
                            EmailHelper::sendGlobalEmail($email, $subject, $message);
                        }
                    }
                }

                if (!empty($settings['kiosk_notify_sms_enabled']) && $settings['kiosk_notify_sms_enabled'] === '1' && !empty($settings['kiosk_notify_sms_phone'])) {
                    require_once '../app/helpers/SmsHelper.php';
                    $msg = "New Kiosk Order: {$orderNo} from Room {$roomNumber}. Total: Rs. {$totalAmount}";
                    
                    $phones = array_map('trim', explode(',', $settings['kiosk_notify_sms_phone']));
                    foreach ($phones as $phone) {
                        if (!empty($phone)) {
                            SmsHelper::send($phone, $msg);
                        }
                    }
                }

                echo json_encode(['success' => true, 'order_id' => $orderId, 'order_no' => $orderNo]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to create order']);
            }
        } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
            // Get all orders (for Admin)
            $orders = $model->getAllOrders();
            echo json_encode($orders);
        } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'PATCH') {
            // Update status
            $data = json_decode(file_get_contents('php://input'), true);
            $actualId = is_numeric($action) ? $action : $id;
            if ($actualId && isset($data['status'])) {
                $ok = $model->updateStatus($actualId, $data['status']);
                echo json_encode(['success' => $ok]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid data']);
            }
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
    }

    public function locations() {
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $db = new Database;
            $db->query("SELECT id, name FROM service_locations WHERE is_pos_active = 1");
            $locations = $db->resultSet();
            echo json_encode($locations);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
    }
}
