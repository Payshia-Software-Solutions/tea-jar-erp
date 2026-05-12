<?php
namespace App\Services;

use Dompdf\Dompdf;
use Dompdf\Options;

class InvoicePDF {
    public static function generate($data, $isReceipt = false) {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);
        
        $dompdf = new Dompdf($options);
        
        $title = $isReceipt ? "RECEIPT" : "INVOICE";
        $color = $isReceipt ? "#10b981" : "#6366f1";
        $packageName = 'Custom Plan';
        if (isset($data->package_name) && !empty($data->package_name)) {
            $packageName = $data->package_name;
        } elseif (isset($data['package_name']) && !empty($data['package_name'])) {
            $packageName = $data['package_name'];
        }
        
        // Calculate Period Dates
        $monthTime = strtotime($data->billing_month ?? 'now') ?: time();
        $periodStart = date('M 01, Y', $monthTime);
        $periodEnd = date('M t, Y', $monthTime);
        
        // Fetch Company Info from Settings
        $db = new \App\Core\Database();
        $db->query("SELECT setting_key, setting_value FROM saas_settings WHERE setting_key LIKE 'company_%'");
        $settingsArr = $db->resultSet();
        $company = [];
        foreach ($settingsArr as $s) $company[$s->setting_key] = $s->setting_value;

        // Logo Path
        $logoName = $company['company_logo'] ?? 'nebulink-logo-croped.png';
        $basePath = dirname(__DIR__, 2);
        if (strpos($logoName, 'http') === 0) {
            // It's a full URL
            $logoPath = $logoName;
        } elseif (strpos($logoName, 'ui/') === 0) {
            // Fallback for UI logos if they exist on the same server, else this might need a full URL
            $logoPath = dirname($basePath) . '/nexus-portal-ui/public/' . substr($logoName, 3);
        } else {
            $logoPath = $basePath . '/public/' . $logoName;
        }

        $logoData = "";
        if (!empty($logoPath)) {
            try {
                // If it's a local file, check if it exists
                if (strpos($logoPath, 'http') !== 0) {
                    if (file_exists($logoPath)) {
                        $type = pathinfo($logoPath, PATHINFO_EXTENSION);
                        $imgData = file_get_contents($logoPath);
                        $logoData = 'data:image/' . $type . ';base64,' . base64_encode($imgData);
                    }
                } else {
                    // It's a URL - need to encode spaces for file_get_contents
                    $encodedPath = str_replace(' ', '%20', $logoPath);
                    $imgData = @file_get_contents($encodedPath);
                    if ($imgData) {
                        $type = pathinfo($logoPath, PATHINFO_EXTENSION);
                        $logoData = 'data:image/' . $type . ';base64,' . base64_encode($imgData);
                    }
                }
            } catch (\Exception $e) {
                error_log("Logo Load Error: " . $e->getMessage());
            }
        }

