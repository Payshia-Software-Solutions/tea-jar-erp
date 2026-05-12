<?php
/**
 * ItemBreakdownController
 * Manage Item Sections, Departments, and Categories
 */
class ItemBreakdownController extends Controller {
    protected $db;

    public function __construct() {
        $this->db = new Database();
    }

    // --- SECTIONS ---
    public function sections() {
        $this->requirePermission('parts.read');
        $this->db->query("SELECT * FROM item_sections ORDER BY name ASC");
        $this->success($this->db->resultSet());
    }

    public function create_section() {
        $this->requirePermission('parts.write');
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $name = trim($data['name'] ?? '');
        if ($name === '') $this->error('Name required', 400);
        
        $this->db->query("INSERT INTO item_sections (name) VALUES (:n)");
        $this->db->bind(':n', $name);
        if ($this->db->execute()) $this->success(['id' => $this->db->lastInsertId()], 'Section created');
        else $this->error('Failed to create section');
    }

    public function update_section($id) {
        $this->requirePermission('parts.write');
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $name = trim($data['name'] ?? '');
        if ($name === '') $this->error('Name required', 400);
        
        $this->db->query("UPDATE item_sections SET name = :n WHERE id = :id");
        $this->db->bind(':n', $name);
        $this->db->bind(':id', (int)$id);
        if ($this->db->execute()) $this->success(null, 'Section updated');
        else $this->error('Failed to update section');
    }

    public function delete_section($id) {
        $this->requirePermission('parts.write');
        $this->db->query("DELETE FROM item_sections WHERE id = :id");
        $this->db->bind(':id', (int)$id);
        if ($this->db->execute()) $this->success(null, 'Section deleted');
        else $this->error('Failed to delete section');
    }

    // --- DEPARTMENTS ---
    public function departments() {
        $this->requirePermission('parts.read');
        $sectionId = isset($_GET['section_id']) ? (int)$_GET['section_id'] : 0;
        $sql = "SELECT d.*, s.name as section_name 
                FROM item_departments d
                LEFT JOIN item_sections s ON s.id = d.section_id";
        if ($sectionId > 0) $sql .= " WHERE d.section_id = :sid";
        $sql .= " ORDER BY d.name ASC";
        
        $this->db->query($sql);
        if ($sectionId > 0) $this->db->bind(':sid', $sectionId);
        $this->success($this->db->resultSet());
    }

    public function create_department() {
        $this->requirePermission('parts.write');
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $name = trim($data['name'] ?? '');
        $sectionId = (int)($data['section_id'] ?? 0);
        if ($name === '' || $sectionId <= 0) $this->error('Name and Section are required', 400);
        
        $this->db->query("INSERT INTO item_departments (section_id, name) VALUES (:s, :n)");
        $this->db->bind(':s', $sectionId);
        $this->db->bind(':n', $name);
        if ($this->db->execute()) $this->success(['id' => $this->db->lastInsertId()], 'Department created');
        else $this->error('Failed to create department');
    }

    public function update_department($id) {
        $this->requirePermission('parts.write');
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $name = trim($data['name'] ?? '');
        $sectionId = (int)($data['section_id'] ?? 0);
        if ($name === '' || $sectionId <= 0) $this->error('Name and Section are required', 400);
        
        $this->db->query("UPDATE item_departments SET section_id = :s, name = :n WHERE id = :id");
        $this->db->bind(':s', $sectionId);
        $this->db->bind(':n', $name);
        $this->db->bind(':id', (int)$id);
        if ($this->db->execute()) $this->success(null, 'Department updated');
        else $this->error('Failed to update department');
    }

    public function delete_department($id) {
        $this->requirePermission('parts.write');
        $this->db->query("DELETE FROM item_departments WHERE id = :id");
        $this->db->bind(':id', (int)$id);
        if ($this->db->execute()) $this->success(null, 'Department deleted');
        else $this->error('Failed to delete department');
    }

    // --- CATEGORIES ---
    public function categories() {
        $this->requirePermission('parts.read');
        $this->db->query("SELECT * FROM item_categories ORDER BY name ASC");
        $this->success($this->db->resultSet());
    }

    public function create_category() {
        $this->requirePermission('parts.write');
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $name = trim($data['name'] ?? '');
        if ($name === '') $this->error('Name required', 400);
        
        $this->db->query("INSERT INTO item_categories (name) VALUES (:n)");
        $this->db->bind(':n', $name);
        if ($this->db->execute()) $this->success(['id' => $this->db->lastInsertId()], 'Category created');
        else $this->error('Failed to create category');
    }

    public function update_category($id) {
        $this->requirePermission('parts.write');
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $name = trim($data['name'] ?? '');
        if ($name === '') $this->error('Name required', 400);
        
        $this->db->query("UPDATE item_categories SET name = :n WHERE id = :id");
        $this->db->bind(':n', $name);
        $this->db->bind(':id', (int)$id);
        if ($this->db->execute()) $this->success(null, 'Category updated');
        else $this->error('Failed to update category');
    }

    public function delete_category($id) {
        $this->requirePermission('parts.write');
        $this->db->query("DELETE FROM item_categories WHERE id = :id");
        $this->db->bind(':id', (int)$id);
        if ($this->db->execute()) $this->success(null, 'Category deleted');
        else $this->error('Failed to delete category');
    }
}
