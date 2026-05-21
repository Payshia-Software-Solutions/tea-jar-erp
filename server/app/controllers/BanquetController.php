<?php
/**
 * BanquetController - Manage banquet halls and bookings
 */
class BanquetController extends Controller {
    private $hallModel;
    private $bookingModel;
    private $invoiceModel;
    private $menuModel;
    private $resourceModel;
    private $staffModel;

    public function __construct() {
        $this->hallModel = $this->model('BanquetHall');
        $this->bookingModel = $this->model('BanquetBooking');
        $this->invoiceModel = $this->model('Invoice');
        $this->menuModel = $this->model('BanquetMenu');
        $this->resourceModel = $this->model('BanquetResource');
        $this->staffModel = $this->model('BanquetStaffAssignment');
    }

    public function staff($id = null) {
        $this->requirePermission('orders.read');
        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'POST') {
            $this->requirePermission('orders.write');
            $data = json_decode(file_get_contents('php://input'), true);
            $newId = $this->staffModel->create($data);
            if ($newId) $this->success(['id' => $newId], 'Staff assigned to event');
            else $this->error('Failed to assign staff');
        } elseif ($method === 'DELETE' && $id) {
            $this->requirePermission('orders.write');
            if ($this->staffModel->delete($id)) $this->success(null, 'Staff assignment removed');
            else $this->error('Failed to remove assignment');
        } else {
            $bookingId = $_GET['booking_id'] ?? null;
            if ($bookingId) {
                $this->success($this->staffModel->getByBooking($bookingId));
            } else {
                $this->error('Booking ID required');
            }
        }
    }

    public function get_employees() {
        $this->requirePermission('orders.read');
        // Fetch employees from the HR table directly
        $db = new Database();
        $db->query("SELECT id, name, employee_id as code, designation FROM employees WHERE status = 'Active' ORDER BY name ASC");
        $employees = $db->resultSet();
        $this->success($employees);
    }

    public function resources($id = null) {
        $this->requirePermission('orders.read');
        $method = $_SERVER['REQUEST_METHOD'];
        if ($method === 'POST') {
            $this->requirePermission('orders.write');
            $data = json_decode(file_get_contents('php://input'), true);
            if ($this->resourceModel->create($data)) $this->success(null, 'Resource created');
        } elseif ($method === 'PUT' && $id) {
            $this->requirePermission('orders.write');
            $data = json_decode(file_get_contents('php://input'), true);
            if ($this->resourceModel->update($id, $data)) $this->success(null, 'Resource updated');
        } elseif ($method === 'DELETE' && $id) {
            $this->requirePermission('orders.write');
            if ($this->resourceModel->delete($id)) $this->success(null, 'Resource deleted');
        } else {
            $this->success($this->resourceModel->getAll($_GET['active'] ?? false));
        }
    }

    public function assignments($id = null) {
        $this->requirePermission('orders.read');
        $method = $_SERVER['REQUEST_METHOD'];
        if ($method === 'POST') {
            $this->requirePermission('orders.write');
            $data = json_decode(file_get_contents('php://input'), true);
            if ($this->resourceModel->assign($data)) $this->success(null, 'Resource/Vendor assigned to event');
        } elseif ($method === 'DELETE' && $id) {
            $this->requirePermission('orders.write');
            if ($this->resourceModel->removeAssignment($id)) $this->success(null, 'Assignment removed');
        } else {
            $bookingId = $_GET['booking_id'] ?? null;
            if ($bookingId) {
                $this->success($this->resourceModel->getAssignments($bookingId));
            } else {
                $this->error('Booking ID required');
            }
        }
    }

    public function menus($id = null) {
        $this->requirePermission('orders.read');
        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'POST') {
            $this->requirePermission('orders.write');
            $data = json_decode(file_get_contents('php://input'), true);
            $newId = $this->menuModel->create($data);
            if ($newId) $this->success(['id' => $newId], 'Menu created');
        } elseif ($method === 'PUT' && $id) {
            $this->requirePermission('orders.write');
            $data = json_decode(file_get_contents('php://input'), true);
            if ($this->menuModel->update($id, $data)) $this->success(null, 'Menu updated');
        } elseif ($method === 'DELETE' && $id) {
            $this->requirePermission('orders.write');
            if ($this->menuModel->delete($id)) $this->success(null, 'Menu deleted');
        } else {
            if ($id) {
                $menu = $this->menuModel->getById($id);
                $this->success($menu);
            } else {
                $menus = $this->menuModel->getAll($_GET['active'] ?? false);
                $this->success($menus);
            }
        }
    }

    public function menu_items($id = null) {
        $this->requirePermission('orders.read');
        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'POST') {
            $this->requirePermission('orders.write');
            $data = json_decode(file_get_contents('php://input'), true);
            if ($this->menuModel->addItem($data)) $this->success(null, 'Item added');
        } elseif ($method === 'DELETE' && $id) {
            $this->requirePermission('orders.write');
            if ($this->menuModel->removeItem($id)) $this->success(null, 'Item removed');
        } else {
            $menuId = $_GET['menu_id'] ?? null;
            if ($menuId) {
                $items = $this->menuModel->getItems($menuId);
                $this->success($items);
            } else {
                $this->error('Menu ID required');
            }
        }
    }

    public function halls($id = null) {
        $u = $this->requirePermission('orders.read');
        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'POST') {
            $this->requirePermission('orders.write');
            $data = json_decode(file_get_contents('php://input'), true);
            if ($this->hallModel->create($data)) {
                $this->success(null, 'Banquet hall created');
            }
        } elseif ($method === 'PUT' && $id) {
            $this->requirePermission('orders.write');
            $data = json_decode(file_get_contents('php://input'), true);
            if ($this->hallModel->update($id, $data)) {
                $this->success(null, 'Banquet hall updated');
            }
        } elseif ($method === 'DELETE' && $id) {
            $this->requirePermission('orders.write');
            if ($this->hallModel->delete($id)) {
                $this->success(null, 'Banquet hall deleted');
            }
        } else {
            $halls = $this->hallModel->getAll($_GET['location_id'] ?? 1);
            $this->success($halls);
        }
    }

    public function bookings($id = null) {
        $u = $this->requirePermission('orders.read');
        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'POST') {
            $this->requirePermission('orders.write');
            $data = json_decode(file_get_contents('php://input'), true);
            $data['userId'] = $u['sub'] ?? null;
            $newId = $this->bookingModel->create($data);
            if ($newId) {
                // Handle initial assignments
                if (!empty($data['assignments']) && is_array($data['assignments'])) {
                    foreach ($data['assignments'] as $assignment) {
                        $assignment['booking_id'] = $newId;
                        $this->resourceModel->assign($assignment);
                    }
                }
                $this->success(['id' => $newId], 'Banquet booking created');
            }
        } elseif ($method === 'PUT' && $id) {
            $this->requirePermission('orders.write');
            $data = json_decode(file_get_contents('php://input'), true);
            if ($this->bookingModel->update($id, $data)) {
                $this->success(null, 'Banquet booking updated');
            }
        } else {
            if ($id) {
                $booking = $this->bookingModel->getById($id);
                if ($booking) $this->success($booking);
                else $this->error('Booking not found', 404);
            } else {
                $bookings = $this->bookingModel->getAll($_GET);
                $this->success($bookings);
            }
        }
    }

    public function cancel_booking($id) {
        $u = $this->requirePermission('orders.write');
        $data = json_decode(file_get_contents('php://input'), true);
        $reason = $data['reason'] ?? 'Cancelled by user';
        if ($this->bookingModel->cancel($id, $reason, (int)$u['sub'])) {
            $this->success(null, 'Booking cancelled');
        } else {
            $this->error('Failed to cancel booking');
        }
    }

    public function generate_invoice($id) {
        $u = $this->requirePermission('invoices.write');
        $booking = $this->bookingModel->getById($id);
        if (!$booking || $booking->status === 'Cancelled' || $booking->status === 'Invoiced') {
            $this->error('Invalid booking status for invoicing');
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $db = new Database();
        $db->beginTransaction();
        try {
            // Standard invoice logic
            require_once '../app/helpers/DocumentSequenceHelper.php';
            $locId = $data['location_id'] ?? $booking->location_id ?? 1;
            $invoiceNo = DocumentSequenceHelper::getStandardDocNo('INV', $locId);

            $invoiceData = [
                'invoice_no' => $invoiceNo,
                'location_id' => $data['location_id'] ?? $booking->location_id ?? 1,
                'customer_id' => $booking->customer_id,
                'issue_date' => date('Y-m-d'),
                'subtotal' => $booking->total_amount,
                'tax_total' => 0,
                'grand_total' => $booking->total_amount,
                'order_type' => 'banquet',
                'userId' => $u['sub'] ?? null,
                'notes' => 'Invoice for Banquet Booking ' . $booking->booking_no,
                'banquet_booking_id' => $id
            ];

            $invoiceId = $this->invoiceModel->create($invoiceData);
            if (!$invoiceId) throw new Exception('Invoice creation failed');

            $items = [[
                'item_id' => null,
                'description' => "Banquet Hall: {$booking->hall_name} on {$booking->booking_date} ({$booking->session})",
                'item_type' => 'Service',
                'quantity' => 1,
                'unit_price' => $booking->total_amount,
                'line_total' => $booking->total_amount
            ]];

            $this->invoiceModel->addItems($invoiceId, $items, $u['sub'] ?? null);

            // Handle Payments
            $receiptModel = $this->model('PaymentReceipt');
            
            // 1. Apply Advance Payment
            if ($booking->advance_paid > 0) {
                $receiptModel->create([
                    'invoice_id' => $invoiceId,
                    'invoice_no' => $invoiceNo,
                    'customer_id' => $booking->customer_id,
                    'location_id' => $invoiceData['location_id'],
                    'amount' => $booking->advance_paid,
                    'payment_method' => 'Advance',
                    'payment_date' => date('Y-m-d'),
                    'notes' => 'Advance payment applied from booking ' . $booking->booking_no,
                    'created_by' => $u['sub']
                ]);
            }

            // 2. Record New Payment if provided
            if (!empty($data['payment_amount']) && $data['payment_amount'] > 0) {
                $receiptModel->create([
                    'invoice_id' => $invoiceId,
                    'invoice_no' => $invoiceNo,
                    'customer_id' => $booking->customer_id,
                    'location_id' => $invoiceData['location_id'],
                    'amount' => $data['payment_amount'],
                    'payment_method' => $data['payment_method'] ?? 'Cash',
                    'payment_date' => date('Y-m-d'),
                    'notes' => $data['payment_notes'] ?? 'Final payment at invoicing',
                    'reference_no' => $data['payment_reference'] ?? null,
                    'created_by' => $u['sub'],
                    'cheque' => $data['cheque'] ?? null // Support for cheque details if mode is Cheque
                ]);
            }

            // Update Booking Status
            $db->query("UPDATE banquet_bookings SET status = 'Invoiced', invoice_id = :inv WHERE id = :id");
            $db->bind(':inv', $invoiceId);
            $db->bind(':id', $id);
            $db->execute();

            $db->commit();
            $this->success(['invoice_id' => $invoiceId], 'Invoice generated and payments handled');
        } catch (Exception $e) {
            $db->rollBack();
            $this->error('Invoicing failed: ' . $e->getMessage());
        }
    }
}
