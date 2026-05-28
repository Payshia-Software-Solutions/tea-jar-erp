<?php
/**
 * Reservation Model
 */
class Reservation extends Model {
    private $table = 'hotel_reservations';

    public function __construct() {
        parent::__construct();
        // Schema migrations should not run on every instantiation
        // // // // // // $this->ensureSchema();
    }

    public function ensureSchema() { return;
        // Add status enum value 'Cancelled' if missing (MySQL might need ALTER)
        try {
            $this->db->query("ALTER TABLE {$this->table} MODIFY COLUMN status ENUM('Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled') DEFAULT 'Confirmed'");
            $this->db->execute();
        } catch (Exception $e) {}

        // Add cancellation columns if missing
        $cols = [
            'cancelled_at' => "DATETIME NULL",
            'cancelled_by' => "INT NULL",
            'cancellation_reason' => "TEXT NULL"
        ];
        foreach ($cols as $col => $def) {
            try {
                $this->db->query("SELECT $col FROM {$this->table} LIMIT 1");
                $this->db->execute();
            } catch (Exception $e) {
                $this->db->query("ALTER TABLE {$this->table} ADD COLUMN $col $def");
                $this->db->execute();
            }
        }
    }

    public function cancel($id, $reason, $userId) {
        $res = $this->getById($id);
        if (!$res) return false;
        if ($res->status === 'Cancelled') return true;

        $this->db->beginTransaction();
        try {
            // 1. Update Reservation Status
            $this->db->query("
                UPDATE {$this->table} 
                SET status = 'Cancelled',
                    cancelled_at = NOW(),
                    cancelled_by = :user,
                    cancellation_reason = :reason
                WHERE id = :id
            ");
            $this->db->bind(':user', $userId);
            $this->db->bind(':reason', $reason);
            $this->db->bind(':id', $id);
            $this->db->execute();

            // 2. Revert Room Status (if Checked In)
            if ($res->status === 'CheckedIn') {
                $this->db->query("UPDATE hotel_rooms SET status = 'Available' WHERE id = :room_id");
                $this->db->bind(':room_id', $res->room_id);
                $this->db->execute();
            }

            // 3. Reverse Accounting Entries
            require_once 'Journal.php';
            $journal = new Journal();
            $journal->reverseEntries('Reservation', $id, $userId);

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Reservation cancellation failed: " . $e->getMessage());
            return false;
        }
    }

    public function getAll($filters = []) {
        $sql = "
            SELECT res.*, c.name as customer_name, c.phone as customer_phone, r.room_number, rt.name as room_type
            FROM {$this->table} res
            JOIN customers c ON res.customer_id = c.id
            JOIN hotel_rooms r ON res.room_id = r.id
            JOIN hotel_room_types rt ON r.type_id = rt.id
            WHERE res.status != 'Cancelled'
        ";

        if (!empty($filters['status'])) {
            $sql .= " AND res.status = :status";
        }
        if (!empty($filters['location_id'])) {
            $sql .= " AND r.location_id = :loc";
        }

        $sql .= " ORDER BY res.check_in ASC";

        $this->db->query($sql);
        if (!empty($filters['status'])) $this->db->bind(':status', $filters['status']);
        if (!empty($filters['location_id'])) $this->db->bind(':loc', $filters['location_id']);

        return $this->db->resultSet();
    }

    public function getById($id) {
        $this->db->query("
            SELECT res.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
                   r.room_number, r.location_id, rt.name as room_type, rt.base_rate, rt.item_id as type_item_id
            FROM {$this->table} res
            JOIN customers c ON res.customer_id = c.id
            JOIN hotel_rooms r ON res.room_id = r.id
            JOIN hotel_room_types rt ON r.type_id = rt.id
            WHERE res.id = :id
        ");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function checkIn($id) {
        $this->db->beginTransaction();
        try {
            // 1. Update reservation status
            $this->db->query("UPDATE {$this->table} SET status = 'CheckedIn' WHERE id = :id");
            $this->db->bind(':id', $id);
            $this->db->execute();

            // 2. Update room status
            $res = $this->getById($id);
            $this->db->query("UPDATE hotel_rooms SET status = 'Occupied' WHERE id = :room_id");
            $this->db->bind(':room_id', $res->room_id);
            $this->db->execute();

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }

    public function create($data) {
        $this->db->query("
            INSERT INTO {$this->table} (reservation_no, customer_id, room_id, check_in, check_out, adults, children, total_amount, meal_plan, created_by)
            VALUES (:no, :cust, :room, :in, :out, :adults, :kids, :total, :meal, :user)
        ");
        $this->db->bind(':no', 'RES-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4)));
        $this->db->bind(':cust', $data['customer_id']);
        $this->db->bind(':room', $data['room_id']);
        $this->db->bind(':in', $data['check_in']);
        $this->db->bind(':out', $data['check_out']);
        $this->db->bind(':adults', $data['adults'] ?? 1);
        $this->db->bind(':kids', $data['children'] ?? 0);
        $this->db->bind(':total', $data['total_amount'] ?? 0.00);
        $this->db->bind(':meal', $data['meal_plan'] ?? 'BB');
        $this->db->bind(':user', $data['userId']);
        
        if ($this->db->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function update($id, $data) {
        $this->db->query("
            UPDATE {$this->table} 
            SET room_id = :room, check_in = :in, check_out = :out, 
                adults = :adults, children = :kids, total_amount = :total,
                meal_plan = :meal, notes = :notes
            WHERE id = :id
        ");
        $this->db->bind(':id', $id);
        $this->db->bind(':room', $data['room_id']);
        $this->db->bind(':in', $data['check_in']);
        $this->db->bind(':out', $data['check_out']);
        $this->db->bind(':adults', $data['adults']);
        $this->db->bind(':kids', $data['children']);
        $this->db->bind(':total', $data['total_amount']);
        $this->db->bind(':meal', $data['meal_plan'] ?? 'BB');
        $this->db->bind(':notes', $data['notes'] ?? null);
        return $this->db->execute();
    }

    public function addItem($resId, $data) {
        $this->db->query("
            INSERT INTO hotel_reservation_items (reservation_id, item_id, description, quantity, unit_price, total_price)
            VALUES (:res, :item_id, :desc, :qty, :price, :total)
        ");
        $this->db->bind(':res', $resId);
        $this->db->bind(':item_id', $data['item_id'] ?? null);
        $this->db->bind(':desc', $data['description']);
        $this->db->bind(':qty', $data['quantity'] ?? 1);
        $this->db->bind(':price', $data['unit_price'] ?? 0);
        $this->db->bind(':total', ($data['quantity'] ?? 1) * ($data['unit_price'] ?? 0));
        return $this->db->execute();
    }

    public function getItems($resId) {
        $this->db->query("SELECT * FROM hotel_reservation_items WHERE reservation_id = :res ORDER BY created_at DESC");
        $this->db->bind(':res', $resId);
        return $this->db->resultSet();
    }

    public function removeItem($itemId) {
        $this->db->query("DELETE FROM hotel_reservation_items WHERE id = :id");
        $this->db->bind(':id', $itemId);
        return $this->db->execute();
    }

    public function addItemsBulk($resId, $items) {
        $this->db->beginTransaction();
        try {
            foreach ($items as $item) {
                $this->db->query("
                    INSERT INTO hotel_reservation_items (reservation_id, item_id, description, quantity, unit_price, total_price)
                    VALUES (:res, :item_id, :desc, :qty, :price, :total)
                ");
                $this->db->bind(':res', $resId);
                $this->db->bind(':item_id', $item['id'] ?? $item['item_id'] ?? null);
                $this->db->bind(':desc', $item['description']);
                $this->db->bind(':qty', $item['quantity'] ?? 1);
                $this->db->bind(':price', $item['unit_price'] ?? 0);
                $this->db->bind(':total', ($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0));
                $this->db->execute();
            }
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Bulk add items failed: " . $e->getMessage());
            return false;
        }
    }
}
