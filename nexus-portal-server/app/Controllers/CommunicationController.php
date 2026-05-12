<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Models\TenantModel;
use App\Models\SaaSInvoiceModel;
use App\Core\Mailer;

class CommunicationController extends Controller {

    private function checkAuth() {
        if (!isset($_SESSION['admin_id'])) {
            return $this->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }
        return true;
    }

    public function getRecipients() {
        if ($this->checkAuth() !== true) return;

        $tenantModel = new TenantModel();
        $requestModel = new \App\Models\RequestModel();

        $tenants = $tenantModel->getAll();
        $requests = $requestModel->getAll();

        return $this->json([
            'status' => 'success',
            'data' => [
                'tenants' => array_map(function($t) {
                    return [
                        'id' => "tenant:{$t->id}",
                        'name' => $t->name,
                        'email' => $t->admin_email,
                        'group' => 'Active Tenants',
                        'cc' => $t->billing_cc_email ?? null
                    ];
                }, $tenants),
                'requests' => array_map(function($r) {
                    return [
                        'id' => "request:{$r->id}",
                        'name' => $r->company_name,
                        'email' => $r->email,
                        'group' => 'ERP Requests',
                        'cc' => null
                    ];
                }, $requests)
            ]
        ]);
    }

    public function sendCustom() {
        if ($this->checkAuth() !== true) return;

        $data = $this->getPostData();
        $recipients = $data['recipients'] ?? []; // Array of {email, name, id, cc}
        $subject = $data['subject'] ?? '';
        $body = $data['body'] ?? '';

        if (empty($recipients) || empty($subject) || empty($body)) {
            return $this->json(['status' => 'error', 'message' => 'All fields are required'], 400);
        }

        $tenantModel = new TenantModel();
        
        $success = 0;
        $failed = 0;

        foreach ($recipients as $recipient) {
            $to = $recipient['email'];
            $name = $recipient['name'];
            $cc = $recipient['cc'] ?? null;
            $idStr = $recipient['id'] ?? '';

            $sent = Mailer::sendCustomEmail($to, $name, $subject, $body, $cc);
            if ($sent) $success++; else $failed++;
            
            // Log the communication
            $invoiceId = null;
            // Extract tenant ID if it's a tenant
            if (strpos($idStr, 'tenant:') === 0) {
                // We could potentially link this to the tenant better in the log
                // For now, keep as generic log
            }
            
            $tenantModel->logEmail(null, 'Broadcast', $to, $cc, $sent ? 'Sent' : 'Failed', null, $subject, Mailer::$lastBody);
        }

        return $this->json([
            'status' => 'success', 
            'message' => "Successfully sent to $success recipients" . ($failed > 0 ? ", $failed failed." : "")
        ]);
    }
}
