<?php
namespace App\Services;

use Dompdf\Dompdf;
use Dompdf\Options;

class ReceiptPDF {
    public static function generate($data) {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');
        
        $dompdf = new Dompdf($options);
        
        $logoPath = __DIR__ . '/../../public/' . ($data->company_logo ?? 'nebulync-logo.png');
        $logoData = "";
        if (file_exists($logoPath)) {
            $logoData = 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath));
        }

        $html = "
        <html>
        <head>
            <style>
                body { font-family: 'DejaVu Sans', sans-serif; color: #333; margin: 0; padding: 30px; }
                .header { margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
                .title { font-size: 28px; font-weight: 900; color: #10b981; text-transform: uppercase; letter-spacing: -0.02em; }
                .receipt-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
                .label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #94a3b8; margin-bottom: 5px; }
                .value { font-size: 14px; font-weight: bold; color: #1e293b; }
                .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .table th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; }
                .table td { padding: 15px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
                .total-row { background: #10b981; color: white; }
                .total-row td { border: none; font-weight: bold; font-size: 18px; }
                .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6; }
            </style>
        </head>
        <body>
            <div class='header'>
                <table width='100%'>
                    <tr>
                        <td width='60%'>
                            <img src='{$logoData}' style='height: 40px; margin-bottom: 10px;' />
                            <div style='font-size: 12px; line-height: 1.4;'>
                                <strong>{$data->company_name}</strong><br>
                                ".nl2br($data->company_address)."
                            </div>
                        </td>
                        <td align='right' valign='top'>
                            <div class='title'>Payment Receipt</div>
                            <div style='font-size: 14px; font-weight: bold; color: #10b981; margin-top: 5px;'>#{$data->receipt_number}</div>
                            <div style='font-size: 11px; color: #94a3b8; margin-top: 5px;'>Date: ".date('M d, Y', strtotime($data->payment_date))."</div>
                        </td>
                    </tr>
                </table>
            </div>

            <div class='receipt-box'>
                <table width='100%'>
                    <tr>
                        <td>
                            <div class='label'>Received From</div>
                            <div class='value'>{$data->tenant_name}</div>
                        </td>
                        <td align='right'>
                            <div class='label'>Invoice Reference</div>
                            <div class='value'>#{$data->invoice_number}</div>
                        </td>
                    </tr>
                </table>
            </div>

            <table class='table'>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th align='right'>Amount Paid</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Subscription Payment - {$data->billing_month}</td>
                        <td align='right'>{$data->currency} " . number_format($data->amount, 2) . "</td>
                    </tr>
                    <tr class='total-row'>
                        <td align='right'>Total Received</td>
                        <td align='right'>{$data->currency} " . number_format($data->amount, 2) . "</td>
                    </tr>
                </tbody>
            </table>

            <div style='font-size: 12px; color: #64748b; background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px;'>
                <strong>Payment Method:</strong> {$data->payment_method}<br>
                <strong>Transaction ID:</strong> " . ($data->transaction_id ?? 'N/A') . "
            </div>

            <div class='footer'>
                Thank you for your payment. This is a computer-generated receipt.<br>
                &copy; ".date('Y')." {$data->company_name}. All rights reserved.
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
