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
                            EmailHelper::send($email, $subject, $message);
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
                $itemDetailsText = "";
                $itemTableRowsVar = "";
                $rowColors = ['#ffffff', '#f8fafc'];
                $rowIdx = 0;

                // Insert items
                if (isset($data['items']) && is_array($data['items'])) {
                    $partModel = $this->model('Part');
                    foreach ($data['items'] as $item) {
                        $part = $partModel->getById($item['productId']);
                        $partName = $part ? $part->part_name : 'Unknown Product';
                        $price = $part ? $part->price : 0;
                        if ($part && $part->discount_type && $part->discount_value > 0) {
                            if ($part->discount_type === 'Percentage') {
                                $price = $price - ($price * ($part->discount_value / 100));
                            } else {
                                $price = $price - $part->discount_value;
                            }
                        }

                        $qty = (int)$item['qty'];
                        $itemTotal = $price * $qty;

                        $model->createOrderItem([
                            'kiosk_order_id' => $orderId,
                            'product_id' => $item['productId'],
                            'quantity' => $qty,
                            'price' => $price
                        ]);

                        $rowNum = $rowIdx + 1;
                        $bg = $rowColors[$rowIdx % 2];
                        $itemDetailsText .= "- {$partName} x{$qty} (Rs. " . number_format($price, 2) . ")\n";
                        $itemTableRowsVar .= "<tr style='background:{$bg};'>"
                            . "<td style='padding:12px 16px;font-size:13px;color:#64748b;'>{$rowNum}</td>"
                            . "<td style='padding:12px 16px;font-size:14px;font-weight:600;color:#0f172a;'>{$partName}</td>"
                            . "<td style='padding:12px 16px;font-size:14px;color:#0f172a;text-align:center;'>{$qty}</td>"
                            . "<td style='padding:12px 16px;font-size:14px;color:#64748b;text-align:right;'>Rs. " . number_format($price, 2) . "</td>"
                            . "<td style='padding:12px 16px;font-size:14px;font-weight:700;color:#1e40af;text-align:right;'>Rs. " . number_format($itemTotal, 2) . "</td>"
                            . "</tr>";
                        $rowIdx++;
                    }
                }

                // Check notifications
                require_once '../app/models/StorefrontSetting.php';
                require_once '../app/models/ServiceLocation.php';
                $settingsModel = new StorefrontSetting();
                $settings = $settingsModel->getAll($locationId);

                // Fetch location name
                $locModel = new ServiceLocation();
                $locationRow = $locModel->getById($locationId);
                $locationName = $locationRow ? ($locationRow->name ?? 'Kiosk') : 'Kiosk';

                $phoneNumber = $data['phoneNumber'] ?? '';
                $specialInstructions = $data['specialInstructions'] ?? '';
                $orderDate = date('d M Y, h:i A');
                $totalFormatted = number_format((float)$totalAmount, 2);
                $specialInstructionsBlock = !empty($specialInstructions)
                    ? "<tr><td style='padding:0 40px 24px 40px;'><div style='background:#fef9f0;border:1px solid #fcd34d;border-radius:10px;padding:16px 20px;'><div style='font-size:11px;font-weight:700;letter-spacing:1px;color:#92400e;text-transform:uppercase;margin-bottom:6px;'>📝 Special Instructions</div><div style='font-size:14px;color:#78350f;line-height:1.6;'>" . nl2br(htmlspecialchars($specialInstructions)) . "</div></div></td></tr>"
                    : '';

                if (!empty($settings['kiosk_notify_email_enabled']) && $settings['kiosk_notify_email_enabled'] === '1' && !empty($settings['kiosk_notify_email_addr'])) {
                    require_once '../app/helpers/EmailHelper.php';
                    $subject = "New Room Order: {$orderNo} | Room {$roomNumber}";

                    $message = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>New Kiosk Order</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
  <tr><td align="center">
    <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;text-align:center;">
          <div style="font-size:11px;font-weight:700;letter-spacing:3px;color:#94a3b8;text-transform:uppercase;margin-bottom:8px;">Room Service Order</div>
          <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:1px;">{$locationName}</div>
          <div style="margin-top:16px;display:inline-block;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:8px 20px;">
            <span style="font-size:14px;color:#e2e8f0;font-weight:600;">Order No: </span>
            <span style="font-size:14px;color:#60a5fa;font-weight:700;">{$orderNo}</span>
          </div>
          <div style="margin-top:8px;font-size:12px;color:#94a3b8;">{$orderDate}</div>
        </td>
      </tr>

      <!-- Alert Banner -->
      <tr>
        <td style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 40px;">
          <span style="font-size:13px;font-weight:700;color:#92400e;">🛎 New order received — Please action immediately</span>
        </td>
      </tr>

      <!-- Customer Info -->
      <tr>
        <td style="padding:28px 40px 0 40px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#94a3b8;text-transform:uppercase;margin-bottom:14px;">Guest Information</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding-bottom:12px;vertical-align:top;">
                <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Guest Name</div>
                <div style="font-size:16px;font-weight:700;color:#0f172a;">{$guestName}</div>
              </td>
              <td width="50%" style="padding-bottom:12px;vertical-align:top;">
                <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Room Number</div>
                <div style="font-size:16px;font-weight:700;color:#0f172a;">🚪 Room {$roomNumber}</div>
              </td>
            </tr>
            <tr>
              <td width="50%" style="vertical-align:top;">
                <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Contact</div>
                <div style="font-size:15px;font-weight:600;color:#0f172a;">{$phoneNumber}</div>
              </td>
              <td width="50%" style="vertical-align:top;">
                <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Location</div>
                <div style="font-size:15px;font-weight:600;color:#0f172a;">📍 {$locationName}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Divider -->
      <tr><td style="padding:20px 40px 0 40px;"><hr style="border:none;border-top:1px solid #e2e8f0;"></td></tr>

      <!-- Order Items Table -->
      <tr>
        <td style="padding:20px 40px 0 40px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#94a3b8;text-transform:uppercase;margin-bottom:14px;">Order Items</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="text-align:left;padding:12px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">#</th>
                <th style="text-align:left;padding:12px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Item</th>
                <th style="text-align:center;padding:12px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Qty</th>
                <th style="text-align:right;padding:12px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Unit Price</th>
                <th style="text-align:right;padding:12px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {$itemTableRowsVar}
            </tbody>
          </table>
        </td>
      </tr>

      <!-- Total -->
      <tr>
        <td style="padding:0 40px 20px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:16px;background:#0f172a;border-radius:0 0 10px 10px;text-align:right;">
                <span style="font-size:13px;color:#94a3b8;font-weight:600;margin-right:16px;">TOTAL AMOUNT</span>
                <span style="font-size:20px;font-weight:800;color:#60a5fa;">Rs. {$totalFormatted}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Special Instructions -->
      {$specialInstructionsBlock}

      <!-- Footer -->
      <tr>
        <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
          <div style="font-size:12px;color:#94a3b8;">This is an automated notification from <strong style="color:#64748b;">{$locationName} Room Service System</strong></div>
          <div style="font-size:11px;color:#cbd5e1;margin-top:4px;">Please do not reply directly to this email.</div>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>
HTML;

                    $emails = array_map('trim', explode(',', $settings['kiosk_notify_email_addr']));
                    foreach ($emails as $email) {
                        if (!empty($email)) {
                            EmailHelper::send($email, $subject, $message);
                        }
                    }
                }

                if (!empty($settings['kiosk_notify_sms_enabled']) && $settings['kiosk_notify_sms_enabled'] === '1' && !empty($settings['kiosk_notify_sms_phone'])) {
                    require_once '../app/helpers/SmsHelper.php';

                    $msg = "New Order: {$orderNo}\n";
                    $msg .= "Location: {$locationName}\n";
                    $msg .= "Room: {$roomNumber}\n";
                    $msg .= "Guest: {$guestName}";
                    if (!empty($phoneNumber)) $msg .= " | Tel: {$phoneNumber}";
                    $msg .= "\n---\n";
                    if (!empty($itemDetailsText)) {
                        $msg .= trim($itemDetailsText) . "\n";
                    }
                    $msg .= "---\nTotal: Rs. " . number_format($totalAmount, 2);
                    if (!empty($specialInstructions)) {
                        $msg .= "\nNote: " . $specialInstructions;
                    }

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
            $status = $_GET['status'] ?? null;
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            if ($status === 'All') $status = null;
            $orders = $model->getAllOrders($status, $page, $limit);
            echo json_encode($orders);
        } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'PATCH') {
            // Update status
            $data = json_decode(file_get_contents('php://input'), true);
            $actualId = is_numeric($action) ? $action : $id;
            if ($actualId && isset($data['status'])) {
                $orderRow = $model->getOrderById($actualId);
                $ok = $model->updateStatus($actualId, $data['status']);
                
                if ($ok && $orderRow && $orderRow->status !== $data['status']) {
                    require_once '../app/models/StorefrontSetting.php';
                    $settingsModel = new StorefrontSetting();
                    $settings = $settingsModel->getAll(1); // Default location

                    if (!empty($settings['kiosk_notify_email_enabled']) && $settings['kiosk_notify_email_enabled'] === '1' && !empty($settings['kiosk_notify_email_addr'])) {
                        require_once '../app/helpers/EmailHelper.php';
                        $orderNo = $orderRow->order_no;
                        $roomNumber = $orderRow->room_number;
                        
                        // Exact same subject as before to thread in Gmail
                        $subject = "🛎 New Room Order: {$orderNo} | Room {$roomNumber}";
                        
                        $statusBadgeColor = '#f59e0b';
                        if ($data['status'] === 'Delivered') $statusBadgeColor = '#10b981';
                        if ($data['status'] === 'Cancelled') $statusBadgeColor = '#ef4444';
                        if ($data['status'] === 'Preparing') $statusBadgeColor = '#3b82f6';
                        
                        $message = <<<HTML
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
  <tr><td align="center">
    <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:24px 40px;border-bottom:1px solid #e2e8f0;background:#f8fafc;">
            <div style="font-size:14px;color:#64748b;margin-bottom:8px;">Order Status Update</div>
            <div style="font-size:20px;font-weight:700;color:#0f172a;">Order {$orderNo} is now <span style="color:{$statusBadgeColor};">{$data['status']}</span></div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 40px;">
          <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">
            The status of room service order <strong>{$orderNo}</strong> for Room <strong>{$roomNumber}</strong> has been updated to <strong>{$data['status']}</strong>.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>
HTML;
                        
                        $emails = array_map('trim', explode(',', $settings['kiosk_notify_email_addr']));
                        foreach ($emails as $email) {
                            if (!empty($email)) {
                                EmailHelper::send($email, $subject, $message);
                            }
                        }
                    }
                }
                
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
