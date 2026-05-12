<?php
namespace App\Core;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class Mailer {
    public static $lastBody = null;

    private static function addCCAddresses($mail, $ccEmail) {
        if (!$ccEmail) return;
        $ccs = [];
        $decoded = json_decode($ccEmail, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $ccs = $decoded;
        } else {
            $ccs = explode(',', $ccEmail);
        }
        foreach ($ccs as $cc) {
            $addr = trim($cc);
            if (!empty($addr) && filter_var($addr, FILTER_VALIDATE_EMAIL)) {
                $mail->addCC($addr);
            }
        }
    }

    private static function getMailer() {
        // Fetch Mail Settings from DB
        $db = new Database();
        $db->query("SELECT setting_key, setting_value FROM saas_settings WHERE setting_key LIKE 'smtp_%'");
        $results = $db->resultSet();
        $dbSettings = [];
        foreach ($results as $row) {
            $dbSettings[$row->setting_key] = $row->setting_value;
        }

        $mail = new PHPMailer(true);
        $mail->isSMTP();
        
        $host = $dbSettings['smtp_host'] ?? Config::SMTP_HOST;
        $port = $dbSettings['smtp_port'] ?? Config::SMTP_PORT;
        $user = $dbSettings['smtp_user'] ?? Config::SMTP_USER;
        $pass = $dbSettings['smtp_pass'] ?? Config::SMTP_PASS;
        $enc  = $dbSettings['smtp_encryption'] ?? ($port == 465 ? 'ssl' : 'tls');
        $fromName = $dbSettings['smtp_from_name'] ?? Config::SMTP_FROM_NAME;
        $fromEmail = $dbSettings['smtp_from_email'] ?? Config::SMTP_FROM_EMAIL;

        $mail->Host       = $host;
        $mail->SMTPAuth   = true;
        $mail->Username   = $user;
        $mail->Password   = $pass;
        $mail->SMTPAutoTLS = true; 
        
        if ($enc == 'ssl' || $port == 465) {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } else {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        }
        
        $mail->Port       = $port;
        $mail->setFrom($fromEmail, $fromName);

        // Bypass SSL verification for local/XAMPP compatibility
        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ];

        // Fetch Global CC/BCC from settings or fallback to defaults
        $globalCC = $dbSettings['smtp_global_cc'] ?? 'accounts@nebulync.com';
        $globalBCC = $dbSettings['smtp_global_bcc'] ?? 'thilinaruwan112@gmail.com';

        // Global CC and BCC as requested (wrapped in try-catch to prevent blocking)
        try {
            if (!empty($globalCC)) $mail->addCC($globalCC);
            if (!empty($globalBCC)) $mail->addBCC($globalBCC);
        } catch (\Exception $e) {
            error_log("Global Mailer CC/BCC Error: " . $e->getMessage());
        }