        $html = "
        <html>
        <head>
            <style>
                html, body, table, td, th, div, span, b, strong, p { font-family: 'DejaVu Sans', sans-serif !important; }
                body { color: #1e293b; padding: 30px; margin: 0; }
                .header { margin-bottom: 40px; }
                .title { font-size: 28px; font-weight: bold; color: #000; text-transform: uppercase; letter-spacing: -0.02em; }
                .company-info { font-size: 11px; color: #64748b; line-height: 1.5; }
                .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                .table th { background: #f8fafc; padding: 15px; text-align: left; font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; color: #475569; }
                .table td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #1e293b; }
                .total-box { background: #f8fafc; padding: 25px; border-radius: 16px; text-align: right; border: 1px solid #e2e8f0; }
                .footer { font-size: 10px; color: #94a3b8; text-align: center; margin-top: 80px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
                .badge { padding: 4px 12px; border-radius: 999px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
            </style>
        </head>
        <body>
            <div class='header'>
                <table width='100%'>
                    <tr>
                        <td width='60%'>
                            " . ($logoData ? "<img src='{$logoData}' style='height: 35px; margin-bottom: 15px;' />" : "") . "
                            <div class='company-info'>
                                <strong>{$company['company_name']}</strong><br>
                                ".nl2br($company['company_address'])."
                            </div>
                        </td>
                        <td align='right' valign='top'>
                            <div class='title'>{$title}</div>
                            " . ($isReceipt && isset($data->receipt_number) ? "
                            <div style='font-size: 14px; font-weight: bold; color: #10b981; margin-top: 5px;'>#{$data->receipt_number}</div>
                            <div style='font-size: 11px; color: #64748b; margin-top: 3px;'>Ref Invoice: #{$data->invoice_number}</div>
                            " : "
                            <div style='font-size: 14px; font-weight: bold; color: #6366f1; margin-top: 5px;'>#{$data->invoice_number}</div>
                            ") . "
                            <div style='font-size: 11px; color: #94a3b8; margin-top: 5px;'>" . ($isReceipt ? "Paid Date" : "Issued") . ": " . date('M d, Y', strtotime($isReceipt ? ($data->paid_at ?? $data->created_at) : $data->created_at)) . "</div>
                        </td>
                    </tr>
                </table>
            </div>

            <hr style='border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 40px;' />

            <table width='100%' style='margin-bottom: 50px;'>
                <tr>
                    <td width='50%'>
                        <div style='font-size: 10px; font-weight: bold; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; letter-spacing: 0.05em;'>Client Information</div>
                        <div style='font-weight: bold; font-size: 18px; color: #000; margin-bottom: 4px;'>{$data->tenant_name}</div>
                        <div style='font-size: 13px; color: #64748b; margin-bottom: 4px;'>{$data->admin_email}</div>
                        <div style='font-size: 12px; color: #64748b; line-height: 1.4; max-width: 250px;'>".nl2br($data->address)."</div>
                    </td>
                    <td align='right'>
                        <div style='font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; letter-spacing: 0.05em;'>Payment Details</div>
                        " . ($isReceipt && isset($data->receipt_number) ? "
                        <div style='font-size: 13px; color: #1e293b; margin-bottom: 4px;'>Receipt #: <span style='font-weight: bold;'>{$data->receipt_number}</span></div>
                        <div style='font-size: 13px; color: #1e293b; margin-bottom: 4px;'>Paid Date: <span style='font-weight: bold;'>".date('M d, Y', strtotime($data->paid_at ?? $data->created_at))."</span></div>
                        <div style='font-size: 13px; color: #1e293b; margin-bottom: 4px;'>Method: <span style='font-weight: bold;'>".($data->payment_method ?? 'Bank Transfer')."</span></div>
                        " . ($data->transaction_id ? "<div style='font-size: 11px; color: #64748b; margin-bottom: 4px;'>TXID: {$data->transaction_id}</div>" : "") . "
                        " : "
                        <div style='font-size: 13px; color: #1e293b; margin-bottom: 4px;'>Due Date: <span style='font-weight: bold;'>".date('M d, Y', strtotime($data->due_date ?? 'now'))."</span></div>
                        <div style='font-size: 13px; margin-bottom: 4px;'>Status: <span class='badge' style='background: ".($data->status == 'Paid' ? '#ecfdf5' : '#fff7ed')."; color: ".($data->status == 'Paid' ? '#10b981' : '#f59e0b').";'>{$data->status}</span></div>
                        ") . "
                        " . ($data->currency !== 'USD' ? "
                        <div style='font-size: 11px; color: #64748b; margin-top: 5px;'>
                            Billing Currency: <strong>{$data->currency}</strong><br>
                            Rate: 1 USD = " . number_format($data->exchange_rate ?? 1, 4) . "<br>
                            Source: " . ($data->source ?? 'MARKET') . "
                        </div>" : "") . "
                    </td>
                </tr>
            </table>

            <table class='table'>
                " . ($isReceipt ? "
                <thead>
                    <tr>
                        <th width='70%'>Payment Information</th>
                        <th align='right'>Amount Paid</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <div style='font-weight: bold; font-size: 14px;'>Payment for Subscription Invoice #{$data->invoice_number}</div>
                            <div style='font-size: 11px; color: #64748b; margin-top: 6px;'>Service Period: {$data->billing_month}</div>
                            <div style='font-size: 11px; color: #64748b;'>Method: " . ($data->payment_method ?? 'Bank Transfer') . "</div>
                            <div style='font-size: 11px; color: #64748b;'>Receipt Reference: " . ($data->receipt_number ?? 'N/A') . "</div>
                        </td>
                        <td align='right' style='font-weight: bold; font-size: 18px; color: #10b981;'>{$data->currency} " . number_format($data->amount, 2) . "</td>
                    </tr>
                </tbody>
                " : "
                <thead>
                    <tr>
                        <th width='60%'>Description of Services</th>
                        <th align='center'>Period</th>
                        <th align='right'>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <div style='font-weight: bold; font-size: 14px;'>BizzFlow Enterprise - {$packageName}</div>
                            <div style='font-size: 11px; color: #64748b; margin-top: 6px;'>
                                Recurring subscription fee for the active cloud environment.
                                " . (isset($data->base_price) ? "<br><strong>Plan Base Rate: $" . number_format($data->base_price, 2) . " USD</strong>" : "") . "
                            </div>
                            <div style='font-size: 11px; color: #64748b; margin-top: 4px;'>Service Interval: {$periodStart} — {$periodEnd}</div>
                        </td>
                        <td align='center' style='color: #64748b; font-weight: bold;'>{$data->billing_month}</td>
                        <td align='right' style='font-weight: bold; font-size: 15px;'>{$data->currency} " . number_format($data->amount, 2) . "</td>
                    </tr>
                </tbody>
                ") . "
            </table>

            <table width='100%'>
                <tr>
                    <td width='50%'>
                        <div style='font-size: 11px; color: #94a3b8; line-height: 1.6;'>
                            <strong>" . ($isReceipt ? "Acknowledgment:" : "Notes & Terms:") . "</strong><br>
                            " . ($isReceipt ? "Thank you for your prompt payment. Your subscription remains active and up to date." : "Please process payment within the due date to avoid service interruption.") . "<br>
                            For billing inquiries, contact billing@nebulink.com.
                        </div>
                    </td>
                    <td width='50%' align='right'>
                        <div class='total-box'>
                            <div style='font-size: 11px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 5px;'>" . ($isReceipt ? "Amount Paid" : "Total Amount Due") . "</div>
                            <div style='font-size: 32px; font-weight: 900; color: #000;'>{$data->currency} " . number_format($data->amount, 2) . "</div>
                            <div style='font-size: 11px; color: #94a3b8; margin-top: 5px;'>All prices are in {$data->currency}</div>
                            " . ($data->currency !== 'USD' ? "
                            <div style='margin-top: 10px; font-size: 10px; color: #64748b;'>
                                Rate: 1 USD = " . number_format($data->exchange_rate ?? 1, 4) . " {$data->currency}<br>
                                Source: " . ($data->source ?? 'MARKET') . "
                            </div>" : "") . "
                        </div>
                    </td>
                </tr>
            </table>

            <div class='footer'>
                <strong>" . ($company['company_name'] ?? 'Nebulink Systems (Pvt) Ltd') . "</strong><br>
                This is an official document generated by BizzFlow Suite.<br>
                &copy; ".date('Y')." Nebulink. All rights reserved.
            </div>
        </body>
        </html>
        ";
        
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();
        
        return $dompdf->output();
    }
}
