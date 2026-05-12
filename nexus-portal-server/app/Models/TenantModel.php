<?php
namespace App\Models;

use App\Core\Database;

class TenantModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function getAll() {
        $this->db->query("SELECT t.*, p.name as package_name FROM saas_tenants t LEFT JOIN saas_packages p ON t.package_id = p.id ORDER BY t.created_at DESC");
        return $this->db->resultSet();
    }

    public function getBySlug($slug) {
        $this->db->query("
            SELECT t.name as tenant_name, t.license_key, p.name as package_name, p.package_key, p.modules 
            FROM saas_tenants t
            JOIN saas_packages p ON t.package_id = p.id
            WHERE t.slug = :slug AND t.status = 'Active'
        ");
        $this->db->bind(':slug', $slug);
        return $this->db->single();
    }

    public function getByLicenseKey($license) {
        $this->db->query("
            SELECT 
                t.id,
                t.name as tenant_name, 
                t.status, 
                t.license_key,
                t.trial_expiry as renewal_date, 
                p.name as package_name, 
                p.package_key, 
                p.modules, 
                p.monthly_price,
                p.max_users,
                p.max_locations
            FROM saas_tenants t
            JOIN saas_packages p ON t.package_id = p.id
            WHERE t.license_key = :license AND t.status IN ('Active', 'Trial')
        ");
        $this->db->bind(':license', $license);
        $tenant = $this->db->single();

        if ($tenant) {
            $this->db->query("SELECT invoice_number, amount, status, due_date FROM saas_invoices WHERE tenant_id = :tid ORDER BY created_at DESC LIMIT 5");
            $this->db->bind(':tid', $tenant->id);
            $tenant->invoices = $this->db->resultSet();
        }

        return $tenant;
    }

    public function getByApiKey($key) {
        $this->db->query("
            SELECT 
                t.id,
                t.name as tenant_name, 
                t.status, 
                t.license_key,
                t.trial_expiry as renewal_date, 
                p.name as package_name, 
                p.package_key, 
                p.modules, 
                p.monthly_price,
                p.max_users,
                p.max_locations
            FROM saas_tenants t
            JOIN saas_packages p ON t.package_id = p.id
            WHERE t.api_key = :key AND t.status IN ('Active', 'Trial')
        ");
        $this->db->bind(':key', $key);
        $tenant = $this->db->single();

        if ($tenant) {
            $this->db->query("SELECT invoice_number, amount, status, due_date FROM saas_invoices WHERE tenant_id = :tid ORDER BY created_at DESC LIMIT 5");
            $this->db->bind(':tid', $tenant->id);
            $tenant->invoices = $this->db->resultSet();
        }

        return $tenant;
    }

    public function create($data) {
        $random = bin2hex(random_bytes(10));
        // Longer format: RM-SLUG-XXXX-XXXX-XXXX-XXXX (20 chars of random data)
        $license = "RM-" . strtoupper($data['slug']) . "-" . 
                   substr($random, 0, 5) . "-" . 
                   substr($random, 5, 5) . "-" . 
                   substr($random, 10, 5) . "-" . 
                   substr($random, 15, 5);
        $apiKey = "NX-" . bin2hex(random_bytes(24)); // Also make API key longer
        $expiry = date('Y-m-d', strtotime('+14 days'));

        $this->db->query("INSERT INTO saas_tenants (name, address, business_type, admin_email, contact_number, billing_cc_email, slug, package_id, currency, db_name, api_url, status, trial_expiry, license_key, api_key) 
                         VALUES (:name, :address, :type, :email, :phone, :cc, :slug, :pid, :curr, :db, :url, 'Trial', :expiry, :license, :apikey)");
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':address', $data['address'] ?? '');
        $this->db->bind(':type', $data['business_type'] ?? '');
        $this->db->bind(':email', $data['admin_email'] ?? '');
        $this->db->bind(':phone', $data['contact_number'] ?? null);
        $this->db->bind(':cc', $data['billing_cc_email'] ?? null);
        $this->db->bind(':slug', $data['slug']);
        $this->db->bind(':pid', $data['package_id'] ?? 1);
        $this->db->bind(':curr', $data['currency'] ?? 'USD');
        $this->db->bind(':db', $data['db_name'] ?? 'repair_management_db');
        $this->db->bind(':url', $data['api_url'] ?? 'http://localhost/rapair-management/server');
        $this->db->bind(':expiry', $expiry);
        $this->db->bind(':license', $license);
        $this->db->bind(':apikey', $apiKey);

        if ($this->db->execute()) {
            return [
                'id' => $this->db->lastInsertId(),
                'license' => $license,
                'api_key' => $apiKey
            ];
        }
        return false;
    }

    public function update($data) {
        $this->db->query("UPDATE saas_tenants SET name = :name, admin_email = :email, contact_number = :phone, slug = :slug, package_id = :pid, currency = :curr, status = :status, license_key = :license, api_key = :apikey, trial_expiry = :expiry, billing_cc_email = :cc WHERE id = :id");
        $this->db->bind(':name', $data['name']);
        $this->db->bind(':email', $data['admin_email']);
        $this->db->bind(':phone', $data['contact_number'] ?? null);
        $this->db->bind(':slug', $data['slug']);
        $this->db->bind(':pid', $data['package_id']);
        $this->db->bind(':curr', $data['currency']);
        $this->db->bind(':status', $data['status']);
        $this->db->bind(':license', $data['license_key']);
        $this->db->bind(':apikey', $data['api_key']);
        $this->db->bind(':expiry', $data['trial_expiry'] ?? null);
        $this->db->bind(':cc', $data['billing_cc_email'] ?? null);
        $this->db->bind(':id', $data['id']);
        return $this->db->execute();
    }

    public function updateStatus($id, $status) {
        $this->db->query("UPDATE saas_tenants SET status = :status WHERE id = :id");
        $this->db->bind(':status', $status);
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM saas_tenants WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }

    public function getStats() {
        $stats = [];
        
        $this->db->query("SELECT COUNT(*) as total FROM saas_tenants");
        $stats['total_tenants'] = $this->db->single()->total;
        
        $this->db->query("SELECT COUNT(*) as total FROM saas_tenants WHERE status = 'Active'");
        $stats['active_tenants'] = $this->db->single()->total;

        $this->db->query("SELECT COUNT(*) as total FROM saas_tenants WHERE status = 'Trial'");
        $stats['trial_tenants'] = $this->db->single()->total;

        $this->db->query("SELECT COUNT(*) as total FROM saas_packages");
        $stats['total_packages'] = $this->db->single()->total;

        $stats['uptime'] = '99.9%';
        return $stats;
    }

    public function getByIdWithPackage($id) {
        $this->db->query("
            SELECT t.*, p.name as package_name, p.monthly_price, p.modules as package_modules
            FROM saas_tenants t
            LEFT JOIN saas_packages p ON t.package_id = p.id
            WHERE t.id = :id
        ");
        $this->db->bind(':id', $id);
        return $this->db->single();
    }

    public function getAllActive() {
        $this->db->query("
            SELECT t.*, p.monthly_price 
            FROM saas_tenants t
            JOIN saas_packages p ON t.package_id = p.id
            WHERE t.status = 'Active'
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
}
