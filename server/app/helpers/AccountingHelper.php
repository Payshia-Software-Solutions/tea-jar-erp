<?php
/**
 * AccountingHelper
 * Maps business events to automated journal entries.
 */
class AccountingHelper {
    public function __construct() {
        require_once '../app/models/Journal.php';
        require_once '../app/models/Account.php';
    }
    
    /**
     * Post Accounting for a New Invoice
     */
    public static function getMappedId($key) {
        require_once '../app/models/AccountMapping.php';
        $map = new AccountMapping();
        $res = $map->getMapping($key);
        return $res ? (int)$res->account_id : null;
    }

    public static function postInvoice($invoiceId) {
        $invoiceModel = new Invoice();
        $journalModel = new Journal();

        $invoice = $invoiceModel->getById($invoiceId);
        if (!$invoice) return false;

        $arId = self::getMappedId('invoice_ar');
        $revId = self::getMappedId('invoice_revenue');
        $taxId = self::getMappedId('invoice_tax');
        $discId = self::getMappedId('sales_discount');
        $cogsId = self::getMappedId('cogs_account');
        $invId = self::getMappedId('grn_inventory');

        if (!$arId || !$revId || !$taxId) {
            error_log("AccountingHelper: Missing core mappings for Invoice.");
            return false;
        }

        $items = [];
        $description = "Sale Invoice #{$invoice->invoice_no}";

        // 1. REVENUE COMPONENT
        // DEBIT: Accounts Receivable
        $items[] = [
            'account_id' => $arId,
            'debit' => $invoice->grand_total,
            'credit' => 0,
            'partner_type' => 'Customer',
            'partner_id' => $invoice->customer_id,
            'notes' => $description
        ];

        // DEBIT: Sales Discount (if any)
        if ($invoice->discount_total > 0 && $discId) {
            $items[] = [
                'account_id' => $discId,
                'debit' => $invoice->discount_total,
                'credit' => 0,
                'notes' => 'Discount allowed'
            ];
        }

        // CREDIT: Revenue (Gross)
        $items[] = [
            'account_id' => $revId,
            'debit' => 0,
            'credit' => $invoice->subtotal + ($discId ? 0 : -$invoice->discount_total), 
            'notes' => 'Sales Revenue'
        ];

        // CREDIT: Sales Tax
        if ($invoice->tax_total > 0) {
            $items[] = [
                'account_id' => $taxId,
                'debit' => 0,
                'credit' => $invoice->tax_total,
                'notes' => 'Tax on ' . $description
            ];
        }

        // 2. COGS COMPONENT (Integrated into same entry)
        $invItems = $invoiceModel->getItems($invoiceId);
        $totalCost = 0;
        foreach ($invItems as $ii) {
            $totalCost += ($ii->cost_price * $ii->quantity);
        }

        if ($totalCost > 0 && $cogsId && $invId) {
            $items[] = [
                'account_id' => $cogsId, 
                'debit' => $totalCost, 
                'credit' => 0, 
                'notes' => "COGS for {$invoice->invoice_no}"
            ];
            $items[] = [
                'account_id' => $invId, 
                'debit' => 0, 
                'credit' => $totalCost, 
                'notes' => "Inventory reduction"
            ];
        }

        // POST SINGLE COMPREHENSIVE ENTRY
        return $journalModel->post([
            'entry_date' => $invoice->issue_date,
            'description' => $description,
            'ref_type' => 'Invoice',
            'ref_id' => $invoiceId,
            'userId' => $invoice->created_by,
            'items' => $items
        ]);
    }

    public static function postPayment($invoiceId, $paymentData) {
        $invoiceModel = new Invoice();
        $journalModel = new Journal();
        $invoice = $invoiceModel->getById($invoiceId);
        if (!$invoice) return false;

        $arId = self::getMappedId('invoice_ar');
        $cashId = self::getMappedId('payment_cash');
        $bankId = self::getMappedId('payment_bank');
        $destId = ($paymentData['payment_method'] === 'Cash') ? $cashId : $bankId;

        if (!$arId || !$destId) return false;

        $items = [
            ['account_id' => $destId, 'debit' => $paymentData['amount'], 'credit' => 0, 'notes' => "Payment for #{$invoice->invoice_no}"],
            ['account_id' => $arId, 'debit' => 0, 'credit' => $paymentData['amount'], 'partner_type' => 'Customer', 'partner_id' => $invoice->customer_id, 'notes' => "Payment received"]
        ];

        return $journalModel->post([
            'entry_date' => $paymentData['payment_date'] ?? date('Y-m-d'),
            'description' => "Payment for Invoice #{$invoice->invoice_no}",
            'ref_type' => 'Payment', 'ref_id' => $invoiceId, 'userId' => $paymentData['userId'], 'items' => $items
        ]);
    }

