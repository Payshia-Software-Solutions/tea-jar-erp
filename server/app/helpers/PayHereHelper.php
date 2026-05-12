<?php
/**
 * PayHereHelper
 * Implements PayHere Sri Lanka integration.
 */
require_once __DIR__ . '/PaymentGatewayInterface.php';

class PayHereHelper implements PaymentGatewayInterface {
    
    public function getIdentifier() {
        return 'payhere';
    }

    public function prepareCheckout($order, $items, $customer, $settings) {
        $isSandbox = (int)($settings['payhere_is_sandbox'] ?? 1) === 1;
        
        if ($isSandbox) {
            $mId = $settings['payhere_merchant_id_sandbox'] ?? $settings['payhere_merchant_id'] ?? '';
            $mSecret = $settings['payhere_secret_sandbox'] ?? $settings['payhere_secret'] ?? '';
        } else {
            $mId = $settings['payhere_merchant_id_live'] ?? $settings['payhere_merchant_id'] ?? '';
            $mSecret = $settings['payhere_secret_live'] ?? $settings['payhere_secret'] ?? '';
        }

        $amount = (float)$order->total_amount;
        $orderNo = $order->order_no;
        $currency = 'LKR';

        return [
            'merchant_id' => $mId,
            'order_id' => $orderNo,
            'items' => 'Order ' . $orderNo,
            'amount' => number_format($amount, 2, '.', ''),
            'currency' => $currency,
            'first_name' => $customer['first_name'] ?? '',
            'last_name' => $customer['last_name'] ?? '',
            'email' => $customer['email'] ?? '',
            'phone' => $customer['phone'] ?? '',
            'address' => $order->billing_address ?? '',
            'city' => '', // Could be extracted from address
            'country' => 'Sri Lanka',
            'hash' => $this->generateHash($mId, $orderNo, $amount, $currency, $mSecret),
            'checkout_url' => $isSandbox 
                ? 'https://sandbox.payhere.lk/pay/checkout' 
                : 'https://www.payhere.lk/pay/checkout'
        ];
    }

    public function validateNotification($data, $settings) {
        $isSandbox = (int)($settings['payhere_is_sandbox'] ?? 1) === 1;
        
        if ($isSandbox) {
            $mSecret = $settings['payhere_merchant_secret_sandbox'] ?? $settings['payhere_secret_sandbox'] ?? $settings['payhere_merchant_secret'] ?? $settings['payhere_secret'] ?? '';
        } else {
            $mSecret = $settings['payhere_merchant_secret_live'] ?? $settings['payhere_secret_live'] ?? $settings['payhere_merchant_secret'] ?? $settings['payhere_secret'] ?? '';
        }

        $merchantId = $data['merchant_id'] ?? '';
        $orderId = $data['order_id'] ?? '';
        $payhereAmount = $data['payhere_amount'] ?? '';
        $payhereCurrency = $data['payhere_currency'] ?? '';
        $statusCode = $data['status_code'] ?? '';
        $md5sig = $data['md5sig'] ?? '';

        // PayHere requires amount to be formatted to 2 decimal places for the hash
        $formattedAmount = number_format((float)$payhereAmount, 2, '.', '');

        $localHash = strtoupper(
            md5(
                $merchantId . 
                $orderId . 
                $formattedAmount . 
                $payhereCurrency . 
                $statusCode . 
                strtoupper(md5($mSecret))
            )
        );

        return $localHash === $md5sig;
    }

    private function generateHash($merchantId, $orderId, $amount, $currency, $merchantSecret) {
        return strtoupper(
            md5(
                $merchantId . 
                $orderId . 
                number_format($amount, 2, '.', '') . 
                $currency . 
                strtoupper(md5($merchantSecret))
            )
        );
    }
}
