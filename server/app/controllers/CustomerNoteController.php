<?php

class CustomerNoteController extends Controller {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    // GET /api/customer_notes?customer_id=1&from=2023-01-01&to=2023-12-31
    public function index() {
        $u = $this->requirePermission('invoices.read');

        $customer_id = $_GET['customer_id'] ?? null;
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;

        $sql = "
            SELECT cn.*, c.name as customer_name, c.phone as customer_phone
            FROM customer_notes cn
            JOIN customers c ON cn.customer_id = c.id
            WHERE 1=1
        ";

        if ($customer_id) {
            $sql .= " AND cn.customer_id = :cid";
        }
        if ($from) {
            $sql .= " AND cn.date >= :from";
        }
        if ($to) {
            $sql .= " AND cn.date <= :to";
        }
        $sql .= " ORDER BY cn.id DESC";

        $this->db->query($sql);
        if ($customer_id) $this->db->bind(':cid', $customer_id);
        if ($from) $this->db->bind(':from', $from);
        if ($to) $this->db->bind(':to', $to);

        $this->success($this->db->resultSet());
    }

    // POST /api/customer_notes
    public function store() {
        $u = $this->requirePermission('invoices.create');
        $data = json_decode(file_get_contents('php://input'), true);

        $type = $data['type'] ?? '';
        $customer_id = $data['customer_id'] ?? null;
        $date = $data['date'] ?? date('Y-m-d');
        $amount = $data['amount'] ?? 0;
        $reason = $data['reason'] ?? '';
        $location_id = $data['location_id'] ?? 1;

        if (!$customer_id || !$type || $amount <= 0) {
            $this->json(['status' => 'error', 'message' => 'Invalid input data']);
            return;
        }

        if (!in_array($type, ['Credit Note', 'Debit Note'])) {
            $this->json(['status' => 'error', 'message' => 'Invalid note type']);
            return;
        }

        try {
            $this->db->beginTransaction();

            // Generate Note No
            $prefix = ($type === 'Credit Note') ? 'CN-' : 'DN-';
            $this->db->query("SELECT note_no FROM customer_notes WHERE note_no LIKE :prefix ORDER BY id DESC LIMIT 1");
            $this->db->bind(':prefix', $prefix . '%');
            $last = $this->db->single();

            $next_num = 1;
            if ($last) {
                $parts = explode('-', $last->note_no);
                if (count($parts) === 2) {
                    $next_num = (int)$parts[1] + 1;
                }
            }
            $note_no = $prefix . str_pad($next_num, 5, '0', STR_PAD_LEFT);

            $this->db->query("INSERT INTO customer_notes (note_no, type, customer_id, location_id, date, amount, reason, created_by) VALUES (:nn, :type, :cid, :loc, :dt, :amt, :rsn, :cb)");
            $this->db->bind(':nn', $note_no);
            $this->db->bind(':type', $type);
            $this->db->bind(':cid', $customer_id);
            $this->db->bind(':loc', $location_id);
            $this->db->bind(':dt', $date);
            $this->db->bind(':amt', $amount);
            $this->db->bind(':rsn', $reason);
            $this->db->bind(':cb', cloneAuthId($u));

            $this->db->execute();
            $id = $this->db->lastInsertId();

            $this->db->commit();
            $this->json(['status' => 'success', 'message' => "$type created successfully", 'data' => ['id' => $id, 'note_no' => $note_no]]);
        } catch (Exception $e) {
            $this->db->rollBack();
            $this->json(['status' => 'error', 'message' => $e->getMessage()]);
        }
    }
}
function cloneAuthId($u) {
    if (isset($u['id'])) return $u['id'];
    if (isset($u['user_id'])) return $u['user_id'];
    return 1;
}