    public static function postGRN($grnId) {
        require_once '../app/models/GoodsReceiveNote.php';
        $grnModel = new GoodsReceiveNote();
        $journalModel = new Journal();
        $data = $grnModel->getById($grnId);
        if (!$data) return false;
        $grn = $data->grn;

        $invId = self::getMappedId('grn_inventory');
        $apId = self::getMappedId('grn_ap');
        $taxId = self::getMappedId('purchase_tax');

        if (!$invId || !$apId) return false;

        $items = [];
        $description = "GRN Receipt #{$grn->grn_number}";

        // DEBIT: Inventory (Net)
        $items[] = [
            'account_id' => $invId,
            'debit' => (float)($grn->subtotal ?? 0),
            'credit' => 0,
            'notes' => $description
        ];

        // DEBIT: Input Tax
        if ((float)($grn->tax_total ?? 0) > 0 && $taxId) {
            $items[] = [
                'account_id' => $taxId,
                'debit' => (float)$grn->tax_total,
                'credit' => 0,
                'notes' => 'Input Tax on ' . $description
            ];
        }

        // CREDIT: Accounts Payable
        $items[] = [
            'account_id' => $apId,
            'debit' => 0,
            'credit' => (float)($grn->subtotal ?? 0) + (float)($grn->tax_total ?? 0),
            'partner_type' => 'Supplier',
            'partner_id' => $grn->supplier_id,
            'notes' => $description
        ];

        return $journalModel->post([
            'entry_date' => $grn->received_at,
            'description' => $description,
            'ref_type' => 'GRN', 'ref_id' => $grnId, 'userId' => $grn->created_by, 'items' => $items
        ]);
    }

    public static function postStockAdjustment($adjId) {
        require_once '../app/models/StockAdjustment.php';
        $adjModel = new StockAdjustment();
        $journalModel = new Journal();
        $data = $adjModel->getById($adjId);
        if (!$data) return false;
        $adj = $data->adjustment;
        $lines = $data->items;

        $invId = self::getMappedId('grn_inventory');
        $adjExpId = self::getMappedId('inventory_adjustment');

        if (!$invId || !$adjExpId) return false;

        $totalValueChange = 0;
        foreach ($lines as $line) {
            // Standard approach: value variance at current cost
            $cost = (float)($line->unit_cost ?? 0);
            $totalValueChange += ($line->qty_change * $cost);
        }

        if (abs($totalValueChange) < 0.01) return true;

        $items = [];
        if ($totalValueChange > 0) {
            // STOCK GAIN
            $items[] = ['account_id' => $invId, 'debit' => $totalValueChange, 'credit' => 0, 'notes' => 'Inventory Gain'];
            $items[] = ['account_id' => $adjExpId, 'debit' => 0, 'credit' => $totalValueChange, 'notes' => 'Stock variance entry'];
        } else {
            // STOCK LOSS
            $items[] = ['account_id' => $adjExpId, 'debit' => abs($totalValueChange), 'credit' => 0, 'notes' => 'Inventory Loss'];
            $items[] = ['account_id' => $invId, 'debit' => 0, 'credit' => abs($totalValueChange), 'notes' => 'Stock variance entry'];
        }

        return $journalModel->post([
            'entry_date' => $adj->adjusted_at,
            'description' => "Stock Adjustment #{$adj->adjustment_number}",
            'ref_type' => 'Adjustment', 'ref_id' => $adjId, 'userId' => $adj->created_by, 'items' => $items
        ]);
    }

    public static function postSalesReturn($returnId, $data) {
        $journalModel = new Journal();
        $retId = self::getMappedId('sales_return');
        $arId = self::getMappedId('invoice_ar');
        if (!$retId || !$arId) return false;

        $items = [
            ['account_id' => $retId, 'debit' => $data['total_amount'], 'credit' => 0, 'notes' => 'Sales Return'],
            ['account_id' => $arId, 'debit' => 0, 'credit' => $data['total_amount'], 'partner_type' => 'Customer', 'partner_id' => $data['customer_id'] ?? null, 'notes' => 'Return credit']
        ];

        return $journalModel->post([
            'entry_date' => $data['return_date'] ?? date('Y-m-d'),
            'description' => "Sales Return #{$returnId}",
            'ref_type' => 'SalesReturn', 'ref_id' => $returnId, 'userId' => $data['userId'], 'items' => $items
        ]);
    }

