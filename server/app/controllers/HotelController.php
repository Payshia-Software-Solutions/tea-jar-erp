<?php
/**
 * HotelController - Manage rooms, types, and reservations
 */
class HotelController extends Controller {
    private $roomModel;
    private $typeModel;
    private $resModel;
    private $invoiceModel;

    public function __construct() {
        $this->roomModel = $this->model('Room');
        $this->typeModel = $this->model('RoomType');
        $this->resModel = $this->model('Reservation');
        $this->invoiceModel = $this->model('Invoice');
    }

    public function room_rack() {
        $u = $this->requirePermission('orders.read'); // Using orders perm for now
        $locationId = $_GET['location_id'] ?? 1;
        $rooms = $this->roomModel->getAll($locationId);
        $this->success($rooms);
    }

    public function room_types($id = null) {
        $u = $this->requirePermission('parts.read');
        $method = $_SERVER['REQUEST_METHOD'];
        
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            if ($this->typeModel->create($data)) {
                $this->success(null, 'Room type created');
            }
        } elseif ($method === 'PUT' && $id) {
            $data = json_decode(file_get_contents('php://input'), true);
            if ($this->typeModel->update($id, $data)) {
                $this->success(null, 'Room type updated');
            }
        } elseif ($method === 'DELETE' && $id) {
            if ($this->typeModel->delete($id)) {
                $this->success(null, 'Room type deleted');
            }
        } else {
            $types = $this->typeModel->getAll();
            $this->success($types);
        }
    }

    public function rooms($id = null) {
        $u = $this->requirePermission('parts.read');
        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            if ($this->roomModel->create($data)) {
                $this->success(null, 'Room created');
            }
        } elseif ($method === 'PUT' && $id) {
            $data = json_decode(file_get_contents('php://input'), true);
            if ($this->roomModel->update($id, $data)) {
                $this->success(null, 'Room updated');
            }
        } elseif ($method === 'DELETE' && $id) {
            if ($this->roomModel->delete($id)) {
                $this->success(null, 'Room deleted');
            }
        } else {
            $rooms = $this->roomModel->getAll($_GET['location_id'] ?? 1);
            $this->success($rooms);
        }
    }

    public function reservations() {
        $u = $this->requirePermission('orders.read');
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $data['userId'] = $u['sub'] ?? null;
            $id = $this->resModel->create($data);
            if ($id) {
                $this->success(['id' => $id], 'Reservation created');
            }
        } else {
            $res = $this->resModel->getAll($_GET);
            $this->success($res);
        }
    }

    public function reservation($id) {
        $u = $this->requirePermission('orders.read');
        $res = $this->resModel->getById($id);
        if ($res) {
            $this->success($res);
        } else {
            $this->error('Reservation not found', 404);
        }
    }

    public function check_in($id) {
        $u = $this->requirePermission('orders.write');
        if ($this->resModel->checkIn($id)) {
            $this->success(null, 'Guest checked in successfully');
        } else {
            $this->error('Check-in failed');
        }
    }

    public function check_out($id) {
        $u = $this->requirePermission('invoices.write');
        $res = $this->resModel->getById($id);
        if (!$res || $res->status !== 'CheckedIn') {
            $this->error('Invalid reservation status for check-out');
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $extraItems = $this->resModel->getItems($id);
        $extraTotal = 0;
        foreach ($extraItems as $ei) {
            $extraTotal += $ei->total_price;
        }

        // Transaction for check-out and invoice
        $db = new Database();
        $db->beginTransaction();
        try {
            // 1. Generate Standard Invoice Number
            require_once '../app/helpers/DocumentSequenceHelper.php';
            $invoiceNo = DocumentSequenceHelper::getStandardDocNo('INV', $res->location_id ?? 1);

            $invoiceData = [
                'invoice_no' => $invoiceNo,
                'location_id' => $res->location_id,
                'customer_id' => $res->customer_id,
                'issue_date' => date('Y-m-d'),
                'subtotal' => $res->total_amount + $extraTotal,
                'tax_total' => $input['tax_total'] ?? 0,
                'grand_total' => $res->total_amount + $extraTotal + ($input['tax_total'] ?? 0),
                'order_type' => 'hotel',
                'userId' => $u['sub'] ?? null,
                'notes' => 'Checkout for Reservation ' . $res->reservation_no,
                'reservation_id' => $id
            ];

            $invoiceId = $this->invoiceModel->create($invoiceData);
            if (!$invoiceId) throw new Exception('Invoice creation failed');

            // 2. Add Room Line Item
            $checkIn = new DateTime($res->check_in);
            $checkOut = new DateTime($res->check_out);
            $nights = $checkIn->diff($checkOut)->days || 1;
            
            $items = [[
                'item_id' => $res->type_item_id,
                'description' => "Room {$res->room_number} ({$res->room_type}) - {$res->meal_plan} - {$nights} Night(s)",
                'item_type' => 'Service',
                'quantity' => 1,
                'unit_price' => $res->total_amount,
                'line_total' => $res->total_amount
            ]];

            // Add Extra items with correct item types from master
            foreach ($extraItems as $ei) {
                $itemType = 'Service';
                if ($ei->item_id) {
                    $db->query("SELECT item_type FROM parts WHERE id = :pid");
                    $db->bind(':pid', $ei->item_id);
                    $p = $db->single();
                    if ($p) $itemType = $p->item_type;
                }

                $items[] = [
                    'item_id' => $ei->item_id,
                    'description' => $ei->description,
                    'item_type' => $itemType,
                    'quantity' => $ei->quantity,
                    'unit_price' => $ei->unit_price,
                    'line_total' => $ei->total_price
                ];
            }

            $this->invoiceModel->addItems($invoiceId, $items, $u['sub'] ?? null);

            // 3. Automated Accounting Posting (SAP/Odoo Standard)
            require_once '../app/helpers/AccountingHelper.php';
            AccountingHelper::postInvoice($invoiceId);

            // 3. Update Reservation
            $db->query("UPDATE hotel_reservations SET status = 'CheckedOut', invoice_id = :inv WHERE id = :id");
            $db->bind(':inv', $invoiceId);
            $db->bind(':id', $id);
            $db->execute();

            // 4. Update Room Status (Mark as Dirty)
            $db->query("UPDATE hotel_rooms SET status = 'Dirty' WHERE id = :room_id");
            $db->bind(':room_id', $res->room_id);
            $db->execute();

            $db->commit();
            
            // Get full invoice details for payment recording
            $invoice = $this->invoiceModel->getById($invoiceId);
            
            $this->success([
                'invoice_id' => $invoiceId,
                'invoice_no' => $invoice->invoice_no,
                'customer_id' => $res->customer_id,
                'customer_name' => $res->customer_name,
                'location_id' => $res->location_id
            ], 'Check-out completed and invoice generated');
        } catch (Exception $e) {
            $db->rollBack();
            $this->error('Check-out failed: ' . $e->getMessage());
        }
    }

    public function update_reservation($id) {
        $u = $this->requirePermission('orders.write');
        $data = json_decode(file_get_contents('php://input'), true);
        if ($this->resModel->update($id, $data)) {
            $this->success(null, 'Reservation updated');
        } else {
            $this->error('Update failed');
        }
    }

    public function items($id) {
        $u = $this->requirePermission('orders.read');
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            if ($this->resModel->addItem($id, $data)) {
                $this->success(null, 'Item added');
            }
        } else {
            $items = $this->resModel->getItems($id);
            $this->success($items);
        }
    }

    public function remove_item($id) {
        $this->requirePermission('orders.write');
        if ($this->resModel->removeItem($id)) {
            $this->success(null, 'Item removed');
        }
    }

    public function items_bulk($id) {
        $this->requirePermission('orders.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);
        
        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['items'])) {
            $this->error('No items provided');
        }

        if ($this->resModel->addItemsBulk($id, $data['items'])) {
            $this->success(null, 'Items added to reservation bill');
        } else {
            $this->error('Failed to add items');
        }
    }

    public function room_type_rates($id) {
        $u = $this->requirePermission('orders.read');
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $this->requirePermission('orders.write');
            $data = json_decode(file_get_contents('php://input'), true);
            if ($this->typeModel->saveRates($id, $data['rates'] ?? [])) {
                $this->success(null, 'Rates saved');
            } else {
                $this->error('Failed to save rates');
            }
        } else {
            $rates = $this->typeModel->getRates($id);
            $this->success($rates);
        }
    }
    public function cancel_reservation($id = null) {
        $u = $this->requirePermission('orders.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);
        if (!$id) $this->error('Reservation ID required', 400);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $reason = $data['reason'] ?? 'Cancelled by user';

        if ($this->resModel->cancel($id, $reason, (int)$u['sub'])) {
            $this->success(null, 'Reservation cancelled successfully');
        } else {
            $this->error('Failed to cancel reservation');
        }
    }
}
