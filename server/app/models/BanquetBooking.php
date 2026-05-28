<?php
/**
 * BanquetBooking Model
 */
class BanquetBooking extends Model {
    private $table = 'banquet_bookings';

    public function __construct() {
        parent::__construct();
        // $this->ensureSchema();
    }

    public function ensureSchema() {
        $this->db->query("
            CREATE TABLE IF NOT EXISTS {$this->table} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_no VARCHAR(20) UNIQUE NOT NULL,
                customer_id INT NOT NULL,
                hall_id INT NOT NULL,
                booking_date DATE NOT NULL,
                session ENUM('Morning', 'Evening', 'FullDay') DEFAULT 'FullDay',
                status ENUM('Confirmed', 'Cancelled', 'Completed', 'Invoiced') DEFAULT 'Confirmed',
                total_amount DECIMAL(10,2) DEFAULT 0.00,
                advance_paid DECIMAL(10,2) DEFAULT 0.00,
                notes TEXT,
                created_by INT,
                invoice_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id),
                FOREIGN KEY (hall_id) REFERENCES banquet_halls(id)
            ) ENGINE=InnoDB;
        ");
        $this->db->execute();
    }

    public function getAll($filters = []) {
        $sql = "
            SELECT b.*, c.name as customer_name, c.phone as customer_phone, h.name as hall_name, m.name as menu_name
            FROM {$this->table} b
            JOIN customers c ON b.customer_id = c.id
            JOIN banquet_halls h ON b.hall_id = h.id
            LEFT JOIN banquet_menus m ON b.menu_id = m.id
            WHERE 1=1
        ";

        if (!empty($filters['location_id'])) {
            $sql .= " AND h.location_id = :loc";
        }
        if (!empty($filters['status'])) {
            $sql .= " AND b.status = :status";
        }
        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $sql .= " AND b.booking_date BETWEEN :start AND :end";
        }

        $sql .= " ORDER BY b.booking_date DESC, b.created_at DESC";

        $this->db->query($sql);
        if (!empty($filters['location_id'])) $this->db->bind(':loc', $filters['location_id']);
        if (!empty($filters['status'])) $this->db->bind(':status', $filters['status']);
        if (!empty($filters['start_date'])) $this->db->bind(':start', $filters['start_date']);
        if (!empty($filters['end_date'])) $this->db->bind(':end', $filters['end_date']);

        return $this->db->resultSet();
    }

    public function getById($id) {
        $this->db->query("
            SELECT b.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, 
                   h.name as hall_name, m.name as menu_name
            FROM {$this->table} b
            JOIN customers c ON b.customer_id = c.id
            JOIN banquet_halls h ON b.hall_id = h.id
            LEFT JOIN banquet_menus m ON b.menu_id = m.id
            WHERE b.id = :id
        ");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function create($data) {
        $this->db->query("
            INSERT INTO {$this->table} (booking_no, customer_id, hall_id, menu_id, pax_count, booking_date, session, status, total_amount, discount_amount, advance_paid, notes, created_by)
            VALUES (:no, :cust, :hall, :menu, :pax, :date, :session, :status, :total, :discount, :advance, :notes, :user)
        ");
        $this->db->bind(':no', 'BNQ-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4)));
        $this->db->bind(':cust', $data['customer_id']);
        $this->db->bind(':hall', $data['hall_id']);
        $this->db->bind(':menu', $data['menu_id'] ?? null);
        $this->db->bind(':pax', $data['pax_count'] ?? 0);
        $this->db->bind(':date', $data['booking_date']);
        $this->db->bind(':session', $data['session'] ?? 'FullDay');
        $this->db->bind(':status', $data['status'] ?? 'Confirmed');
        $this->db->bind(':total', $data['total_amount'] ?? 0);
        $this->db->bind(':discount', $data['discount_amount'] ?? 0);
        $this->db->bind(':advance', $data['advance_paid'] ?? 0);
        $this->db->bind(':notes', $data['notes'] ?? null);
        $this->db->bind(':user', $data['userId']);
        
        if ($this->db->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function update($id, $data) {
        $this->db->query("
            UPDATE {$this->table}
            SET hall_id = :hall, menu_id = :menu, pax_count = :pax, booking_date = :date, session = :session, 
                status = :status, total_amount = :total, discount_amount = :discount, advance_paid = :advance, notes = :notes
            WHERE id = :id
        ");
        $this->db->bind(':id', $id);
        $this->db->bind(':hall', $data['hall_id']);
        $this->db->bind(':menu', $data['menu_id'] ?? null);
        $this->db->bind(':pax', $data['pax_count'] ?? 0);
        $this->db->bind(':date', $data['booking_date']);
        $this->db->bind(':session', $data['session']);
        $this->db->bind(':status', $data['status']);
        $this->db->bind(':total', $data['total_amount']);
        $this->db->bind(':discount', $data['discount_amount'] ?? 0);
        $this->db->bind(':advance', $data['advance_paid']);
        $this->db->bind(':notes', $data['notes'] ?? null);
        return $this->db->execute();
    }

    public function cancel($id, $reason, $userId) {
        $this->db->query("
            UPDATE {$this->table} 
            SET status = 'Cancelled', notes = CONCAT(IFNULL(notes,''), '\nCancellation Reason: ', :reason)
            WHERE id = :id
        ");
        $this->db->bind(':id', $id);
        $this->db->bind(':reason', $reason);
        return $this->db->execute();
    }
}
