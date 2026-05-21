<?php
/**
 * Quotation Controller
 */
class QuotationController extends Controller {
    private $quotationModel;

    public function __construct() {
        $this->quotationModel = $this->model('Quotation');
    }

    // GET /api/quotation/list
    public function list() {
        $this->requirePermission('sales.read');
        $filters = $_GET;
        $quotations = $this->quotationModel->getAll($filters);
        $this->success($quotations);
    }

    // GET /api/quotation/details/:id
    public function details($id) {
        $this->requirePermission('sales.read');
        $quotation = $this->quotationModel->getById($id);
        if (!$quotation) $this->error('Quotation not found', 404);

        $quotation->items = $this->quotationModel->getItems($id);
        $quotation->taxes = $this->quotationModel->getAppliedTaxes($id);

        $this->success($quotation);
    }

    // POST /api/quotation/create
    public function create() {
        $u = $this->requirePermission('sales.create');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) $this->error('Invalid input', 400);

        // Generate Quotation Number
        $data['userId'] = $u['sub'];
        $data['location_id'] = $this->currentLocationId($u);
        $data['quotation_no'] = $this->generateQuotationNumber($data['location_id']);

        $quotationId = $this->quotationModel->create($data);
        if ($quotationId) {
            if (!empty($data['items'])) {
                $this->quotationModel->addItems($quotationId, $data['items']);
            }
            if (!empty($data['taxes'])) {
                $this->quotationModel->addAppliedTaxes($quotationId, $data['taxes']);
            }
            $this->success(['id' => $quotationId], 'Quotation created');
        } else {
            $this->error('Failed to create quotation');
        }
    }

    // POST /api/quotation/set_status/:id
    public function set_status($id) {
        $this->requirePermission('sales.update');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);

        $data = json_decode(file_get_contents('php://input'), true);
        $status = $data['status'] ?? null;
        if (!$status) $this->error('Status required', 400);

        if ($this->quotationModel->updateStatus($id, $status)) {
            $this->success([], 'Status updated');
        } else {
            $this->error('Failed to update status');
        }
    }

    // POST /api/quotation/convert_to_invoice/:id
    public function convert_to_invoice($id) {
        $u = $this->requirePermission('sales.create');
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') $this->error('Method Not Allowed', 405);

        $quotation = $this->quotationModel->getById($id);
        if (!$quotation) $this->error('Quotation not found', 404);
        if ($quotation->status === 'Converted') $this->error('Already converted', 400);

        $items = $this->quotationModel->getItems($id);
        $taxes = $this->quotationModel->getAppliedTaxes($id);

        require_once '../app/models/Invoice.php';
        $invoiceModel = new Invoice();

        // Prepare Invoice Data
        $invData = [
            'invoice_no' => $this->generateInvoiceNumber($quotation->location_id),
            'customer_id' => $quotation->customer_id,
            'location_id' => $quotation->location_id,
            'issue_date' => date('Y-m-d'),
            'due_date' => date('Y-m-d', strtotime('+7 days')),
            'subtotal' => $quotation->subtotal,
            'tax_total' => $quotation->tax_total,
            'shipping_fee' => $quotation->shipping_cost,
            'grand_total' => $quotation->grand_total,
            'is_international' => $quotation->is_international,
            'shipping_provider_id' => $quotation->shipping_provider_id,
            'shipping_country' => $quotation->shipping_country,
            'shipping_address' => $quotation->shipping_address,
            'notes' => "Converted from Quotation #" . $quotation->quotation_no,
            'userId' => $u['sub']
        ];

        $invoiceId = $invoiceModel->create($invData);
        if ($invoiceId) {
            // Copy Items
            $invItems = [];
            foreach ($items as $item) {
                $invItems[] = [
                    'item_id' => $item->item_id,
                    'description' => $item->description,
                    'item_type' => $item->item_type,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'line_total' => $item->line_total
                ];
            }
            $invoiceModel->addItems($invoiceId, $invItems, $u['sub']);

            // Copy Taxes
            $invTaxes = [];
            foreach ($taxes as $tax) {
                $invTaxes[] = [
                    'name' => $tax->tax_name,
                    'code' => $tax->tax_code,
                    'rate_percent' => $tax->rate_percent,
                    'amount' => $tax->amount
                ];
            }
            $invoiceModel->addAppliedTaxes($invoiceId, $invTaxes);

            // Update Quotation
            $this->quotationModel->setConvertedInvoiceId($id, $invoiceId);

            $this->success(['invoice_id' => $invoiceId], 'Quotation converted to Invoice');
        } else {
            $this->error('Failed to create invoice from quotation');
        }
    }

    private function generateInvoiceNumber($locationId = 1) {
        require_once '../app/helpers/DocumentSequenceHelper.php';
        return DocumentSequenceHelper::getStandardDocNo('INV', $locationId);
    }

    private function generateQuotationNumber($locationId = 1) {
        require_once '../app/helpers/DocumentSequenceHelper.php';
        return DocumentSequenceHelper::getStandardDocNo('QTN', $locationId);
    }
}