    public static function postSupplierPayment($paymentId, $data) {
        $journalModel = new Journal();
        $apId = self::getMappedId('grn_ap');
        $cashId = self::getMappedId('payment_cash');
        $bankId = self::getMappedId('payment_bank');
        $payAccId = ($data['payment_method'] === 'Cash') ? $cashId : $bankId;

        if (!$apId || !$payAccId) return false;

        $items = [
            ['account_id' => $apId, 'debit' => $data['amount'], 'credit' => 0, 'partner_type' => 'Supplier', 'partner_id' => $data['supplier_id'], 'notes' => 'Payment out'],
            ['account_id' => $payAccId, 'debit' => 0, 'credit' => $data['amount'], 'notes' => 'Fund reduction']
        ];

        return $journalModel->post([
            'entry_date' => $data['payment_date'] ?? date('Y-m-d'),
            'description' => "Supplier Payment #{$paymentId}",
            'ref_type' => 'SupplierPayment', 'ref_id' => $paymentId, 'userId' => $data['userId'], 'items' => $items
        ]);
    }

    public static function postPurchaseReturn($returnId, $data) {
        $journalModel = new Journal();
        $apId = self::getMappedId('grn_ap');
        $purRetId = self::getMappedId('purchase_return');
        $taxId = self::getMappedId('purchase_tax');

        if (!$apId || !$purRetId) return false;

        $total = (float)($data['total_amount'] ?? 0);
        $taxTotal = (float)($data['tax_total'] ?? 0);
        $subtotal = (float)($data['subtotal'] ?? ($total - $taxTotal));

        $items = [];
        // DEBIT: Accounts Payable (Full amount)
        $items[] = [
            'account_id' => $apId, 
            'debit' => $total, 
            'credit' => 0, 
            'partner_type' => 'Supplier', 
            'partner_id' => $data['supplier_id'], 
            'notes' => 'Purchase Return'
        ];

        // CREDIT: Purchase Return / Inventory (Net)
        $items[] = [
            'account_id' => $purRetId, 
            'debit' => 0, 
            'credit' => $subtotal, 
            'notes' => 'Inventory reduction (Net)'
        ];

        // CREDIT: Input Tax (Reversal)
        if ($taxTotal > 0 && $taxId) {
            $items[] = [
                'account_id' => $taxId, 
                'debit' => 0, 
                'credit' => $taxTotal, 
                'notes' => 'Tax reversal on return'
            ];
        }

        return $journalModel->post([
            'entry_date' => $data['return_date'] ?? date('Y-m-d'),
            'description' => "Purchase Return #{$returnId}",
            'ref_type' => 'PurchaseReturn', 'ref_id' => $returnId, 'userId' => $data['userId'], 'items' => $items
        ]);
    }

    public static function postIssueNote($issueNoteId) {
        require_once '../app/models/IssueNote.php';
        $isnModel = new IssueNote();
        $journalModel = new Journal();
        $data = $isnModel->getById($issueNoteId);
        if (!$data || !$data->issue_note) return false;
        $isn = $data->issue_note;
        $lines = $data->items;

        $expId = self::getMappedId('issue_note_expense');
        $invId = self::getMappedId('issue_note_inventory');

        if (!$expId || !$invId) return false;

        $totalCost = 0;
        foreach ($lines as $line) {
            $totalCost += (float)$line->line_total;
        }

        if ($totalCost <= 0) return true;

        $ccName = $isn->cost_center_name ?? ("Location ID: " . $isn->cost_center_id);
        $description = "Issue Note #{$isn->issue_number} to {$ccName}";
        $items = [
            [
                'account_id' => $expId,
                'debit' => $totalCost,
                'credit' => 0,
                'notes' => $description
            ],
            [
                'account_id' => $invId,
                'debit' => 0,
                'credit' => $totalCost,
                'notes' => 'Inventory reduction'
            ]
        ];

        return $journalModel->post([
            'entry_date' => $isn->issued_at ?? date('Y-m-d H:i:s'),
            'description' => $description,
            'ref_type' => 'IssueNote',
            'ref_id' => $issueNoteId,
            'userId' => $isn->created_by,
            'items' => $items
        ]);
    }

    public static function postExpenseVoucher($expenseId, $data) {
        require_once '../app/models/Journal.php';
        require_once '../app/models/Account.php';
        $journalModel = new Journal();
        
        $items = [
            [
                'account_id' => $data['expense_account_id'],
                'debit' => $data['amount'],
                'credit' => 0,
                'notes' => ($data['payee_name'] ?? '') . ' - ' . ($data['notes'] ?? 'Expense payment')
            ],
            [
                'account_id' => $data['payment_account_id'],
                'debit' => 0,
                'credit' => $data['amount'],
                'notes' => 'Voucher payment'
            ]
        ];

        return $journalModel->post([
            'entry_date' => $data['payment_date'] ?? date('Y-m-d'),
            'description' => "Expense Voucher #{$expenseId}",
            'ref_type' => 'Expense',
            'ref_id' => $expenseId,
            'userId' => $data['userId'],
            'items' => $items
        ]);
    }
}
