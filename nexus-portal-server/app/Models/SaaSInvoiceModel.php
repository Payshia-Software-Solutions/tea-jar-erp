<?php
namespace App\Models;

use App\Core\Database;

class SaaSInvoiceModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function listAll() {
        $this->db->query("
            SELECT i.*, t.name as tenant_name, t.admin_email, t.billing_cc_email
            FROM saas_invoices i
            LEFT JOIN saas_tenants t ON i.tenant_id = t.id
            ORDER BY i.created_at DESC
        ");
        return $this->db->resultSet();
    }

    public function getAllWithTenants() {
        $this->db->query("
            SELECT i.*, t.name as tenant_name, t.admin_email, t.billing_cc_email
            FROM saas_invoices i
            LEFT JOIN saas_tenants t ON i.tenant_id = t.id
            ORDER BY i.created_at DESC
        ");
        return $this->db->resultSet();
    }

    public function getFullDetail($id) {
        $this->db->query("
            SELECT i.*, t.name as tenant_name, t.admin_email, t.billing_cc_email, t.address, p.name as package_name, p.monthly_price as base_price,
                   pay.receipt_number, pay.payment_method, pay.transaction_id, pay.created_at as paid_at
            FROM saas_invoices i
            JOIN saas_tenants t ON i.tenant_id = t.id
            LEFT JOIN saas_packages p ON t.package_id = p.id
            LEFT JOIN (
                SELECT * FROM saas_payments 
                WHERE invoice_id = :id2 
                ORDER BY created_at DESC LIMIT 1
            ) pay ON i.id = pay.invoice_id
            WHERE i.id = :id
        ");
        $this->db->bind(':id', $id);
        $this->db->bind(':id2', $id);
        return $this->db->single();
    }

    public function update($id, $data) {
        $fields = [];
        $params = [':id' => $id];
        foreach ($data as $key => $val) {
            $fields[] = "$key = :$key";
            $params[":$key"] = $val;
        }
        $query = "UPDATE saas_invoices SET " . implode(', ', $fields) . " WHERE id = :id";
        $this->db->query($query);
        foreach ($params as $key => $val) {
            $this->db->bind($key, $val);
        }
        return $this->db->execute();
    }

    public function getByTenant($tenantId) {
        $this->db->query("SELECT * FROM saas_invoices WHERE tenant_id = :tid ORDER BY created_at DESC");
        $this->db->bind(':tid', $tenantId);
        return $this->db->resultSet();
    }

    public function generateMonthlyBatch() {
        // 1. Get all active tenants with their package price
        $this->db->query("
            SELECT t.id as tenant_id, t.name, t.slug, p.monthly_price 
            FROM saas_tenants t
            JOIN saas_packages p ON t.package_id = p.id
            WHERE t.status != 'Deleted'
        ");
        $tenants = $this->db->resultSet();
        
        $count = 0;
        $billingMonth = date('F Y'); // e.g., April 2026
        $dueDate = date('Y-m-10'); // 10th of current month
        
        foreach ($tenants as $tenant) {
            // Check if invoice already exists for this tenant and month
            $this->db->query("SELECT id FROM saas_invoices WHERE tenant_id = :tid AND billing_month = :month");
            $this->db->bind(':tid', $tenant->tenant_id);
            $this->db->bind(':month', $billingMonth);
            
            if (!$this->db->single()) {
                $invoiceNum = $this->generateNextInvoiceNumber();
                
                $this->db->query("INSERT INTO saas_invoices (tenant_id, invoice_number, billing_month, amount, due_date, status) 
                                 VALUES (:tid, :num, :month, :amt, :due, 'Pending')");
                $this->db->bind(':tid', $tenant->tenant_id);
                $this->db->bind(':num', $invoiceNum);
                $this->db->bind(':month', $billingMonth);
                $this->db->bind(':amt', $tenant->monthly_price);
                $this->db->bind(':due', $dueDate);
                
                if ($this->db->execute()) {
                    $count++;
                }
            }
        }
        return $count;
    }

    public function generateNextInvoiceNumber() {
        $this->db->query("SELECT MAX(id) as max_id FROM saas_invoices");
        $result = $this->db->single();
        $nextId = ($result->max_id ?? 0) + 1;
        return 'INV-' . date('Ym') . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
    }

    public function getAllInvoices() {
        $this->db->query("
            SELECT i.*, t.name as tenant_name 
            FROM saas_invoices i
            JOIN saas_tenants t ON i.tenant_id = t.id
            ORDER BY i.created_at DESC
        ");
        return $this->db->resultSet();
    }

    public function exists($tenantId, $month) {
        $this->db->query("SELECT id FROM saas_invoices WHERE tenant_id = :tid AND billing_month = :month");
        $this->db->bind(':tid', $tenantId);
        $this->db->bind(':month', $month);
        return $this->db->single();
    }

    public function create($data) {
        $this->db->query("INSERT INTO saas_invoices (tenant_id, invoice_number, amount, currency, exchange_rate, source, billing_month, due_date, status, email_status) 
                         VALUES (:tid, :num, :amt, :curr, :rate, :src, :month, :due, :status, 'Pending')");
        $this->db->bind(':tid', $data['tenant_id']);
        $this->db->bind(':num', $data['invoice_number']);
        $this->db->bind(':amt', $data['amount']);
        $this->db->bind(':curr', $data['currency'] ?? 'USD');
        $this->db->bind(':rate', $data['exchange_rate'] ?? 1.0);
        $this->db->bind(':src', $data['source'] ?? 'MARKET');
        $this->db->bind(':month', $data['billing_month']);
        $this->db->bind(':due', $data['due_date']);
        $this->db->bind(':status', $data['status']);
        
        if ($this->db->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }
    public function delete($id) {
        $this->db->query("DELETE FROM saas_invoices WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function getPayments($invoiceId) {
        $this->db->query("SELECT * FROM saas_payments WHERE invoice_id = :iid ORDER BY created_at DESC");
        $this->db->bind(':iid', $invoiceId);
        return $this->db->resultSet();
    }

    public function getAllPayments() {
        $this->db->query("
            SELECT p.*, i.invoice_number, i.currency, t.name as tenant_name 
            FROM saas_payments p
            JOIN saas_invoices i ON p.invoice_id = i.id
            JOIN saas_tenants t ON i.tenant_id = t.id
            ORDER BY p.created_at DESC
        ");
        return $this->db->resultSet();
    }

    public function logEmail($invoiceId, $type, $recipient, $cc, $status, $error = null, $subject = null, $body = null) {
        $this->db->query("INSERT INTO saas_email_logs (invoice_id, email_type, subject, body, recipient, cc_recipient, status, error_message) 
                         VALUES (:id, :type, :sub, :body, :to, :cc, :status, :err)");
        $this->db->bind(':id', $invoiceId);
        $this->db->bind(':type', $type);
        $this->db->bind(':sub', $subject);
        $this->db->bind(':body', $body);
        $this->db->bind(':to', $recipient);
        $this->db->bind(':cc', $cc);
        $this->db->bind(':status', $status);
        $this->db->bind(':err', $error);
        return $this->db->execute();
    }

    public function getEmailLogs() {
        $this->db->query("
            SELECT 
                l.*, 
                COALESCE(i.invoice_number, 'GENERIC') as invoice_number,
                (
                    SELECT name 
                    FROM saas_tenants 
                    WHERE id = i.tenant_id 
                       OR (l.invoice_id IS NULL AND admin_email COLLATE utf8mb4_unicode_ci = l.recipient COLLATE utf8mb4_unicode_ci)
                    LIMIT 1
                ) as tenant_name
            FROM saas_email_logs l
            LEFT JOIN saas_invoices i ON l.invoice_id = i.id
            ORDER BY l.created_at DESC
        ");
        return $this->db->resultSet();
    }
}
