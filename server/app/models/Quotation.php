<?php
/**
 * Quotation Model
 */
class Quotation extends Model {
    private $table = 'quotations';

    public function __construct() {
        parent::__construct();
        // // $this->ensureSchema();
    }

    public function ensureSchema() { return;
        require_once '../app/helpers/QuotationSchema.php';
        QuotationSchema::ensure();
    }

    public function getAll($filters = []) {
        $sql = "
            SELECT q.*, c.name as customer_name
            FROM quotations q
            JOIN customers c ON q.customer_id = c.id
            WHERE 1=1
        ";

        if (!empty($filters['status'])) {
            $sql .= " AND q.status = :status";
        }
        if (!empty($filters['customer_id'])) {
            $sql .= " AND q.customer_id = :customer_id";
        }

        $sql .= " ORDER BY q.created_at DESC";

        $this->db->query($sql);
        if (!empty($filters['status'])) $this->db->bind(':status', $filters['status']);
        if (!empty($filters['customer_id'])) $this->db->bind(':customer_id', $filters['customer_id']);

        return $this->db->resultSet();
    }

    public function getById($id) {
        $this->db->query("
            SELECT q.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address, 
                   c.tax_number as customer_tax_no,
                   sl.name as location_name, sl.address as location_address, sl.phone as location_phone,
                   sp.name as shipping_provider_name,
                   sct.name as costing_template_name
            FROM quotations q
            JOIN customers c ON q.customer_id = c.id
            LEFT JOIN service_locations sl ON q.location_id = sl.id
            LEFT JOIN shipping_providers sp ON q.shipping_provider_id = sp.id
            LEFT JOIN shipping_costing_templates sct ON q.shipping_costing_template_id = sct.id
            WHERE q.id = :id
        ");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function getItems($quotationId) {
        $this->db->query("SELECT * FROM quotation_items WHERE quotation_id = :quotation_id ORDER BY id ASC");
        $this->db->bind(':quotation_id', $quotationId);
        return $this->db->resultSet();
    }

    public function create($data) {
        $this->db->query("
            INSERT INTO quotations (
                quotation_no, location_id, customer_id, issue_date, expiry_date, 
                subtotal, tax_total, discount_total, grand_total, status, notes,
                is_international, shipping_provider_id, shipping_cost, shipping_country, shipping_address,
                shipping_costing_template_id,
                created_by, updated_by
            ) VALUES (
                :quotation_no, :location_id, :customer_id, :issue_date, :expiry_date, 
                :subtotal, :tax_total, :discount_total, :grand_total, :status, :notes,
                :is_international, :shipping_provider_id, :shipping_cost, :shipping_country, :shipping_address,
                :shipping_costing_template_id,
                :created_by, :updated_by
            )
        ");
        $this->db->bind(':quotation_no', $data['quotation_no']);
        $this->db->bind(':location_id', $data['location_id'] ?? null);
        $this->db->bind(':customer_id', $data['customer_id']);
        $this->db->bind(':issue_date', $data['issue_date']);
        $this->db->bind(':expiry_date', $data['expiry_date'] ?? null);
        $this->db->bind(':subtotal', $data['subtotal']);
        $this->db->bind(':tax_total', $data['tax_total']);
        $this->db->bind(':discount_total', $data['discount_total'] ?? 0);
        $this->db->bind(':grand_total', $data['grand_total']);
        $this->db->bind(':status', $data['status'] ?? 'Draft');
        $this->db->bind(':notes', $data['notes'] ?? null);
        $this->db->bind(':is_international', !empty($data['is_international']) ? 1 : 0);
        $this->db->bind(':shipping_provider_id', $data['shipping_provider_id'] ?? null);
        $this->db->bind(':shipping_cost', $data['shipping_cost'] ?? 0);
        $this->db->bind(':shipping_country', $data['shipping_country'] ?? null);
        $this->db->bind(':shipping_address', $data['shipping_address'] ?? null);
        $this->db->bind(':shipping_costing_template_id', $data['shipping_costing_template_id'] ?? null);
        $this->db->bind(':created_by', $data['userId']);
        $this->db->bind(':updated_by', $data['userId']);

        if ($this->db->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function addItems($quotationId, $items) {
        foreach ($items as $item) {
            $this->db->query("
                INSERT INTO quotation_items (
                    quotation_id, item_id, description, item_type, quantity, unit_price, discount, line_total
                ) VALUES (
                    :quotation_id, :item_id, :description, :item_type, :quantity, :unit_price, :discount, :line_total
                )
            ");
            $this->db->bind(':quotation_id', $quotationId);
            $this->db->bind(':item_id', !empty($item['item_id']) ? (int)$item['item_id'] : null);
            $this->db->bind(':description', $item['description']);
            $this->db->bind(':item_type', $item['item_type'] ?? 'Part');
            $this->db->bind(':quantity', $item['quantity']);
            $this->db->bind(':unit_price', $item['unit_price']);
            $this->db->bind(':discount', $item['discount'] ?? 0);
            $this->db->bind(':line_total', $item['line_total']);
            $this->db->execute();
        }
        return true;
    }

    public function addAppliedTaxes($quotationId, $taxes) {
        if (!is_array($taxes) || empty($taxes)) return true;
        foreach ($taxes as $tax) {
            $this->db->query("
                INSERT INTO quotation_taxes (quotation_id, tax_name, tax_code, rate_percent, amount)
                VALUES (:quotation_id, :name, :code, :rate, :amount)
            ");
            $this->db->bind(':quotation_id', $quotationId);
            $this->db->bind(':name', $tax['name']);
            $this->db->bind(':code', $tax['code']);
            $this->db->bind(':rate', $tax['rate_percent'] ?? 0);
            $this->db->bind(':amount', $tax['amount']);
            $this->db->execute();
        }
        return true;
    }

    public function getAppliedTaxes($quotationId) {
        $this->db->query("SELECT * FROM quotation_taxes WHERE quotation_id = :quotation_id ORDER BY id ASC");
        $this->db->bind(':quotation_id', $quotationId);
        return $this->db->resultSet();
    }

    public function updateStatus($id, $status) {
        $this->db->query("UPDATE quotations SET status = :status WHERE id = :id");
        $this->db->bind(':status', $status);
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function setConvertedInvoiceId($id, $invoiceId) {
        $this->db->query("UPDATE quotations SET converted_invoice_id = :invoice_id, status = 'Converted' WHERE id = :id");
        $this->db->bind(':invoice_id', $invoiceId);
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
