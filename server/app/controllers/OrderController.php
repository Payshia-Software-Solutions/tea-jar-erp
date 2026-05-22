<?php
/**
 * Order Controller
 * Handles Repair Order API requests.
 */

class OrderController extends Controller {
    private $orderModel;
    private $orderPartModel;
    private $auditModel;

    public function __construct() {
        $this->orderModel = $this->model('Order');
        $this->orderPartModel = $this->model('OrderPart');
        $this->auditModel = $this->model('AuditLog');
    }

    // GET /api/order/list
    public function list() {
        $u = $this->requirePermission('orders.read');
        if ($_SERVER['REQUEST_METHOD'] == 'GET') {
            $locId = $this->currentLocationId($u);
            $orders = $this->orderModel->getOrdersByLocation($locId);
            $this->success($orders);
        } else {
            $this->error('Method Not Allowed', 405);
        }
    }

    // POST /api/order/create
    public function create() {
        $u = $this->requirePermission('orders.write');
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            // Get raw POST data
            $raw_data = file_get_contents('php://input');
            $data = json_decode($raw_data, true);

            // Accept both snake_case and camelCase payloads from the frontend.
            $customerName = $data['customer_name'] ?? $data['customerName'] ?? null;
            $vehicleModel = $data['vehicle_model'] ?? $data['vehicleModel'] ?? null;
            $problem = $data['problem_description'] ?? $data['problemDescription'] ?? null;

            $customerName = is_string($customerName) ? trim($customerName) : '';
            $vehicleModel = is_string($vehicleModel) ? trim($vehicleModel) : '';
            $problem = is_string($problem) ? trim($problem) : '';

            // Customer name is optional (order can be created for walk-in / internal vehicles).
            if ($customerName === '') {
                $customerName = 'Walk-in';
            }

            if ($vehicleModel === '' || $problem === '') {
                $this->error('Missing required fields', 400);
            }

            $payload = [
                'customer_name' => $customerName,
                'vehicle_model' => $vehicleModel,
                'problem_description' => $problem,
                'status' => $data['status'] ?? 'Pending',
                'vehicle_id' => $data['vehicle_id'] ?? $data['vehicleIdDb'] ?? null,
                'vehicle_identifier' => $data['vehicle_identifier'] ?? $data['vehicleId'] ?? null,
                'mileage' => $data['mileage'] ?? null,
                'priority' => $data['priority'] ?? null,
                'expected_time' => $data['expected_time'] ?? $data['expectedTime'] ?? null,
                'release_time' => $data['release_time'] ?? $data['releaseTime'] ?? null,
                'comments' => $data['comments'] ?? null,
                'location' => $data['location'] ?? null,
                'technician' => $data['technician'] ?? null,
                'from_location_id' => $data['from_location_id'] ?? null,
            ];

            // Store checklist/categories as JSON strings (TEXT columns).
            if (isset($data['categories']) && is_array($data['categories'])) {
                $payload['categories_json'] = json_encode(array_values($data['categories']));
            } elseif (isset($data['categories_json'])) {
                $payload['categories_json'] = $data['categories_json'];
            }
            if (isset($data['checklist']) && is_array($data['checklist'])) {
                $payload['checklist_json'] = json_encode(array_values($data['checklist']));
            } elseif (isset($data['checklist_json'])) {
                $payload['checklist_json'] = $data['checklist_json'];
            }
            if (isset($data['attachments']) && is_array($data['attachments'])) {
                $payload['attachments_json'] = json_encode(array_values($data['attachments']));
            } elseif (isset($data['attachments_json'])) {
                $payload['attachments_json'] = $data['attachments_json'];
            }

            $locId = $this->currentLocationId($u);
            if (!empty($data['to_location_id'])) {
                $locId = (int)$data['to_location_id'];
            }
            $newId = $this->orderModel->addOrder($payload, (int)$u['sub'], $locId);
            if ($newId) {
                $payload['id'] = (int)$newId;
                $this->auditModel->write([
                    'user_id' => (int)$u['sub'],
                    'location_id' => $locId,
                    'action' => 'create',
                    'entity' => 'repair_order',
                    'entity_id' => (int)$newId,
                    'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                    'path' => $_SERVER['REQUEST_URI'] ?? '',
                    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                    'details' => json_encode(['vehicle_model' => $vehicleModel, 'priority' => $payload['priority'] ?? null]),
                ]);
                $this->success($payload, 'Order created successfully');
            } else {
                $this->error('Failed to create order');
            }
        } else {
            $this->error('Method Not Allowed', 405);
        }
    }

    // GET /api/order/get/1
    public function get($id = null) {
        $u = $this->requirePermission('orders.read');
        if (!$id) {
            $this->error('Order ID required', 400);
        }

        $locId = $this->currentLocationId($u);
        $order = $this->orderModel->getOrderByIdInLocation($id, $locId);

        if ($order) {
            $this->success($order);
        } else {
            $this->error('Order not found', 404);
        }
    }

    // POST /api/order/update_status/1
    public function update_status($id = null) {
        $u = $this->requirePermission('orders.write');
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $raw_data = file_get_contents('php://input');
            $data = json_decode($raw_data, true);

            if (!$id || !isset($data['status'])) {
                $this->error('Missing required data', 400);
            }

            $locId = $this->currentLocationId($u);
            $newStatus = (string)$data['status'];
            if ($this->orderModel->updateStatus($id, $newStatus, (int)$u['sub'], $locId)) {
                // If the order is closed, release its bay if no other active orders remain.
                if (in_array($newStatus, ['Completed', 'Cancelled'], true)) {
                    try {
                        $db = new Database();
                        $db->query("SELECT location FROM repair_orders WHERE id = :id AND (location_id = :loc OR from_location_id = :loc) LIMIT 1");
                        $db->bind(':id', (int)$id);
                        $db->bind(':loc', $locId);
                        $row = $db->single();
                        $bay = $row ? trim((string)($row->location ?? '')) : '';
                        if ($bay !== '') {
                            $db->query("
                                SELECT COUNT(*) AS cnt
                                FROM repair_orders
                                WHERE location_id = :loc
                                  AND status IN ('Pending','In Progress')
                                  AND location = :bay
                            ");
                            $db->bind(':loc', $locId);
                            $db->bind(':bay', $bay);
                            $r2 = $db->single();
                            $cnt = (int)($r2->cnt ?? 0);
                            if ($cnt <= 0) {
                                $db->query("UPDATE service_bays SET status = 'Available', updated_by = :u WHERE name = :name AND location_id = :loc");
                                $db->bind(':u', (int)$u['sub']);
                                $db->bind(':name', $bay);
                                $db->bind(':loc', $locId);
                                $db->execute();
                            }
                        }
                    } catch (Exception $e) {
                        // ignore best-effort
                    }
                }
                $this->success(['id' => $id, 'status' => $data['status']], 'Status updated');
            } else {
                $this->error('Update failed');
            }
        } else {
            $this->error('Method Not Allowed', 405);
        }
    }

    // POST /api/order/update_release/1
    // Body: { release_time?: string|null }
    public function update_release($id = null) {
        $u = $this->requirePermission('orders.write');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            $this->error('Method Not Allowed', 405);
        }
        if (!$id) $this->error('Order ID required', 400);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $release = $data['release_time'] ?? $data['releaseTime'] ?? null;
        $release = $release === '' ? null : $release;

        $locId = $this->currentLocationId($u);
        $order = $this->orderModel->getOrderByIdInLocation((int)$id, $locId);
        if (!$order) $this->error('Order not found', 404);

        $db = new Database();
        $db->query("UPDATE repair_orders SET release_time = :release_time, updated_by = :u WHERE id = :id AND (location_id = :loc OR from_location_id = :loc)");
        $db->bind(':release_time', $release);
        $db->bind(':u', (int)$u['sub']);
        $db->bind(':id', (int)$id);
        $db->bind(':loc', $locId);
        if ($db->execute()) {
            $this->success(['id' => (int)$id, 'release_time' => $release], 'Release time updated');
        } else {
            $this->error('Update failed');
        }
    }

    // POST /api/order/update_details/1
    // Body: { categories?: Array, checklist?: Array }
    public function update_details($id = null) {
        $u = $this->requirePermission('orders.write');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            $this->error('Method Not Allowed', 405);
        }
        if (!$id) $this->error('Order ID required', 400);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $locId = $this->currentLocationId($u);

        $payload = [];
        if (isset($data['categories']) && is_array($data['categories'])) {
            $payload['categories_json'] = json_encode(array_values($data['categories']));
        }
        if (isset($data['checklist']) && is_array($data['checklist'])) {
            $payload['checklist_json'] = json_encode(array_values($data['checklist']));
        }

        if (empty($payload)) {
            $this->error('No fields to update', 400);
        }

        $setParts = [];
        foreach ($payload as $key => $val) {
            $setParts[] = "$key = :$key";
        }
        $setStr = implode(', ', $setParts);

        $db = new Database();
        $db->query("UPDATE repair_orders SET $setStr, updated_by = :u WHERE id = :id AND (location_id = :loc OR from_location_id = :loc)");
        foreach ($payload as $key => $val) {
            $db->bind(":$key", $val);
        }
        $db->bind(':u', (int)$u['sub']);
        $db->bind(':id', (int)$id);
        $db->bind(':loc', $locId);

        if ($db->execute()) {
            $this->success($payload, 'Order details updated');
        } else {
            $this->error('Update failed');
        }
    }

    // POST /api/order/complete/1
    // Body: { status?: "Completed", checklist_done?: Array, checklist_done_json?: string, completion_comments?: string }
    public function complete($id = null) {
        $u = $this->requirePermission('orders.write');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            $this->error('Method Not Allowed', 405);
        }
        if (!$id) $this->error('Order ID required', 400);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $status = isset($data['status']) ? trim((string)$data['status']) : 'Completed';
        if ($status === '') $status = 'Completed';

        $checklistDoneJson = null;
        if (isset($data['checklist_done_json'])) {
            $checklistDoneJson = $data['checklist_done_json'];
        } elseif (isset($data['checklist_done']) && is_array($data['checklist_done'])) {
            $checklistDoneJson = json_encode($data['checklist_done']);
        }

        $completionComments = isset($data['completion_comments']) ? trim((string)$data['completion_comments']) : null;

        $locId = $this->currentLocationId($u);
        $order = $this->orderModel->getOrderByIdInLocation((int)$id, $locId);
        if (!$order) $this->error('Order not found', 404);

        $db = new Database();
        try {
            $db->exec("START TRANSACTION");
            $db->query("
                UPDATE repair_orders
                SET status = :status,
                    checklist_done_json = :checklist_done_json,
                    completion_comments = :completion_comments,
                    completed_at = NOW(),
                    updated_by = :u
                WHERE id = :id AND (location_id = :loc OR from_location_id = :loc)
            ");
            $db->bind(':status', $status);
            $db->bind(':checklist_done_json', $checklistDoneJson);
            $db->bind(':completion_comments', $completionComments);
            $db->bind(':u', (int)$u['sub']);
            $db->bind(':id', (int)$id);
            $db->bind(':loc', $locId);
            $ok = $db->execute();
            if (!$ok) {
                $db->exec("ROLLBACK");
                $this->error('Update failed', 400);
            }

            // Release bay if no other active orders remain in that bay.
            if (in_array($status, ['Completed', 'Cancelled'], true)) {
                $db->query("SELECT location FROM repair_orders WHERE id = :id AND (location_id = :loc OR from_location_id = :loc) LIMIT 1");
                $db->bind(':id', (int)$id);
                $db->bind(':loc', $locId);
                $row = $db->single();
                $bay = $row ? trim((string)($row->location ?? '')) : '';
                if ($bay !== '') {
                    $db->query("
                        SELECT COUNT(*) AS cnt
                        FROM repair_orders
                        WHERE location_id = :loc
                          AND status IN ('Pending','In Progress')
                          AND location = :bay
                    ");
                    $db->bind(':loc', $locId);
                    $db->bind(':bay', $bay);
                    $r2 = $db->single();
                    $cnt = (int)($r2->cnt ?? 0);
                    if ($cnt <= 0) {
                        $db->query("UPDATE service_bays SET status = 'Available', updated_by = :u WHERE name = :name AND location_id = :loc");
                        $db->bind(':u', (int)$u['sub']);
                        $db->bind(':name', $bay);
                        $db->bind(':loc', $locId);
                        $db->execute();
                    }
                }
            }

            $db->exec("COMMIT");
        } catch (Exception $e) {
            try { $db->exec("ROLLBACK"); } catch (Exception $e2) {}
            $this->error('Update failed', 400);
        }

        $this->auditModel->write([
            'user_id' => (int)$u['sub'],
            'location_id' => $locId,
            'action' => 'update',
            'entity' => 'repair_order_complete',
            'entity_id' => (int)$id,
            'method' => $_SERVER['REQUEST_METHOD'] ?? '',
            'path' => $_SERVER['REQUEST_URI'] ?? '',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'details' => json_encode(['status' => $status]),
        ]);

        $this->success(['id' => (int)$id, 'status' => $status], 'Order completed');
    }

    // POST /api/order/assign/1
    // Body: { bay_id?: number, bay_name?: string, technician?: string, status?: string }
    // - bay is stored in repair_orders.location (bay name)
    // - technician stored in repair_orders.technician
    // - status defaults to "In Progress" when bay is set, otherwise "Pending"
    public function assign($id = null) {
        $u = $this->requirePermission('orders.write');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            $this->error('Method Not Allowed', 405);
        }
        if (!$id) $this->error('Order ID required', 400);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $bayId = isset($data['bay_id']) ? (int)$data['bay_id'] : (isset($data['bayId']) ? (int)$data['bayId'] : 0);
        $bayName = isset($data['bay_name']) ? trim((string)$data['bay_name']) : (isset($data['bay']) ? trim((string)$data['bay']) : '');
        $technician = isset($data['technician']) ? trim((string)$data['technician']) : '';
        $release = $data['release_time'] ?? $data['releaseTime'] ?? null;
        $release = $release === '' ? null : $release;
        $status = isset($data['status']) ? trim((string)$data['status']) : '';

        $locId = $this->currentLocationId($u);
        $order = $this->orderModel->getOrderByIdInLocation((int)$id, $locId);
        if (!$order) $this->error('Order not found', 404);

        $oldBay = trim((string)($order->location ?? ''));

        // Resolve bay name from bay_id if provided.
        if ($bayId > 0) {
            $db = new Database();
            $db->query("SELECT name FROM service_bays WHERE id = :id AND location_id = :loc LIMIT 1");
            $db->bind(':id', $bayId);
            $db->bind(':loc', $locId);
            $b = $db->single();
            if (!$b) $this->error('Invalid bay', 400);
            $bayName = trim((string)($b->name ?? ''));
        }

        // If a bay name is provided, ensure it exists in this location.
        if ($bayName !== '') {
            $db = new Database();
            $db->query("SELECT id FROM service_bays WHERE name = :name AND location_id = :loc LIMIT 1");
            $db->bind(':name', $bayName);
            $db->bind(':loc', $locId);
            $b2 = $db->single();
            if (!$b2) $this->error('Invalid bay', 400);

            // Prevent assigning to a bay already occupied by another active order.
            $db->query("
                SELECT COUNT(*) AS cnt
                FROM repair_orders
                WHERE location_id = :loc
                  AND status IN ('Pending','In Progress')
                  AND location = :bay
                  AND id <> :id
            ");
            $db->bind(':loc', $locId);
            $db->bind(':bay', $bayName);
            $db->bind(':id', (int)$id);
            $rowBusy = $db->single();
            if ((int)($rowBusy->cnt ?? 0) > 0) {
                $this->error('Bay is already occupied', 400);
            }
        }

        if ($status === '') {
            $status = ($bayName !== '') ? 'In Progress' : 'Pending';
        }

        // Persist assignment and update bay status using the SAME DB connection/transaction.
        $db = new Database();
        try {
            $db->exec("START TRANSACTION");

            // Lock the order row and capture old bay name inside the transaction.
            $db->query("SELECT location FROM repair_orders WHERE id = :id AND (location_id = :loc OR from_location_id = :loc) FOR UPDATE");
            $db->bind(':id', (int)$id);
            $db->bind(':loc', $locId);
            $rowOrder = $db->single();
            if (!$rowOrder) {
                $db->exec("ROLLBACK");
                $this->error('Order not found', 404);
            }
            $oldBay = trim((string)($rowOrder->location ?? ''));

            // Update order assignment.
            $db->query("
                UPDATE repair_orders
                SET location = :bay,
                    technician = :technician,
                    release_time = :release_time,
                    status = :status,
                    updated_by = :u
                WHERE id = :id AND (location_id = :loc OR from_location_id = :loc)
            ");
            $db->bind(':bay', $bayName !== '' ? $bayName : null);
            $db->bind(':technician', $technician !== '' ? $technician : null);
            $db->bind(':release_time', $release);
            $db->bind(':status', (string)$status);
            $db->bind(':u', (int)$u['sub']);
            $db->bind(':id', (int)$id);
            $db->bind(':loc', $locId);
            $ok = $db->execute();
            if (!$ok) {
                $db->exec("ROLLBACK");
                $this->error('Assign failed', 400);
            }

            // Mark newly assigned bay as occupied.
            if ($bayName !== '') {
                $db->query("UPDATE service_bays SET status = 'Occupied', updated_by = :u WHERE name = :name AND location_id = :loc");
                $db->bind(':u', (int)$u['sub']);
                $db->bind(':name', $bayName);
                $db->bind(':loc', $locId);
                $db->execute();
            }

            // If order moved from a different bay, release old bay if no active orders remain.
            if ($oldBay !== '' && $oldBay !== $bayName) {
                $db->query("
                    SELECT COUNT(*) AS cnt
                    FROM repair_orders
                    WHERE location_id = :loc
                      AND status IN ('Pending','In Progress')
                      AND location = :bay
                ");
                $db->bind(':loc', $locId);
                $db->bind(':bay', $oldBay);
                $row = $db->single();
                $cnt = (int)($row->cnt ?? 0);
                if ($cnt <= 0) {
                    $db->query("UPDATE service_bays SET status = 'Available', updated_by = :u WHERE name = :name AND location_id = :loc");
                    $db->bind(':u', (int)$u['sub']);
                    $db->bind(':name', $oldBay);
                    $db->bind(':loc', $locId);
                    $db->execute();
                }
            }

            $db->exec("COMMIT");
        } catch (Exception $e) {
            try { $db->exec("ROLLBACK"); } catch (Exception $e2) {}
            $this->error('Assign failed', 400);
        }

        $this->auditModel->write([
            'user_id' => (int)$u['sub'],
            'location_id' => $locId,
            'action' => 'update',
            'entity' => 'repair_order_assign',
            'entity_id' => (int)$id,
            'method' => $_SERVER['REQUEST_METHOD'] ?? '',
            'path' => $_SERVER['REQUEST_URI'] ?? '',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'details' => json_encode(['bay' => ($bayName !== '' ? $bayName : null), 'technician' => ($technician !== '' ? $technician : null), 'status' => $status]),
        ]);

        $this->success([
            'id' => (int)$id,
            'location' => ($bayName !== '' ? $bayName : null),
            'technician' => ($technician !== '' ? $technician : null),
            'release_time' => $release,
            'status' => $status
        ], 'Assigned');
    }

    // GET /api/order/parts/1
    public function parts($id = null) {
        $u = $this->requirePermission('orders.read');
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
        }
        if (!$id) $this->error('Order ID required', 400);

        $locId = $this->currentLocationId($u);
        $order = $this->orderModel->getOrderByIdInLocation($id, $locId);
        if (!$order) $this->error('Order not found', 404);

        $rows = $this->orderPartModel->listByOrder($id);
        $this->success($rows);
    }

    // POST /api/order/add_part/1
    public function add_part($id = null) {
        $u = $this->requirePermission('orders.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
        }
        if (!$id) $this->error('Order ID required', 400);

        $locId = $this->currentLocationId($u);
        $order = $this->orderModel->getOrderByIdInLocation($id, $locId);
        if (!$order) $this->error('Order not found', 404);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $partId = (int)($data['part_id'] ?? $data['partId'] ?? 0);
        $qty = (int)($data['quantity'] ?? $data['qty'] ?? 0);
        if ($partId <= 0 || $qty <= 0) $this->error('Invalid part/quantity', 400);

        $res = $this->orderPartModel->addLine((int)$id, $partId, $qty, (int)$u['sub']);
        if (is_array($res) && isset($res['error'])) {
            $this->error($res['error'], 400);
        }
        if ($res) {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'location_id' => $locId,
                'action' => 'create',
                'entity' => 'order_part',
                'entity_id' => (int)$res,
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['order_id' => (int)$id, 'part_id' => $partId, 'quantity' => $qty]),
            ]);
            $this->success(['id' => (int)$res], 'Part added to order');
        }
        $this->error('Failed to add part to order', 500);
    }

    // POST /api/order/update_part/123  (123 = order_parts.id)
    public function update_part($lineId = null) {
        $u = $this->requirePermission('orders.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
        }
        if (!$lineId) $this->error('Line ID required', 400);

        $line = $this->orderPartModel->getLine($lineId);
        if (!$line) $this->error('Not found', 404);

        $locId = $this->currentLocationId($u);
        $order = $this->orderModel->getOrderByIdInLocation((int)$line->order_id, $locId);
        if (!$order) $this->error('Order not found', 404);

        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $qty = (int)($data['quantity'] ?? $data['qty'] ?? 0);
        if ($qty <= 0) $this->error('Invalid quantity', 400);

        $res = $this->orderPartModel->updateQty((int)$lineId, $qty, (int)$u['sub']);
        if (is_array($res) && isset($res['error'])) {
            $this->error($res['error'], 400);
        }
        if ($res) {
            $this->success(null, 'Order part updated');
        }
        $this->error('Update failed', 500);
    }

    // DELETE /api/order/delete_part/123 (123 = order_parts.id)
    public function delete_part($lineId = null) {
        $u = $this->requirePermission('orders.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            $this->error('Method Not Allowed', 405);
        }
        if (!$lineId) $this->error('Line ID required', 400);

        $line = $this->orderPartModel->getLine($lineId);
        if (!$line) $this->error('Not found', 404);

        $locId = $this->currentLocationId($u);
        $order = $this->orderModel->getOrderByIdInLocation((int)$line->order_id, $locId);
        if (!$order) $this->error('Order not found', 404);

        $ok = $this->orderPartModel->deleteLine((int)$lineId, (int)$u['sub']);
        if ($ok) $this->success(null, 'Order part deleted');
        $this->error('Delete failed', 500);
    }

    // DELETE /api/order/delete/1
    public function delete($id = null) {
        $u = $this->requirePermission('orders.write');
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            $this->error('Method Not Allowed', 405);
        }
        if (!$id) $this->error('Order ID required', 400);

        $locId = $this->currentLocationId($u);
        $order = $this->orderModel->getOrderByIdInLocation((int)$id, $locId);
        if (!$order) $this->error('Order not found', 404);

        $ok = $this->orderModel->deleteOrder((int)$id, $locId);
        if ($ok) {
            $this->auditModel->write([
                'user_id' => (int)$u['sub'],
                'location_id' => $locId,
                'action' => 'delete',
                'entity' => 'repair_order',
                'entity_id' => (int)$id,
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'path' => $_SERVER['REQUEST_URI'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'details' => json_encode(['order_id' => (int)$id]),
            ]);
            $this->success(null, 'Order deleted');
        }
        $this->error('Delete failed', 500);
    }
}
