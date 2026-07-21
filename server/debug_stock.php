<?php
require_once 'app/core/Database.php';
require_once 'config/config.php';
require_once 'app/core/Model.php';
require_once 'app/models/CustomerStock.php';

$db = new Database();

// Get the latest invoice ID
$db->query("SELECT id, invoice_no, customer_id FROM invoices ORDER BY id DESC LIMIT 1");
$latestInvoice = $db->single();

echo "Running CustomerStock->createFromInvoice for Invoice " . $latestInvoice->id . " Customer " . $latestInvoice->customer_id . "\n";

$model = new CustomerStock();
try {
    $model->createFromInvoice($latestInvoice->id, $latestInvoice->customer_id);
    echo "Success calling createFromInvoice\n";
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}

$db->query("SELECT * FROM customer_stocks WHERE invoice_id = :invoice_id");
$db->bind(':invoice_id', $latestInvoice->id);
$stocks = $db->resultSet();
echo "Stocks created: " . count($stocks) . "\n";
print_r($stocks);
