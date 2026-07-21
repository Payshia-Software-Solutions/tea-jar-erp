<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Models\TenantModel;
use App\Models\SaaSInvoiceModel;
use App\Core\Mailer;


class BillingController extends Controller {
    
    private function checkAuth() {
        if (!isset($_SESSION['admin_id'])) {
            return $this->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }
        return true;
    }

    private function checkSuperAdmin() {
        if (!isset($_SESSION['admin_role']) || $_SESSION['admin_role'] !== 'super_admin') {
            return $this->json(['status' => 'error', 'message' => 'Forbidden'], 403);
        }
        return true;
    }

    public function runBillingCycle() {
        if ($this->checkAuth() !== true) return;
        if ($this->checkSuperAdmin() !== true) return;

        $tenantModel = new TenantModel();
        $invoiceModel = new SaaSInvoiceModel();
        
        $tenantId = $_GET['tenant_id'] ?? null;
        $currentMonth = $_GET['period'] ?? date('F Y');
        
        if ($tenantId) {
            $tenants = [$tenantModel->getByIdWithPackage($tenantId)];
            if (!$tenants[0]) return $this->json(['status' => 'error', 'message' => 'Tenant not found'], 404);
        } else {
            $tenants = $tenantModel->getAllActive();
        }
        
        $count = 0;
        $dueDate = date('Y-m-d', strtotime('+10 days'));

        foreach ($tenants as $tenant) {
            $tid = is_object($tenant) ? $tenant->id : $tenant['id'];
            $basePrice = is_object($tenant) ? ($tenant->monthly_price ?? 0) : ($tenant['monthly_price'] ?? 0);
            $currency = is_object($tenant) ? ($tenant->currency ?? 'USD') : ($tenant['currency'] ?? 'USD');
            $ccEmail = is_object($tenant) ? ($tenant->billing_cc_email ?? null) : ($tenant['billing_cc_email'] ?? null);
            $tenantName = is_object($tenant) ? $tenant->name : $tenant['name'];
            $adminEmail = is_object($tenant) ? $tenant->admin_email : $tenant['admin_email'];
            $address = is_object($tenant) ? ($tenant->address ?? '') : ($tenant['address'] ?? '');

            // Currency Conversion Logic (Base: USD)
            $monthlyPrice = $basePrice;
            $rates = \App\Services\ExchangeRateService::getRates();
            $exchangeRate = $rates[$currency] ?? 1;
            
            // Get active source for transparency
            $db = new \App\Core\Database();
            $db->query("SELECT setting_value FROM saas_settings WHERE setting_key = 'exchange_rate_source'");
            $source = $db->single()->setting_value ?? 'Market';

            if ($currency !== 'USD' && isset($rates[$currency])) {
                $monthlyPrice = $basePrice * $exchangeRate;
            }

            // Check if invoice already exists for this month
            if (!$invoiceModel->exists($tid, $currentMonth)) {
                $invoiceNumber = $invoiceModel->generateNextInvoiceNumber();
                
                // Add billing info for PDF
                $pdfData = (object)[
                    'invoice_number' => $invoiceNumber,
                    'tenant_name' => $tenantName,
                    'address' => $address,
                    'admin_email' => $adminEmail,
                    'amount' => $monthlyPrice,
                    'currency' => $currency,
                    'exchange_rate' => $exchangeRate,
                    'source' => strtoupper($source),
                    'billing_month' => $currentMonth,
                    'due_date' => $dueDate,
                    'status' => 'Pending',
                    'created_at' => date('Y-m-d H:i:s'),
                    'package_name' => is_object($tenant) ? ($tenant->package_name ?? 'Custom Plan') : ($tenant['package_name'] ?? 'Custom Plan'),
                    'base_price' => $basePrice
                ];
                
                $invoiceId = $invoiceModel->create([
                    'tenant_id' => $tid,
                    'invoice_number' => $invoiceNumber,
                    'amount' => $monthlyPrice,
                    'currency' => $currency,
                    'exchange_rate' => $exchangeRate,
                    'source' => $source,
                    'billing_month' => $currentMonth,
                    'due_date' => $dueDate,
                    'status' => 'Pending'
                ]);

                if ($invoiceId) {
                    $count++;
                    // Generate PDF & Send Email
                    try {
                        $pdf = \App\Services\InvoicePDF::generate($pdfData);
                        $description = ($pdfData->package_name ?? 'Subscription') . ' - ' . $tenantName;
                        $sent = \App\Core\Mailer::sendInvoiceEmail($adminEmail, $tenantName, $invoiceNumber, $pdf, $currentMonth, $monthlyPrice, $currency, $ccEmail, $description);
                        
                        // Update Email Status & Log
                        $invoiceModel->update($invoiceId, [
                            'email_status' => $sent ? 'Sent' : 'Failed',
                            'last_sent_at' => date('Y-m-d H:i:s')
                        ]);
                        $subject = "New Invoice #$invoiceNumber for $currentMonth from Nebulynch in nexus portal - $tenantName";
                        $invoiceModel->logEmail($invoiceId, 'Invoice', $adminEmail, $ccEmail, $sent ? 'Sent' : 'Failed', null, $subject, Mailer::$lastBody);
                    } catch (\Throwable $e) {
                        error_log("Billing Circle Email Error: " . $e->getMessage());
                        $invoiceModel->logEmail($invoiceId, 'Invoice', $adminEmail, $ccEmail, 'Failed', $e->getMessage());
                    }
                }
            }
        }

        return $this->json([
            'status' => 'success', 
            'message' => $tenantId ? "Processed billing for " . (is_object($tenants[0]) ? $tenants[0]->name : $tenants[0]['name']) : "Generated $count invoices",
            'processed' => $count
        ]);
    }