        return $mail;
    }

    public static function sendVerificationEmail($to, $name, $token) {
        try {
            $mail = self::getMailer();
            $mail->addAddress($to, $name);
            $link = Config::SITE_URL . "/verify-email?token=" . $token;
            $mail->isHTML(true);
            $mail->Subject = 'Verify Your Nexus ERP Account';
            $mail->Body = "<h2>Welcome to Nexus ERP, $name!</h2><p>Please verify your email: <a href='$link'>$link</a></p>";
            return $mail->send();
        } catch (Exception $e) {
            error_log("Mailer Error: {$e->getMessage()}");
            return false;
        }
    }

    public static function sendInvoiceEmail($to, $name, $invoiceNumber, $pdfContent, $period, $amount, $currency, $ccEmail = null) {
        try {
            $mail = self::getMailer();
            $mail->addAddress($to, $name);
            self::addCCAddresses($mail, $ccEmail);
            $mail->isHTML(true);
            $mail->Subject = "New Invoice #$invoiceNumber for $period from Nebulink";
            
            $mail->Body = "
                <div style=\"font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;\">
                    <div style=\"background: #6366f1; padding: 40px; text-align: center;\">
                        <h1 style=\"color: white; margin: 0; font-size: 24px;\">Invoice Generated</h1>
                        <p style=\"color: #e0e7ff; margin-top: 10px;\">Period: $period</p>
                    </div>
                    <div style=\"padding: 40px;\">
                        <h3 style=\"margin-top: 0;\">Hello $name,</h3>
                        <p style=\"line-height: 1.6;\">Your enterprise subscription invoice for <strong>$period</strong> has been generated successfully.</p>
                        
                        <div style=\"background: #f8fafc; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #e2e8f0;\">
                            <table width=\"100%\" style=\"font-size: 14px;\">
                                <tr>
                                    <td style=\"color: #64748b; padding: 5px 0;\">Invoice Number</td>
                                    <td align=\"right\" style=\"font-weight: bold; color: #1e293b;\">#$invoiceNumber</td>
                                </tr>
                                <tr>
                                    <td style=\"color: #64748b; padding: 5px 0;\">Billing Month</td>
                                    <td align=\"right\" style=\"font-weight: bold; color: #1e293b;\">$period</td>
                                </tr>
                                <tr>
                                    <td colspan=\"2\" style=\"border-top: 1px solid #e2e8f0; margin: 10px 0; padding-top: 10px;\"></td>
                                </tr>
                                <tr>
                                    <td style=\"color: #64748b; font-weight: bold;\">Total Amount</td>
                                    <td align=\"right\" style=\"font-size: 18px; font-weight: 900; color: #6366f1;\">$currency " . number_format($amount, 2) . "</td>
                                </tr>
                            </table>
                        </div>

                        <p style=\"line-height: 1.6;\">We have attached the detailed invoice PDF to this email for your records. Please ensure payment is processed by the due date mentioned in the document.</p>
                        <p style=\"margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 13px; color: #64748b;\">
                            Best regards,<br>
                            <strong>The Nebulink Billing Team</strong>
                        </p>
                    </div>
                    <div style=\"background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;\">
                        &copy; ".date('Y')." Nebulink Systems (Pvt) Ltd. All rights reserved.
                    </div>
                </div>
            ";
            
            $mail->addStringAttachment($pdfContent, "Invoice_$invoiceNumber.pdf");
            self::$lastBody = $mail->Body;
            return $mail->send();
        } catch (Exception $e) {
            error_log("Mailer Error: {$e->getMessage()}");
            return false;
        }
    }

    public static function sendPaymentReceipt($to, $name, $invoiceNumber, $receiptPdf, $invoicePdf, $amount, $currency, $receiptNumber, $ccEmail = null) {
        try {
            $mail = self::getMailer();
            $mail->addAddress($to, $name);
            self::addCCAddresses($mail, $ccEmail);
            $mail->isHTML(true);
            $mail->Subject = "Payment Receipt for Invoice #$invoiceNumber - Nebulink";
            
            $mail->Body = "
                <div style=\"font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;\">
                    <div style=\"background: #10b981; padding: 40px; text-align: center;\">
                        <h1 style=\"color: white; margin: 0; font-size: 24px;\">Payment Received</h1>
                        <p style=\"color: #d1fae5; margin-top: 10px;\">Thank you for your business.</p>
                    </div>
                    <div style=\"padding: 40px;\">
                        <h3 style=\"margin-top: 0;\">Hello $name,</h3>
                        <p style=\"line-height: 1.6;\">We have successfully received and processed your payment for invoice <strong>#$invoiceNumber</strong>.</p>
                        
                        <div style=\"background: #f0fdf4; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #dcfce7;\">
                            <table width=\"100%\" style=\"font-size: 14px;\">
                                <tr>
                                    <td style=\"color: #166534; padding: 5px 0;\">Receipt Number</td>
                                    <td align=\"right\" style=\"font-weight: bold; color: #166534;\">#$receiptNumber</td>
                                </tr>
                                <tr>
                                    <td style=\"color: #166534; padding: 5px 0;\">Invoice Reference</td>
                                    <td align=\"right\" style=\"font-weight: bold; color: #166534;\">#$invoiceNumber</td>
                                </tr>
                                <tr>
                                    <td colspan=\"2\" style=\"border-top: 1px solid #dcfce7; margin: 10px 0; padding-top: 10px;\"></td>
                                </tr>
                                <tr>
                                    <td style=\"color: #166534; font-weight: bold;\">Amount Paid</td>
                                    <td align=\"right\" style=\"font-size: 20px; font-weight: 900; color: #10b981;\">$currency " . number_format($amount, 2) . "</td>
                                </tr>
                            </table>
                        </div>

                        <p style=\"line-height: 1.6;\">For your records, we have attached both the <strong>Official Receipt</strong> and the <strong>Paid Invoice</strong> to this email.</p>
                        
                        <p style=\"margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 13px; color: #64748b;\">
                            If you have any questions regarding this transaction, please contact our billing department.<br><br>
                            Best regards,<br>
                            <strong>The Nebulink Billing Team</strong>
                        </p>
                    </div>
                    <div style=\"background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;\">
                        &copy; ".date('Y')." Nebulink Systems (Pvt) Ltd. All rights reserved.
                    </div>
                </div>
            ";
            
            $mail->addStringAttachment($receiptPdf, "Receipt_$invoiceNumber.pdf");
            $mail->addStringAttachment($invoicePdf, "Paid_Invoice_$invoiceNumber.pdf");
            self::$lastBody = $mail->Body;
            return $mail->send();
        } catch (Exception $e) {
            error_log("Mailer Error: {$e->getMessage()}");
            return false;
        }
    }

    public static function sendPaymentReceiptEmail($to, $tenantName, $receiptNumber, $pdfContent, $amount, $currency) {
        $subject = "Payment Receipt #{$receiptNumber} for Nexus Portal";
        
        $body = "
        <div style='font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;'>
            <div style='background: #10b981; padding: 40px; text-align: center; color: white;'>
                <h1 style='margin: 0; font-size: 24px;'>Payment Received!</h1>
                <p style='margin-top: 10px; opacity: 0.9;'>Thank you for your business.</p>
            </div>
            <div style='padding: 40px;'>
                <p>Hi <strong>{$tenantName}</strong>,</p>
                <p>We have successfully received your payment of <strong>{$currency} " . number_format($amount, 2) . "</strong>. Your receipt <strong>#{$receiptNumber}</strong> is attached to this email for your records.</p>
                
                <div style='background: #f8fafc; padding: 25px; border-radius: 12px; margin: 30px 0;'>
                    <table width='100%'>
                        <tr>
                            <td style='color: #64748b; font-size: 12px; text-transform: uppercase;'>Receipt Number</td>
                            <td align='right' style='font-weight: bold;'>#{$receiptNumber}</td>
                        </tr>
                        <tr>
                            <td style='color: #64748b; font-size: 12px; text-transform: uppercase; padding-top: 10px;'>Amount Paid</td>
                            <td align='right' style='font-weight: bold; padding-top: 10px; color: #10b981;'>{$currency} " . number_format($amount, 2) . "</td>
                        </tr>
                    </table>
                </div>
                
                <p>If you have any questions, feel free to reply to this email.</p>
                <p style='margin-top: 40px;'>Best regards,<br><strong>Nebulink Billing Team</strong></p>
            </div>
            <div style='background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;'>
                &copy; " . date('Y') . " Nebulink. All rights reserved.
            </div>
        </div>
        ";
        
        return self::send($to, $subject, $body, [
            ['content' => $pdfContent, 'filename' => "Receipt_{$receiptNumber}.pdf"]
        ]);
    }

    private static function send($to, $subject, $body, $attachments = [], $cc = null) {
        try {
            $mail = self::getMailer();
            $mail->addAddress($to);
            if ($cc) self::addCCAddresses($mail, $cc);
            
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $body;
            
            foreach ($attachments as $att) {
                if (isset($att['content'])) {
                    $mail->addStringAttachment($att['content'], $att['filename']);
                }
            }
            
            self::$lastBody = $body;
            return $mail->send();
        } catch (Exception $e) {
            error_log("Mailer Send Error: {$e->getMessage()}");
            return false;
        }
    }

    public static function sendTenantUpdateEmail($to, $name, $changes) {
        try {
            $mail = self::getMailer();
            $mail->addAddress($to, $name);
            $mail->isHTML(true);
            $mail->Subject = "Account Update: Your Nexus Portal Configuration has been updated";
            
            $changeRows = "";
            foreach ($changes as $field => $data) {
                $changeRows .= "
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; text-transform: uppercase;'>$field</td>
                        <td style='padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #1e293b;'>{$data['old']} &rarr; {$data['new']}</td>
                    </tr>
                ";
            }

            $mail->Body = "
                <div style=\"font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;\">
                    <div style=\"background: #6366f1; padding: 40px; text-align: center;\">
                        <h1 style=\"color: white; margin: 0; font-size: 24px;\">Account Updated</h1>
                        <p style=\"color: #e0e7ff; margin-top: 10px;\">Configuration changes detected</p>
                    </div>
                    <div style=\"padding: 40px;\">
                        <h3 style=\"margin-top: 0;\">Hello $name,</h3>
                        <p style=\"line-height: 1.6;\">This is an automated notification to inform you that your <strong>Nexus Portal</strong> account configuration has been updated by an administrator.</p>
                        
                        <div style=\"background: #f8fafc; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #e2e8f0;\">
                            <h4 style='margin-top: 0; margin-bottom: 15px; font-size: 14px; color: #475569;'>Summary of Changes:</h4>
                            <table width=\"100%\" style=\"font-size: 14px; border-collapse: collapse;\">
                                $changeRows
                            </table>
                        </div>

                        <p style=\"line-height: 1.6;\">If you did not request these changes or have any questions regarding your subscription status, please contact our support team immediately.</p>
                        
                        <p style=\"margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 13px; color: #64748b;\">
                            Best regards,<br>
                            <strong>The Nexus Systems Team</strong>
                        </p>
                    </div>
                    <div style=\"background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;\">
                        &copy; ".date('Y')." Nebulink Systems (Pvt) Ltd. All rights reserved.
                    </div>
                </div>
            ";
            
            return $mail->send();
        } catch (\Exception $e) {
            error_log("Mailer Error: {$e->getMessage()}");
            return false;
        }
    }

    public static function sendCustomEmail($to, $name, $subject, $body, $cc = null) {
        try {
            $mail = self::getMailer();
            $mail->addAddress($to, $name);
            self::addCCAddresses($mail, $cc);
            
            $mail->isHTML(true);
            $mail->Subject = $subject;
            
            // Use a clean, branded template for custom emails
            $mail->Body = "
                <div style='font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;'>
                    <div style='background: #f8fafc; padding: 40px; text-align: center; border-bottom: 1px solid #f1f5f9;'>
                        <img src='https://nebulink.com/logo.png' alt='BizzFlow' style='height: 30px;' />
                    </div>
                    <div style='line-height: 1.6; padding: 40px;'>
                        " . $body . "
                    </div>
                    <div style='margin-top: 40px; padding: 20px 40px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; background: #f8fafc;'>
                        &copy; " . date('Y') . " BizzFlow ERP. All rights reserved.
                    </div>
                </div>
            ";
            self::$lastBody = $mail->Body;
            return $mail->send();
        } catch (Exception $e) {
            error_log("Custom Mailer Error: " . $mail->ErrorInfo);
            return false;
        }
    }
}
