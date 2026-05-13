<?php
/**
 * Public Order Controller
 * Provides public API access to order/invoice details using API Key authentication.
 */
class PublicOrderController extends Controller {
    private $invoiceModel;
    private $apiClientModel;
    private $db;

    public function __construct() {
        $this->invoiceModel = $this->model('Invoice');
        $this->apiClientModel = $this->model('ApiClient');
        $this->db = new Database();
    }

    private function handlePublicCors() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: X-API-Key, Content-Type');
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            if (!empty($apiKey) && !empty($origin) && $this->apiClientModel->validate($apiKey, $origin)) {
                header('Access-Control-Allow-Origin: ' . $origin);
            } else {
                header('Access-Control-Allow-Origin: *');
            }
            http_response_code(204);
            exit;
        }
        if (!empty($origin) && !empty($apiKey) && $this->apiClientModel->validate($apiKey, $origin)) {
            header('Access-Control-Allow-Origin: ' . $origin);
        } else {
            header('Access-Control-Allow-Origin: *');
        }
    }

    private function validatePublicApiKey() {
        $this->handlePublicCors();
        $headerKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if (empty($headerKey) || !$this->apiClientModel->validate($headerKey, $origin)) {
            $this->error('Unauthorized', 403);
        }
    }

    /**
     * POST /api/publicorder/upload-slip
     * Uploads a bank transfer slip proof.
     */
    public function upload_slip() {
        $this->handlePublicCors();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
        }

        $this->validatePublicApiKey();

        if (!isset($_FILES['slip']) || $_FILES['slip']['error'] !== UPLOAD_ERR_OK) {
            $errCode = $_FILES['slip']['error'] ?? 'unknown';
            error_log("PublicOrder uploadSlip: No file or error code $errCode");
            $this->error('No file uploaded or upload error code: ' . $errCode, 400);
        }

        $uploadDir = '../public/uploads/slips/';
        if (!is_dir($uploadDir)) {
            if (!mkdir($uploadDir, 0777, true)) {
                error_log("PublicOrder uploadSlip: Failed to create directory $uploadDir");
                $this->error('Failed to create upload directory.', 500);
            }
        }

        $filename = 'slip_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . pathinfo($_FILES['slip']['name'], PATHINFO_EXTENSION);
        $targetFile = $uploadDir . $filename;

        if (move_uploaded_file($_FILES['slip']['tmp_name'], $targetFile)) {
            $this->success(['path' => 'uploads/slips/' . $filename], 'Slip uploaded successfully.');
        } else {
            error_log("PublicOrder uploadSlip: Failed to move file to $targetFile");
            $this->error('Failed to save file.', 500);
        }
    }

    /**
     * POST /api/publicorder/create
     * Creates a new online order.
     */
    public function create() {
        $this->handlePublicCors();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->error('Method Not Allowed', 405);
        }

        $this->validatePublicApiKey();

        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (!$data || empty($data['items']) || empty($data['total_amount'])) {
            $this->error('Invalid order data', 400);
        }

        require_once '../app/models/OnlineOrder.php';
        $orderModel = new OnlineOrder();

        // 1. Handle Customer
        $customerId = $data['customer_id'] ?? null;
        if (!$customerId && !empty($data['customer_details']['email'])) {
            // Find or create guest customer
            $customerModel = $this->model('Customer');
            $this->db->query("SELECT id FROM customers WHERE email = :email LIMIT 1");
            $this->db->bind(':email', $data['customer_details']['email']);
            $existing = $this->db->single();
            if ($existing) {
                $customerId = $existing->id;
            } else {
                // Create minimal customer record
                $cData = [
                    'name' => $data['customer_details']['name'] ?? 'Guest',
                    'email' => $data['customer_details']['email'],
                    'phone' => $data['customer_details']['phone'] ?? null,
                    'address' => $data['shipping_address'] ?? null,
                    'order_type' => 'External',
                    'is_active' => 1
                ];
                $customerModel->create($cData);
                $customerId = $this->db->lastInsertId();
            }
        }
        $data['customer_id'] = $customerId;
        $data['total_amount'] = (float)$data['total_amount'];

        // 1.5 Calculate Taxes and Subtotal
        require_once '../app/models/Tax.php';
        require_once '../app/models/StorefrontSetting.php';
        require_once '../app/models/ServiceLocation.php';
        $taxModel = new Tax();
        $settingsModel = new StorefrontSetting();
        $locModel = new ServiceLocation();

        $locationId = $data['location_id'] ?? 1;
        $location = $locModel->getById($locationId);
        $settings = $settingsModel->getAll($locationId);
        $taxInclusive = ($settings['ecom_tax_inclusive'] ?? '0') === '1';

        $taxIds = !empty($location->allowed_taxes_json) ? json_decode($location->allowed_taxes_json, true) : [];
        $taxes = $taxModel->getByIds($taxIds);
        
        $additiveRate = 0;
        $compoundMultiplier = 1.0;
        foreach ($taxes as $tx) {
            $rate = (float)$tx->rate_percent / 100;
            if (($tx->apply_on ?? 'base') === 'base_plus_previous') {
                $compoundMultiplier *= (1 + $rate);
            } else {
                $additiveRate += $rate;
            }
        }
        $totalMultiplier = ((1 + $additiveRate) * $compoundMultiplier) - 1;

        $calculatedSubtotal = 0;
        $calculatedTaxTotal = 0;

        foreach ($data['items'] as &$item) {
            $sentPrice = (float)$item['unit_price'];
            $qty = (float)$item['quantity'];

            if ($taxInclusive) {
                // Sent price and discount are inclusive, extract base
                $sentDiscount = (float)($item['discount'] ?? 0);
                $netInclusivePrice = $sentPrice - $sentDiscount;
                
                $basePrice = $sentPrice / (1 + $totalMultiplier);
                $netBasePrice = $netInclusivePrice / (1 + $totalMultiplier);
                $baseDiscount = $basePrice - $netBasePrice; // Calculate discount from base price difference
                
                $itemTax = $netInclusivePrice - $netBasePrice;
            } else {
                // Sent price and discount are base, add tax
                $basePrice = $sentPrice;
                $baseDiscount = (float)($item['discount'] ?? 0);
                $netBasePrice = $basePrice - $baseDiscount;
                
                // Tax is calculated on the net base price
                $itemTax = $netBasePrice * $totalMultiplier;
            }

            // Update item to use base price and base discount for storage
            $item['unit_price'] = $basePrice;
            $item['discount'] = $baseDiscount;
            $item['line_total'] = ($basePrice - $baseDiscount) * $qty;
            
            $calculatedSubtotal += ($basePrice * $qty);
            $calculatedTaxTotal += ($itemTax * $qty);
        }

        // Add to data for OnlineOrder model
        $totalLineDiscount = array_reduce($data['items'], function($acc, $item) {
            return $acc + ((float)($item['discount'] ?? 0) * (float)($item['quantity'] ?? 1));
        }, 0);
        
        $netSubtotal = $calculatedSubtotal - $totalLineDiscount;

        // Calculate Detailed Tax Breakdown for Storage
        $taxBreakdown = [];
        $calculatedTaxSum = 0;
        
        // 1. Process all "base" taxes first
        $additiveTaxesSum = 0;
        foreach ($taxes as $tx) {
            if (($tx->apply_on ?? 'base') === 'base') {
                $rate = (float)$tx->rate_percent / 100;
                $amount = round($netSubtotal * $rate, 2);
                $additiveTaxesSum += $amount;
                
                $taxBreakdown[] = [
                    'id' => $tx->id,
                    'name' => $tx->name,
                    'rate_percent' => $tx->rate_percent,
                    'apply_on' => $tx->apply_on,
                    'amount' => $amount
                ];
                $calculatedTaxSum += $amount;
            }
        }

        // 2. Process all "compound" taxes on top of (base + additiveSum)
        $currentCompoundBase = $netSubtotal + $additiveTaxesSum;
        foreach ($taxes as $tx) {
            if (($tx->apply_on ?? 'base') === 'base_plus_previous') {
                $rate = (float)$tx->rate_percent / 100;
                $amount = round($currentCompoundBase * $rate, 2);
                $currentCompoundBase += $amount;
                
                $taxBreakdown[] = [
                    'id' => $tx->id,
                    'name' => $tx->name,
                    'rate_percent' => $tx->rate_percent,
                    'apply_on' => $tx->apply_on,
                    'amount' => $amount
                ];
                $calculatedTaxSum += $amount;
            }
        }

        $data['subtotal_amount'] = round($netSubtotal, 2);
        $data['tax_total'] = round($calculatedTaxSum, 2);
        $data['tax_details_json'] = json_encode($taxBreakdown);

        $shippingFee = (float)($data['shipping_fee'] ?? 0);
        $couponDiscount = 0; // Initialize as 0, will be set if coupon validated

        // 1.6 Handle Coupon Validation
        $couponId = null;
        if (!empty($data['coupon_code'])) {
            require_once '../app/models/Coupon.php';
            $couponModel = new Coupon();
            
            // Validate coupon against the net subtotal (post line-discounts)
            $validation = $couponModel->validate($data['coupon_code'], $netSubtotal, $customerId);
            if (!$validation['valid']) {
                $this->error($validation['message'], 400);
            }
            
            $couponDiscount = $validation['discount_amount'];
            $data['coupon_discount'] = $couponDiscount;
            $couponId = $validation['coupon']->id;
        }

        // Re-calculate final total to ensure it matches
        // Total = Net Subtotal (Gross - Line Discs) + Taxes + Shipping - Coupon Discount
        $expectedTotal = round($netSubtotal + $calculatedTaxSum + $shippingFee - $couponDiscount, 2);
        
        // Small epsilon check for float comparison
        if (abs($data['total_amount'] - $expectedTotal) > 0.01) {
            $data['total_amount'] = $expectedTotal; 
        }

        // 2. Create Order
        $result = $orderModel->create($data);
        if ($result) {
            // 2.5 Record Coupon Usage
            if ($couponId) {
                $couponModel->recordUsage($couponId, $result['id'], $data['coupon_discount'], $customerId);
            }
            // 3. Send Confirmation Email
            try {
                require_once '../app/helpers/EmailHelper.php';
                require_once '../app/models/StorefrontSetting.php';
                require_once '../app/models/Company.php';
                
                $settingsModel = new StorefrontSetting();
                $companyModel = new Company();
                $locationId = $data['location_id'] ?? 1;
                $ecomSettings = $settingsModel->getAll($locationId);
                $company = $companyModel->get();

                $to = $data['customer_details']['email'];
                $subject = "Order Confirmed - " . $result['order_no'];
                
                // Asset URLs
                $contentUrl = defined('CONTENT_BASE_URL') ? CONTENT_BASE_URL : 'https://content-provider.payshia.com/service-center-system/';
                $itemsDir = defined('CONTENT_ITEMS_DIR') ? CONTENT_ITEMS_DIR : 'items';
                $imageBaseUrl = rtrim($contentUrl, '/') . '/' . trim($itemsDir, '/') . '/';
                $logoUrl = !empty($company->logo_filename) ? rtrim($contentUrl, '/') . '/logos/' . $company->logo_filename : '';

                // Build Item List HTML with Images (Using tables for layout as flexbox is poorly supported in many email clients)
                $itemsHtml = '';
                foreach ($data['items'] as $item) {
                    // Fetch real product details from DB for this item
                    $this->db->query("SELECT part_name, image_filename FROM parts WHERE id = :id LIMIT 1");
                    $this->db->bind(':id', $item['item_id']);
                    $part = $this->db->single();
                    
                    $realName = !empty($part->part_name) ? $part->part_name : ($item['product_name'] ?? 'Product');
                    $imgFilename = !empty($part->image_filename) ? $part->image_filename : '';
                    $imgUrl = $imgFilename ? ($imageBaseUrl . $imgFilename) : 'https://via.placeholder.com/100?text=Product';

                    $itemsHtml .= '
                    <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9; vertical-align: middle;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td width="72" style="vertical-align: middle;">
                                        <img src="' . $imgUrl . '" alt="' . htmlspecialchars($realName) . '" width="60" height="60" style="width: 60px; height: 60px; border-radius: 8px; border: 1px solid #f1f5f9; display: block; object-fit: cover;">
                                    </td>
                                    <td style="vertical-align: middle; padding-left: 12px;">
                                        <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">' . htmlspecialchars($realName) . '</div>
                                        <div style="font-size: 12px; color: #64748b; font-weight: 500;">Quantity: ' . (int)$item['quantity'] . '</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9; text-align: right; vertical-align: middle;">
                            <span style="font-size: 14px; font-weight: 700; color: #0f172a;">LKR ' . number_format($item['unit_price'], 2) . '</span>
                        </td>
                    </tr>';
                }

                // 4. Fetch Related Products for Promotion (Respecting Admin Settings)
                $relatedProductsHtml = '';
                $showRelated = ($ecomSettings['show_related_products'] ?? '1') === '1';
                $featuredIds = !empty($ecomSettings['featured_product_ids']) ? explode(',', $ecomSettings['featured_product_ids']) : [];
                $featuredIds = array_map('trim', array_filter($featuredIds, 'is_numeric'));

                if ($showRelated) {
                    $firstItem = reset($data['items']);
                    $related = [];

                    if (!empty($featuredIds)) {
                        // Use manually specified products from admin
                        $placeholders = implode(',', array_fill(0, count($featuredIds), '?'));
                        $this->db->query("SELECT id, part_name, image_filename, price, slug FROM parts WHERE id IN ($placeholders) AND is_active = 1 AND is_online = 1 LIMIT 3");
                        foreach ($featuredIds as $i => $fid) {
                            $this->db->bind($i + 1, (int)$fid);
                        }
                        $related = $this->db->resultSet();
                    } elseif ($firstItem) {
                        // Fallback to auto-category logic
                        $this->db->query("SELECT item_category_id FROM parts WHERE id = :id LIMIT 1");
                        $this->db->bind(':id', $firstItem['item_id']);
                        $catRow = $this->db->single();
                        $categoryId = $catRow->item_category_id ?? 0;

                        $this->db->query("
                            SELECT id, part_name, image_filename, price, slug 
                            FROM parts 
                            WHERE item_category_id = :cat_id 
                            AND id != :current_id 
                            AND is_active = 1 
                            AND is_online = 1
                            LIMIT 3
                        ");
                        $this->db->bind(':cat_id', $categoryId);
                        $this->db->bind(':current_id', $firstItem['item_id']);
                        $related = $this->db->resultSet();
                    }

                    if (!empty($related)) {
                        $storefrontUrl = rtrim($ecomSettings['storefront_url'] ?? 'https://teajarceylon.com', '/');
                        $productPrefix = $ecomSettings['storefront_product_prefix'] ?? '/product/';
                        $productPrefix = '/' . ltrim(rtrim($productPrefix, '/'), '/');

                        $relatedProductsHtml = '
                        <div style="margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 32px;">
                            <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 20px; text-align: center; text-transform: uppercase; letter-spacing: 0.05em;">You Might Also Like</h3>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>';
                        
                        foreach ($related as $index => $rel) {
                            $relImgUrl = !empty($rel->image_filename) ? $imageBaseUrl . $rel->image_filename : 'https://via.placeholder.com/150?text=Product';
                            $relProductUrl = !empty($rel->slug) ? ($storefrontUrl . $productPrefix . '/' . $rel->slug) : $storefrontUrl;
                            $relatedProductsHtml .= '
                            <td width="33.33%" style="padding: 0 8px; vertical-align: top; text-align: center;">
                                <a href="' . $relProductUrl . '" style="text-decoration: none; color: inherit; display: block;">
                                    <div style="background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 12px;">
                                        <img src="' . $relImgUrl . '" alt="" width="100%" style="width: 100%; border-radius: 8px; margin-bottom: 12px; display: block; object-fit: cover;">
                                        <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px; height: 32px; overflow: hidden; line-height: 1.2;">' . htmlspecialchars($rel->part_name) . '</div>
                                        <div style="font-size: 13px; font-weight: 800; color: #b91c1c;">LKR ' . number_format($rel->price, 2) . '</div>
                                    </div>
                                </a>
                            </td>';
                        }
                        
                        for ($i = count($related); $i < 3; $i++) {
                            $relatedProductsHtml .= '<td width="33.33%"></td>';
                        }

                        $relatedProductsHtml .= '
                                </tr>
                            </table>
                            <div style="text-align: center; margin-top: 24px;">
                                <a href="' . $storefrontUrl . '" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px;">Shop More Products &rarr;</a>
                            </div>
                        </div>';
                    }
                }

                $message = '
                    <div style="text-align: center; margin-bottom: 32px;">
                        ' . ($logoUrl ? '<img src="' . $logoUrl . '" alt="Logo" style="max-height: 50px; margin-bottom: 16px;">' : '') . '
                        <div style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; font-weight: 800; color: #64748b; margin-bottom: 4px;">Order Confirmation</div>
                        <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">Thank you for your order!</h1>
                    </div>

                    <div style="background: #f8fafc; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; margin-bottom: 32px;">
                        <p style="margin: 0 0 24px 0; font-size: 15px; color: #334155; line-height: 1.6;">Hi ' . ($data['customer_details']['name'] ?? 'there') . ', we\'ve received your order <strong>#' . $result['order_no'] . '</strong> and our team is getting it ready for shipment. We\'ll notify you once it\'s on the way!</p>
                        
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                                <td width="50%" style="padding-right: 12px; vertical-align: top;">
                                    <div style="padding: 16px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
                                        <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Order Details</div>
                                        <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">#' . $result['order_no'] . '</div>
                                        <div style="font-size: 12px; color: #64748b; font-weight: 500;">' . date('M d, Y') . '</div>
                                    </div>
                                </td>
                                <td width="50%" style="padding-left: 12px; vertical-align: top;">
                                    <div style="padding: 16px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
                                        <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Payment Method</div>
                                        <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">' . ($data['payment_method'] ?? 'COD') . '</div>
                                        <div style="font-size: 12px; color: #64748b; font-weight: 500;">Status: Pending</div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td width="50%" style="padding: 12px 12px 0 0; vertical-align: top;">
                                    <div style="padding: 16px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; min-height: 100px;">
                                        <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Shipping Address</div>
                                        <div style="font-size: 13px; line-height: 1.5; color: #334155;">' . nl2br(htmlspecialchars($data['shipping_address'] ?? 'No shipping address provided')) . '</div>
                                    </div>
                                </td>
                                <td width="50%" style="padding: 12px 0 0 12px; vertical-align: top;">
                                    <div style="padding: 16px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; min-height: 100px;">
                                        <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Billing Address</div>
                                        <div style="font-size: 13px; line-height: 1.5; color: #334155;">' . nl2br(htmlspecialchars($data['billing_address'] ?? ($data['shipping_address'] ?? 'No billing address provided'))) . '</div>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="margin-bottom: 32px;">
                        <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Order Summary</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            ' . $itemsHtml . '
                            <tr>
                                <td style="padding: 24px 0 8px 0; text-align: right; color: #64748b; font-size: 14px; font-weight: 500;">Subtotal</td>
                                <td style="padding: 24px 0 8px 0; text-align: right; color: #0f172a; font-size: 14px; font-weight: 700;">LKR ' . number_format($calculatedSubtotal, 2) . '</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0 8px 0; text-align: right; color: #64748b; font-size: 14px; font-weight: 500;">Taxes</td>
                                <td style="padding: 4px 0 8px 0; text-align: right; color: #0f172a; font-size: 14px; font-weight: 700;">LKR ' . number_format($calculatedTaxTotal, 2) . '</td>
                            </tr>
                            <tr>
                                <td style="padding: 4px 0 8px 0; text-align: right; color: #64748b; font-size: 14px; font-weight: 500;">Shipping</td>
                                <td style="padding: 4px 0 8px 0; text-align: right; color: #0f172a; font-size: 14px; font-weight: 700;">' . ($shippingFee > 0 ? 'LKR ' . number_format($shippingFee, 2) : 'Free') . '</td>
                            </tr>
                            ' . (!empty($data['coupon_code']) ? '
                            <tr>
                                <td style="padding: 4px 0 24px 0; text-align: right; color: #64748b; font-size: 14px; font-weight: 500; border-bottom: 2px solid #f1f5f9;">Coupon (' . htmlspecialchars($data['coupon_code']) . ')</td>
                                <td style="padding: 4px 0 24px 0; text-align: right; color: #e11d48; font-size: 14px; font-weight: 700; border-bottom: 2px solid #f1f5f9;">- LKR ' . number_format($data['coupon_discount'], 2) . '</td>
                            </tr>' : '
                            <tr>
                                <td style="padding: 4px 0 24px 0; text-align: right; color: #64748b; font-size: 14px; font-weight: 500; border-bottom: 2px solid #f1f5f9;"></td>
                                <td style="padding: 4px 0 24px 0; text-align: right; color: #0f172a; font-size: 14px; font-weight: 700; border-bottom: 2px solid #f1f5f9;"></td>
                            </tr>') . '
                            <tr>
                                <td style="padding: 24px 0; text-align: right; color: #0f172a; font-size: 18px; font-weight: 800;">Total</td>
                                <td style="padding: 24px 0; text-align: right; color: #0f172a; font-size: 24px; font-weight: 800;">LKR ' . number_format($data['total_amount'], 2) . '</td>
                            </tr>
                        </table>
                    </div>

                    ' . $relatedProductsHtml . '

                    <div style="background: #0f172a; border-radius: 12px; padding: 24px; text-align: center; margin-top: 32px;">
                        <p style="margin: 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Need help with your order?</p>
                        <a href="mailto:' . ($ecomSettings['support_email'] ?? 'support@payshia.com') . '" style="display: inline-block; margin-top: 8px; color: #ffffff; font-weight: 700; text-decoration: none; font-size: 15px;">Contact Support &rarr;</a>
                    </div>
                ';

                // Map ecom settings to EmailHelper config
                $emailConfig = [
                    'mail_host' => $ecomSettings['mail_host'] ?? '',
                    'mail_user' => $ecomSettings['mail_user'] ?? '',
                    'mail_pass' => $ecomSettings['mail_pass'] ?? '',
                    'mail_port' => $ecomSettings['mail_port'] ?? 587,
                    'mail_encryption' => $ecomSettings['mail_encryption'] ?? 'tls',
                    'mail_from_addr' => $ecomSettings['mail_from_addr'] ?? 'no-reply@payshia.com',
                    'mail_from_name' => $ecomSettings['mail_from_name'] ?? ($company->name ?? 'Tea Jar Store'),
                    'cc_email' => $ecomSettings['cc_email'] ?? '',
                    'bcc_email' => $ecomSettings['bcc_email'] ?? ''
                ];

                EmailHelper::sendWithConfig($to, $subject, $message, $emailConfig);
            } catch (Exception $e) {
                error_log("Order email failed: " . $e->getMessage());
            }

            $this->success($result);
        } else {
            $this->error('Failed to create order', 500);
        }
    }

    /**
     * GET /api/publicorder/get/{id}
     */
    public function get($id) {
        $this->handlePublicCors();
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
        }
        $this->validatePublicApiKey();
        $order = $this->invoiceModel->getById($id);
        if (!$order) $this->error('Order not found', 404);

        $this->success([
            'id' => (string)$order->id,
            'invoice_number' => (string)$order->invoice_no,
            'invoice_date' => (string)$order->issue_date,
            'grand_total' => (string)$order->grand_total,
            'customer_code' => (string)$order->customer_email,
            'payment_status' => (string)$order->status,
        ]);
    }

    /**
     * GET /api/publicorder/items/{id}
     */
    public function items($id) {
        $this->handlePublicCors();
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
        }
        $this->validatePublicApiKey();
        $items = $this->invoiceModel->getItems($id);
        
        $sanitized = array_map(function($item) {
            return [
                'id' => (string)$item->id,
                'product_id' => (string)$item->item_id,
                'item_price' => (string)$item->unit_price,
                'quantity' => (string)$item->quantity,
                'product_name' => (string)$item->description,
            ];
        }, $items);

        $this->success($sanitized);
    }

    /**
     * GET /api/publicorder/get-by-no/{order_no}
     */
    public function get_by_no($orderNo) {
        $this->handlePublicCors();
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
        }
        $this->validatePublicApiKey();

        require_once '../app/models/OnlineOrder.php';
        $orderModel = new OnlineOrder();
        
        $order = $orderModel->getByOrderNo($orderNo);
        if (!$order) $this->error('Order not found', 404);

        $items = $orderModel->getItems($order->id);
        
        $details = json_decode($order->customer_details_json, true);

        $this->success([
            'id' => (string)$order->id,
            'order_no' => (string)$order->order_no,
            'total_amount' => (string)$order->total_amount,
            'subtotal_amount' => (string)$order->subtotal_amount,
            'tax_total' => (string)$order->tax_total,
            'tax_details_json' => $order->tax_details_json,
            'shipping_fee' => (string)$order->shipping_fee,
            'coupon_code' => (string)$order->coupon_code,
            'coupon_discount' => (string)$order->coupon_discount,
            'payment_method' => (string)$order->payment_method,
            'payment_status' => (string)$order->payment_status,
            'shipping_address' => (string)$order->shipping_address,
            'billing_address' => (string)$order->billing_address,
            'location_id' => (string)$order->location_id,
            'customer_name' => $details['name'] ?? '',
            'customer_email' => $details['email'] ?? '',
            'items' => array_map(function($item) {
                return [
                    'product_id' => (string)$item->item_id,
                    'product_name' => (string)$item->description,
                    'quantity' => (string)$item->quantity,
                    'unit_price' => (string)$item->unit_price,
                    'discount' => (string)$item->discount,
                    'line_total' => (string)$item->line_total,
                ];
            }, $items)
        ]);
    }

    /**
     * GET /api/publicorder/list?customer_email=...
     */
    public function list() {
        $this->handlePublicCors();
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->error('Method Not Allowed', 405);
        }
        $this->validatePublicApiKey();

        $email = $_GET['customer_email'] ?? '';
        if (empty($email)) {
            $this->error('Customer email is required', 400);
        }

        require_once '../app/models/OnlineOrder.php';
        $orderModel = new OnlineOrder();

        $this->db->query("
            SELECT o.*, l.name as location_name 
            FROM online_orders o
            LEFT JOIN service_locations l ON o.location_id = l.id
            WHERE o.customer_details_json LIKE :email
            ORDER BY o.created_at DESC
        ");
        $this->db->bind(':email', '%' . $email . '%');
        $orders = $this->db->resultSet();

        $sanitized = array_map(function($order) {
            return [
                'id' => (string)$order->id,
                'order_no' => (string)$order->order_no,
                'total_amount' => (string)$order->total_amount,
                'payment_status' => (string)$order->payment_status,
                'order_status' => (string)$order->order_status,
                'created_at' => (string)$order->created_at,
                'location_name' => (string)$order->location_name
            ];
        }, $orders);

        $this->success($sanitized);
    }
}
