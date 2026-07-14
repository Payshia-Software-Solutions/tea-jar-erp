<?php
class KioskBooking {
    private $db;
    private $table = 'kiosk_bookings';

    public function __construct() {
        if (class_exists('KioskSchema')) KioskSchema::ensure();
        $this->db = new Database();
    }

    public function create($data) {
        $this->db->query("
            INSERT INTO {$this->table} (booking_no, room_number, guest_name, experience_id, pax_count, preferred_date_time, total_amount, status, notes)
            VALUES (:booking_no, :room_number, :guest_name, :experience_id, :pax_count, :preferred_date_time, :total_amount, :status, :notes)
        ");
        
        $this->db->bind(':booking_no', $data['booking_no']);
        $this->db->bind(':room_number', $data['room_number']);
        $this->db->bind(':guest_name', $data['guest_name']);
        $this->db->bind(':experience_id', $data['experience_id']);
        $this->db->bind(':pax_count', $data['pax_count'] ?? 1);
        $this->db->bind(':preferred_date_time', $data['preferred_date_time']);
        $this->db->bind(':total_amount', $data['total_amount'] ?? 0);
        $this->db->bind(':status', $data['status'] ?? 'Pending');
        $this->db->bind(':notes', $data['notes'] ?? '');

        if ($this->db->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function getAllBookings() {
        $this->db->query("
            SELECT b.*, p.part_name as experience_name, p.price, p.image_filename 
            FROM {$this->table} b
            LEFT JOIN parts p ON b.experience_id = p.id
            ORDER BY b.created_at DESC
        ");
        return $this->db->resultSet();
    }

    public function updateStatus($id, $status) {
        $this->db->query("UPDATE {$this->table} SET status = :status WHERE id = :id");
        $this->db->bind(':status', $status);
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