    public function getMyHistory() {
        if ($this->checkAuth() !== true) return;
        
        if (!isset($_SESSION['tenant_id'])) {
            return $this->json(['status' => 'error', 'message' => 'Not a tenant account'], 403);
        }

        $model = new SaaSInvoiceModel();
        $history = $model->getByTenant($_SESSION['tenant_id']);
        
        return $this->json(['status' => 'success', 'data' => $history]);
    }

    public function listAll() {
        if ($this->checkAuth() !== true) return;
        if ($this->checkSuperAdmin() !== true) return;

        $model = new SaaSInvoiceModel();
        $invoices = $model->getAllWithTenants();
        
        return $this->json(['status' => 'success', 'data' => $invoices]);
    }

    public function download() {
        if ($this->checkAuth() !== true) return;
        
        $id = $_GET['id'] ?? null;
        if (!$id) return $this->json(['status' => 'error', 'message' => 'ID required'], 400);

        $model = new SaaSInvoiceModel();
        $invoice = $model->getFullDetail($id);

        if (!$invoice) return $this->json(['status' => 'error', 'message' => 'Invoice not found'], 404);

        // Security: Clients can only download their own
        if ($_SESSION['admin_role'] !== 'super_admin' && $invoice->tenant_id != $_SESSION['tenant_id']) {
            return $this->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        $type = $_GET['type'] ?? null;
        $isReceipt = ($type === 'receipt') || (!$type && $invoice->status === 'Paid');
        
        // Force invoice if requested
        if ($type === 'invoice') $isReceipt = false;

        $pdf = \App\Services\InvoicePDF::generate($invoice, $isReceipt);
        $prefix = $isReceipt ? 'Receipt_' : 'Invoice_';
        
        ob_clean();
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="'.$prefix.$invoice->invoice_number.'.pdf"');
        echo $pdf;
        exit;
    }

    public function resend() {
        if ($this->checkAuth() !== true) return;
        if ($this->checkSuperAdmin() !== true) return;

        $id = $_GET['id'] ?? null;
        $type = $_GET['type'] ?? 'invoice';
        
        if (!$id) return $this->json(['status' => 'error', 'message' => 'ID required'], 400);

        $model = new SaaSInvoiceModel();
        $invoice = $model->getFullDetail($id);

        if (!$invoice) return $this->json(['status' => 'error', 'message' => 'Invoice not found'], 404);

        $isReceipt = ($type === 'receipt') || ($invoice->status === 'Paid' && $type !== 'invoice');
        
        if ($isReceipt) {
            $receiptPdf = \App\Services\InvoicePDF::generate($invoice, true);
            $invoicePdf = \App\Services\InvoicePDF::generate($invoice, false);
            $sent = \App\Core\Mailer::sendPaymentReceipt($invoice->admin_email, $invoice->tenant_name, $invoice->invoice_number, $receiptPdf, $invoicePdf, $invoice->amount, $invoice->currency, $invoice->receipt_number, $invoice->billing_cc_email);
        } else {
            $pdf = \App\Services\InvoicePDF::generate($invoice, false);
            $description = ($invoice->package_name ?? 'Subscription') . ' - ' . $invoice->tenant_name;
            $sent = \App\Core\Mailer::sendInvoiceEmail($invoice->admin_email, $invoice->tenant_name, $invoice->invoice_number, $pdf, $invoice->billing_month, $invoice->amount, $invoice->currency, $invoice->billing_cc_email, $description);
        }

        $model->update($id, [
            'email_status' => $sent ? 'Resent' : 'Failed',
            'last_sent_at' => date('Y-m-d H:i:s')
        ]);

        $model->logEmail($id, $isReceipt ? 'Receipt' : 'Invoice', $invoice->admin_email, $invoice->billing_cc_email, $sent ? 'Resent' : 'Failed');

        return $this->json([
            'status' => $sent ? 'success' : 'error', 
            'message' => $sent ? 'Email sent successfully' : 'Failed to send email'
        ]);
    }

    public function update() {
        if ($this->checkAuth() !== true) return;
        if ($this->checkSuperAdmin() !== true) return;

        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? null;
        if (!$id) return $this->json(['status' => 'error', 'message' => 'ID required'], 400);

        $model = new SaaSInvoiceModel();
        
        // If status is being changed to Paid, we might want to send receipt
        $oldStatus = null;
        if (isset($data['status']) && $data['status'] === 'Paid') {
            $invoice = $model->getFullDetail($id);
            $oldStatus = $invoice->status;
        }

        unset($data['id']);
        if ($model->update($id, $data)) {
            // Trigger receipt if newly paid
            if (isset($data['status']) && $data['status'] === 'Paid' && $oldStatus !== 'Paid') {
                $invoice = $model->getFullDetail($id);
                $receiptPdf = \App\Services\InvoicePDF::generate($invoice, true);
                $invoicePdf = \App\Services\InvoicePDF::generate($invoice, false);
                $sent = \App\Core\Mailer::sendPaymentReceipt($invoice->admin_email, $invoice->tenant_name, $invoice->invoice_number, $receiptPdf, $invoicePdf, $invoice->amount, $invoice->currency, $invoice->receipt_number, $invoice->billing_cc_email);
                
                $model->update($id, [
                    'email_status' => $sent ? 'Sent' : 'Failed',
                    'last_sent_at' => date('Y-m-d H:i:s')
                ]);
                $model->logEmail($id, 'Receipt', $invoice->admin_email, $invoice->billing_cc_email, $sent ? 'Sent' : 'Failed');
            }
            return $this->json(['status' => 'success', 'message' => 'Invoice updated']);
        }
        
        return $this->json(['status' => 'error', 'message' => 'Update failed'], 500);
    }

    public function deleteInvoice() {
        if ($this->checkAuth() !== true) return;
        if ($this->checkSuperAdmin() !== true) return;

        $id = $_GET['id'] ?? null;
        if (!$id) return $this->json(['status' => 'error', 'message' => 'Invoice ID required'], 400);

        $model = new SaaSInvoiceModel();
        if ($model->delete($id)) {
            return $this->json(['status' => 'success', 'message' => 'Invoice deleted successfully']);
        }
        return $this->json(['status' => 'error', 'message' => 'Failed to delete invoice'], 500);
    }

    public function processPayment() {
        if ($this->checkAuth() !== true) return;
        if ($this->checkSuperAdmin() !== true) return;

        $data = json_decode(file_get_contents('php://input'), true);
        $invoiceId = $data['invoice_id'] ?? null;
        $method = $data['payment_method'] ?? 'Bank Transfer';
        $transactionId = $data['transaction_id'] ?? '';
        $amountPaid = $data['amount'] ?? null;

        if (!$invoiceId) return $this->json(['status' => 'error', 'message' => 'Invoice ID required'], 400);

        $invoiceModel = new SaaSInvoiceModel();
        $invoice = $invoiceModel->getFullDetail($invoiceId);
        if (!$invoice) return $this->json(['status' => 'error', 'message' => 'Invoice not found'], 404);

        $amountToPay = $amountPaid ?? $invoice->amount;
        $receiptNumber = 'RCP-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid()), 0, 4));

        $db = new \App\Core\Database();
        $db->query("INSERT INTO saas_payments (invoice_id, receipt_number, amount, payment_method, transaction_id) VALUES (:iid, :rn, :amt, :pm, :tid)");
        $db->bind(':iid', $invoiceId);
        $db->bind(':rn', $receiptNumber);
        $db->bind(':amt', $amountToPay);
        $db->bind(':pm', $method);
        $db->bind(':tid', $transactionId);
        
        if ($db->execute()) {
            // Update Invoice Status
            $invoiceModel->update($invoiceId, ['status' => 'Paid']);

            // Prepare Data for Email (Attach both Receipt and Paid Invoice)
            try {
                $updatedInvoice = $invoiceModel->getFullDetail($invoiceId);
                $receiptPdf = \App\Services\InvoicePDF::generate($updatedInvoice, true);
                $invoicePdf = \App\Services\InvoicePDF::generate($updatedInvoice, false);
                $sent = \App\Core\Mailer::sendPaymentReceipt($updatedInvoice->admin_email, $updatedInvoice->tenant_name, $updatedInvoice->invoice_number, $receiptPdf, $invoicePdf, $updatedInvoice->amount, $updatedInvoice->currency, $updatedInvoice->receipt_number, $updatedInvoice->billing_cc_email);
                
                $invoiceModel->update($invoiceId, [
                    'email_status' => $sent ? 'Sent' : 'Failed',
                    'last_sent_at' => date('Y-m-d H:i:s')
                ]);
                $subject = "Payment Receipt for Invoice #$updatedInvoice->invoice_number - $updatedInvoice->tenant_name | Nebulync";
                $invoiceModel->logEmail($invoiceId, 'Receipt', $updatedInvoice->admin_email, $updatedInvoice->billing_cc_email, $sent ? 'Sent' : 'Failed', null, $subject, Mailer::$lastBody);
            } catch (\Exception $e) {}

            return $this->json(['status' => 'success', 'message' => 'Payment processed and receipt sent']);
        }

        return $this->json(['status' => 'error', 'message' => 'Failed to process payment'], 500);
    }

    public function getPayments() {
        if ($this->checkAuth() !== true) return;
        
        $id = $_GET['id'] ?? null;
        if (!$id) return $this->json(['status' => 'error', 'message' => 'Invoice ID required'], 400);

        $model = new SaaSInvoiceModel();
        $payments = $model->getPayments($id);
        
        return $this->json(['status' => 'success', 'data' => $payments]);
    }
    public function listAllPayments() {
        if ($this->checkAuth() !== true) return;
        if ($this->checkSuperAdmin() !== true) return;

        $model = new SaaSInvoiceModel();
        $payments = $model->getAllPayments();
        
        return $this->json(['status' => 'success', 'data' => $payments]);
    }

    public function deletePayment() {
        if ($this->checkAuth() !== true) return;
        if ($this->checkSuperAdmin() !== true) return;

        $id = $_GET['id'] ?? null;
        if (!$id) return $this->json(['status' => 'error', 'message' => 'Payment ID required'], 400);

        $db = new \App\Core\Database();
        // Get invoice ID before deleting so we can check if it was the last payment
        $db->query("SELECT invoice_id FROM saas_payments WHERE id = :id");
        $db->bind(':id', $id);
        $payment = $db->single();

        if (!$payment) return $this->json(['status' => 'error', 'message' => 'Payment not found'], 404);

        $db->query("DELETE FROM saas_payments WHERE id = :id");
        $db->bind(':id', $id);
        
        if ($db->execute()) {
            // Check if any payments remain for this invoice
            $db->query("SELECT COUNT(*) as count FROM saas_payments WHERE invoice_id = :iid");
            $db->bind(':iid', $payment->invoice_id);
            $remaining = $db->single()->count;

            if ($remaining == 0) {
                // If no payments left, revert invoice to Pending
                $invoiceModel = new SaaSInvoiceModel();
                $invoiceModel->update($payment->invoice_id, ['status' => 'Pending']);
            }

            return $this->json(['status' => 'success', 'message' => 'Payment deleted successfully']);
        }

        return $this->json(['status' => 'error', 'message' => 'Failed to delete payment'], 500);
    }

    public function getEmailLogs() {
        $this->checkAuth();
        $model = new SaaSInvoiceModel();
        $logs = $model->getEmailLogs();
        return $this->json(['status' => 'success', 'data' => $logs]);
    }
}
