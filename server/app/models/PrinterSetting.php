<?php
class PrinterSetting {
    private $db;

    public function __construct() {
        $this->db = new Database;
    }

    public function getSettings($location_id = null) {
        if ($location_id) {
            $this->db->query("SELECT * FROM printer_settings WHERE location_id = :loc");
            $this->db->bind(':loc', $location_id);
        } else {
            $this->db->query("SELECT * FROM printer_settings");
        }
        return $this->db->resultSet();
    }

    public function updateOrInsert($data) {
        // Check if exists
        $this->db->query("SELECT id FROM printer_settings WHERE location_id = :loc AND printer_type = :type");
        $this->db->bind(':loc', $data['location_id']);
        $this->db->bind(':type', $data['printer_type']);
        $row = $this->db->single();

        if ($row) {
            $this->db->query("UPDATE printer_settings SET printer_name = :name, paper_width = :width WHERE id = :id");
            $this->db->bind(':id', $row->id);
        } else {
            $this->db->query("INSERT INTO printer_settings (location_id, printer_type, printer_name, paper_width) VALUES (:loc, :type, :name, :width)");
            $this->db->bind(':loc', $data['location_id']);
            $this->db->bind(':type', $data['printer_type']);
        }
        $this->db->bind(':name', $data['printer_name']);
        $this->db->bind(':width', $data['paper_width']);
        return $this->db->execute();
    }
}
