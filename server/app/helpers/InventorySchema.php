<?php
/**
 * InventorySchema
 * Lightweight auto-migrations for inventory tables so the API doesn't crash on older installs.
 *
 * We keep this intentionally defensive:
 * - CREATE TABLE IF NOT EXISTS for new tables
 * - ALTER TABLE ADD COLUMN when missing
 * - best-effort only (failures won't break the API response layer)
 */
class InventorySchema {
    private static $done = false;

    private static function pdo() {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    }

    private static function hasColumn(PDO $pdo, $table, $col) {
        $stmt = $pdo->prepare("SHOW COLUMNS FROM {$table} LIKE ?");
        $stmt->execute([$col]);
        return (bool)$stmt->fetch(PDO::FETCH_ASSOC);
    }

    private static function hasTable(PDO $pdo, $table) {
        $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$table]);
        return (bool)$stmt->fetch(PDO::FETCH_ASSOC);
    }

    public static function ensure($force = false) {
        if (!$force && !defined('FORCE_MIGRATIONS')) return;
        if (self::$done && !$force) return;
        self::$done = true;

        try {
            $pdo = self::pdo();
            if (!self::hasTable($pdo, 'collections')) {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS collections (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        show_in_public TINYINT(1) NOT NULL DEFAULT 1,
                        created_by INT NULL,
                        updated_by INT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY uq_collections_name (name)
                    )
                ");
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS parts_collections (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        part_id INT NOT NULL,
                        collection_id INT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE KEY uq_part_collection (part_id, collection_id),
                        INDEX idx_pc_part (part_id),
                        INDEX idx_pc_collection (collection_id),
                        FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE,
                        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
                    )
                ");
            }
        } catch (Exception $e) {}

        // Persistent cache flag to avoid running expensive SHOW TABLES/ALTER TABLE on every request.
        // The flag file is deleted during setup or manual sync to trigger a re-run.
        $flagFile = __DIR__ . '/../../.schema_synced';
        if (file_exists($flagFile) && !$force) return;

        try {
            $pdo = self::pdo();
        } catch (Exception $e) {
            return;
        }

        // Brands are used by parts (brand_id). Ensure the brands table and permissions exist.
        try { if (class_exists('BrandSchema')) BrandSchema::ensure(); } catch (Throwable $e) { error_log("InventorySchema: BrandSchema failed: " . $e->getMessage()); }
        // Taxes are used by purchasing documents; keep it available on older installs.
        try { if (class_exists('TaxSchema')) TaxSchema::ensure(); } catch (Throwable $e) { error_log("InventorySchema: TaxSchema failed: " . $e->getMessage()); }

        // Short document numbering sequences (PO/GRN). Best-effort and safe under concurrency.
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS document_sequences (
                    doc_type VARCHAR(30) PRIMARY KEY,
                    prefix VARCHAR(10) NOT NULL,
                    next_number INT NOT NULL DEFAULT 1,
                    padding INT NOT NULL DEFAULT 6,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            ");

            // Seed with defaults. next_number will be corrected below based on existing rows.
            $pdo->exec("
                INSERT IGNORE INTO document_sequences (doc_type, prefix, next_number, padding) VALUES
                ('PO', 'PO-', 1, 6),
                ('GRN', 'GRN-', 1, 6),
                ('TR', 'TR-', 1, 6),
                ('REQ', 'REQ-', 1, 6),
                ('INV', 'INV/', 1, 6),
                ('QT', 'EXPQT-', 1, 6)
            ");

            // If this is an existing install, bump next_number to (MAX(id)+1) as a sensible default.
            // This is best-effort; if the sequence has already been used, we won't try to guess.
            try {
                if (self::hasTable($pdo, 'purchase_orders')) {
                    $pdo->exec("
                        UPDATE document_sequences
                        SET next_number = GREATEST(next_number, (SELECT IFNULL(MAX(id),0) + 1 FROM purchase_orders))
                        WHERE doc_type = 'PO'
                    ");
                }
            } catch (Exception $e2) {}
            try {
                if (self::hasTable($pdo, 'goods_receive_notes')) {
                    $pdo->exec("
                        UPDATE document_sequences
                        SET next_number = GREATEST(next_number, (SELECT IFNULL(MAX(id),0) + 1 FROM goods_receive_notes))
                        WHERE doc_type = 'GRN'
                    ");
                }
            } catch (Exception $e2) {}
            try {
                if (self::hasTable($pdo, 'stock_transfer_requests')) {
                    $pdo->exec("
                        UPDATE document_sequences
                        SET next_number = GREATEST(next_number, (SELECT IFNULL(MAX(id),0) + 1 FROM stock_transfer_requests))
                        WHERE doc_type = 'TR'
                    ");
                }
            } catch (Exception $e2) {}
            try {
                if (self::hasTable($pdo, 'stock_transfer_requisitions')) {
                    $pdo->exec("
                        UPDATE document_sequences
                        SET next_number = GREATEST(next_number, (SELECT IFNULL(MAX(id),0) + 1 FROM stock_transfer_requisitions))
                        WHERE doc_type = 'REQ'
                    ");
                }
            } catch (Exception $e2) {}
        } catch (Exception $e) {}

        // Ensure RBAC permission keys exist for inventory even on older installs (best-effort).
        try {
            if (self::hasTable($pdo, 'permissions')) {
                $pdo->exec("
                    INSERT IGNORE INTO permissions (perm_key, description) VALUES
                    ('parts.read', 'View item master (parts)'),
                    ('parts.write', 'Create/update/delete item master (parts)'),
                    ('suppliers.read', 'View suppliers'),
                    ('suppliers.write', 'Create/update/delete suppliers'),
                    ('purchase.read', 'View purchase orders'),
                    ('purchase.write', 'Create/update/delete purchase orders'),
                    ('grn.read', 'View goods receive notes'),
                    ('grn.write', 'Create/update goods receive notes'),
                    ('stock.read', 'View stock movements and balances'),
                    ('stock.adjust', 'Adjust stock quantity'),
                    ('transfer.read', 'View stock transfer requests'),
                    ('transfer.write', 'Create/update stock transfer requests'),
                    ('taxes.read', 'View taxes master'),
                    ('taxes.write', 'Create/update/delete taxes master'),
                    ('production.read', 'View BOMs and Production Orders'),
                    ('production.write', 'Create/update BOMs and Production Orders'),
                    ('ecommerce.read', 'View e-commerce settings and orders'),
                    ('ecommerce.write', 'Manage storefront, menus and e-com settings')
                ");

                // Best-effort grants to default roles (non-admin). Admin is implicit superuser.
                // This mirrors InstallController defaults so existing installs behave the same.
                try {
                    $roleId = function($name) use ($pdo) {
                        $stmt = $pdo->prepare("SELECT id FROM roles WHERE name = ? LIMIT 1");
                        $stmt->execute([$name]);
                        return (int)$stmt->fetchColumn();
                    };
                    $permId = function($key) use ($pdo) {
                        $stmt = $pdo->prepare("SELECT id FROM permissions WHERE perm_key = ? LIMIT 1");
                        $stmt->execute([$key]);
                        return (int)$stmt->fetchColumn();
                    };
                    $grant = function($roleName, $permKey) use ($pdo, $roleId, $permId) {
                        $rid = $roleId($roleName);
                        $pid = $permId($permKey);
                        if ($rid && $pid) {
                            $stmt = $pdo->prepare("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
                            $stmt->execute([$rid, $pid]);
                        }
                    };

                    foreach (['parts.read','parts.write','suppliers.read','purchase.read','purchase.write','grn.read','grn.write','stock.read','transfer.read','transfer.write','taxes.read'] as $p) {
                        $grant('Workshop Officer', $p);
                    }
                    foreach (['parts.read','suppliers.read','purchase.read','grn.read','stock.read','transfer.read','taxes.read'] as $p) {
                        $grant('Factory Officer', $p);
                    }
                } catch (Exception $e2) {
                    // ignore
                }
            }
        } catch (Exception $e) {
            // ignore
        }

        // Item Breakdown Master Data
        try {
            $pdo = self::pdo();
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS item_sections (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_item_sections_name (name)
                )
            ");
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS item_departments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    section_id INT NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_item_dept_name (section_id, name),
                    INDEX idx_item_dept_section (section_id),
                    FOREIGN KEY (section_id) REFERENCES item_sections(id) ON DELETE CASCADE
                )
            ");
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS item_categories (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_item_cats_name (name)
                )
            ");
        } catch (Exception $e) {}

        // Parts table upgrades
        try {
            if (self::hasTable($pdo, 'parts')) {
                $cols = [
                    'sku' => "VARCHAR(64) NULL",
                    'part_number' => "VARCHAR(64) NULL",
                    'barcode_number' => "VARCHAR(64) NULL",
                    'unit' => "VARCHAR(32) NULL",
                    'brand_id' => "INT NULL",
                    'item_section_id' => "INT NULL",
                    'item_department_id' => "INT NULL",
                    'item_category_id' => "INT NULL",
                    'cost_price' => "DECIMAL(10,2) NULL",
                    'reorder_level' => "INT NULL",
                    'is_active' => "TINYINT(1) NOT NULL DEFAULT 1",
                    'image_filename' => "VARCHAR(255) NULL",
                    'item_type' => "ENUM('Part', 'Service') NOT NULL DEFAULT 'Part'",
                    'is_fifo' => "TINYINT(1) NOT NULL DEFAULT 0",
                    'is_expiry' => "TINYINT(1) NOT NULL DEFAULT 0",
                    'recipe_type' => "ENUM('Standard', 'A La Carte', 'Recipe', 'Buffet') NOT NULL DEFAULT 'Standard'",
                    'default_location_id' => "INT NULL",
                    'allowed_locations' => "TEXT NULL",
                    'wholesale_price' => "DECIMAL(10,2) NULL",
                    'min_selling_price' => "DECIMAL(10,2) NULL",
                    'price_2' => "DECIMAL(10,2) NULL",
                    'net_weight_kg' => "DECIMAL(12,3) NULL DEFAULT 0",
                    'gross_weight_kg' => "DECIMAL(12,3) NULL DEFAULT 0",
                    'units_per_carton' => "INT NOT NULL DEFAULT 1",
                    'packing_type' => "VARCHAR(50) NULL",
                    'hs_code' => "VARCHAR(50) NULL",
                    'carton_length_cm' => "DECIMAL(12,2) NULL DEFAULT 0",
                    'carton_width_cm' => "DECIMAL(12,2) NULL DEFAULT 0",
                    'carton_height_cm' => "DECIMAL(12,2) NULL DEFAULT 0",
                    'volume_cbm' => "DECIMAL(15,6) NULL DEFAULT 0",
                    'carton_tare_weight_kg' => "DECIMAL(12,3) NULL DEFAULT 0",
                    'out_of_stock' => "TINYINT(1) NOT NULL DEFAULT 0",
                    'is_online' => "TINYINT(1) NOT NULL DEFAULT 0",
                    'public_description' => "TEXT NULL",
                    'slug' => "VARCHAR(255) NULL",
                    'discount_type' => "ENUM('None', 'Percentage', 'Fixed') DEFAULT 'None'",
                    'discount_value' => "DECIMAL(10,2) DEFAULT 0.00",
                ];
                foreach ($cols as $col => $def) {
                    if (!self::hasColumn($pdo, 'parts', $col)) {
                        $pdo->exec("ALTER TABLE parts ADD COLUMN {$col} {$def}");
                    }
                }
                // Support fractional stock quantities (e.g., oils) with 3 decimals.
                try { $pdo->exec("ALTER TABLE parts MODIFY COLUMN stock_quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000"); } catch (Exception $e2) {}
                // Unique SKU if possible (ignore duplicates / existing index)
                try { $pdo->exec("ALTER TABLE parts ADD UNIQUE KEY uq_parts_sku (sku)"); } catch (Exception $e2) {}
                try { $pdo->exec("ALTER TABLE parts ADD UNIQUE KEY uq_parts_slug (slug)"); } catch (Exception $e2) {}
                try { $pdo->exec("ALTER TABLE parts ADD INDEX idx_parts_brand (brand_id)"); } catch (Exception $e2) {}
                try { $pdo->exec("ALTER TABLE parts ADD INDEX idx_parts_section (item_section_id)"); } catch (Exception $e2) {}
                try { $pdo->exec("ALTER TABLE parts ADD INDEX idx_parts_dept (item_department_id)"); } catch (Exception $e2) {}
                try { $pdo->exec("ALTER TABLE parts ADD INDEX idx_parts_cat (item_category_id)"); } catch (Exception $e2) {}
            }
        } catch (Exception $e) {
            // ignore
        }

        // order_parts upgrades (add id PK + prices)
        try {
            if (self::hasTable($pdo, 'order_parts')) {
                if (!self::hasColumn($pdo, 'order_parts', 'id')) {
                    // Make it the primary key so we can update/delete specific lines.
                    $pdo->exec("ALTER TABLE order_parts ADD COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST");
                }
                $cols = [
                    'unit_cost' => "DECIMAL(10,2) NULL",
                    'unit_price' => "DECIMAL(10,2) NULL",
                    'line_total' => "DECIMAL(10,2) NULL",
                ];
                foreach ($cols as $col => $def) {
                    if (!self::hasColumn($pdo, 'order_parts', $col)) {
                        $pdo->exec("ALTER TABLE order_parts ADD COLUMN {$col} {$def}");
                    }
                }
                try { $pdo->exec("ALTER TABLE order_parts ADD INDEX idx_order_parts_order (order_id)"); } catch (Exception $e2) {}
                try { $pdo->exec("ALTER TABLE order_parts ADD INDEX idx_order_parts_part (part_id)"); } catch (Exception $e2) {}
            }
        } catch (Exception $e) {
            // ignore
        }

        // Suppliers
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS suppliers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NULL,
                    phone VARCHAR(50) NULL,
                    address VARCHAR(255) NULL,
                    tax_reg_no VARCHAR(100) NULL,
                    is_active TINYINT(1) NOT NULL DEFAULT 1,
                    is_inventory_vendor TINYINT(1) NOT NULL DEFAULT 1,
                    is_banquet_vendor TINYINT(1) NOT NULL DEFAULT 0,
                    created_by INT NULL,
                    updated_by INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_suppliers_name (name)
                )
            ");

            // Best-effort upgrade for existing installs
            try {
                if (!self::hasColumn($pdo, 'suppliers', 'tax_reg_no')) {
                    $pdo->exec("ALTER TABLE suppliers ADD COLUMN tax_reg_no VARCHAR(100) NULL");
                }
                if (!self::hasColumn($pdo, 'suppliers', 'is_inventory_vendor')) {
                    $pdo->exec("ALTER TABLE suppliers ADD COLUMN is_inventory_vendor TINYINT(1) NOT NULL DEFAULT 1");
                }
                if (!self::hasColumn($pdo, 'suppliers', 'is_banquet_vendor')) {
                    $pdo->exec("ALTER TABLE suppliers ADD COLUMN is_banquet_vendor TINYINT(1) NOT NULL DEFAULT 0");
                }
            } catch (Exception $e2) {}
        } catch (Exception $e) {}

        // Supplier -> taxes mapping
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS supplier_taxes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    supplier_id INT NOT NULL,
                    tax_id INT NOT NULL,
                    created_by INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_supplier_tax (supplier_id, tax_id),
                    INDEX idx_supplier_tax_supplier (supplier_id),
                    INDEX idx_supplier_tax_tax (tax_id)
                )
            ");
        } catch (Exception $e) {}

        // Stock transfer requests
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS stock_transfer_requests (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    transfer_number VARCHAR(50) NOT NULL,
                    requisition_id INT NULL,
                    from_location_id INT NOT NULL,
                    to_location_id INT NOT NULL,
                    status ENUM('Requested','Received','Cancelled') NOT NULL DEFAULT 'Requested',
                    requested_at DATETIME NULL,
                    notes TEXT NULL,
                    created_by INT NULL,
                    received_by INT NULL,
                    received_at DATETIME NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_str_req (requisition_id),
                    INDEX idx_str_from (from_location_id),
                    INDEX idx_str_to (to_location_id),
                    INDEX idx_str_status (status),
                    UNIQUE KEY uq_str_number (transfer_number)
                )
            ");
            // Upgrades for older installs
            try {
                if (!self::hasColumn($pdo, 'stock_transfer_requests', 'requisition_id')) {
                    $pdo->exec("ALTER TABLE stock_transfer_requests ADD COLUMN requisition_id INT NULL AFTER transfer_number");
                }
                try { $pdo->exec("ALTER TABLE stock_transfer_requests ADD INDEX idx_str_req (requisition_id)"); } catch (Exception $e2) {}
            } catch (Exception $e2) {}

            $pdo->exec("
                CREATE TABLE IF NOT EXISTS stock_transfer_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    transfer_id INT NOT NULL,
                    part_id INT NOT NULL,
                    batch_id INT NULL,
                    qty DECIMAL(12,3) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_sti_transfer (transfer_id),
                    INDEX idx_sti_part (part_id),
                    INDEX idx_sti_batch (batch_id),
                    FOREIGN KEY (transfer_id) REFERENCES stock_transfer_requests(id) ON DELETE CASCADE,
                    FOREIGN KEY (part_id) REFERENCES parts(id)
                )
            ");
            if (!self::hasColumn($pdo, 'stock_transfer_items', 'batch_id')) {
                $pdo->exec("ALTER TABLE stock_transfer_items ADD COLUMN batch_id INT NULL AFTER part_id");
                try { $pdo->exec("ALTER TABLE stock_transfer_items ADD INDEX idx_sti_batch (batch_id)"); } catch (Exception $e2) {}
            }
        } catch (Exception $e) {}

        // Stock transfer requisitions (requested by the destination location)
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS stock_transfer_requisitions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    requisition_number VARCHAR(50) NOT NULL,
                    from_location_id INT NULL,
                    to_location_id INT NOT NULL,
                    status ENUM('Requested','Approved','Cancelled','Fulfilled') NOT NULL DEFAULT 'Requested',
                    requested_at DATETIME NULL,
                    notes TEXT NULL,
                    created_by INT NULL,
                    approved_by INT NULL,
                    approved_at DATETIME NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_strq_from (from_location_id),
                    INDEX idx_strq_to (to_location_id),
                    INDEX idx_strq_status (status),
                    UNIQUE KEY uq_strq_number (requisition_number)
                )
            ");

            // Upgrades for older installs
            try {
                if (!self::hasColumn($pdo, 'stock_transfer_requisitions', 'from_location_id')) {
                    $pdo->exec("ALTER TABLE stock_transfer_requisitions ADD COLUMN from_location_id INT NULL AFTER requisition_number");
                }
                try { $pdo->exec("ALTER TABLE stock_transfer_requisitions ADD INDEX idx_strq_from (from_location_id)"); } catch (Exception $e2) {}
            } catch (Exception $e2) {}

            $pdo->exec("
                CREATE TABLE IF NOT EXISTS stock_transfer_requisition_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    requisition_id INT NOT NULL,
                    part_id INT NOT NULL,
                    qty_requested DECIMAL(12,3) NOT NULL,
                    qty_fulfilled DECIMAL(12,3) NOT NULL DEFAULT 0.000,
                    notes VARCHAR(255) NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_strqi_req (requisition_id),
                    INDEX idx_strqi_part (part_id),
                    FOREIGN KEY (requisition_id) REFERENCES stock_transfer_requisitions(id) ON DELETE CASCADE,
                    FOREIGN KEY (part_id) REFERENCES parts(id)
                )
            ");
        } catch (Exception $e) {}

        // Part ↔ Supplier mapping (many-to-many)
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS part_suppliers (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    part_id INT NOT NULL,
                    supplier_id INT NOT NULL,
                    created_by INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_part_sup (part_id, supplier_id),
                    INDEX idx_part_sup_part (part_id),
                    INDEX idx_part_sup_supplier (supplier_id)
                )
            ");
            try { $pdo->exec("ALTER TABLE part_suppliers ADD CONSTRAINT fk_part_sup_part FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE"); } catch (Exception $e2) {}
            try { $pdo->exec("ALTER TABLE part_suppliers ADD CONSTRAINT fk_part_sup_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)"); } catch (Exception $e2) {}
        } catch (Exception $e) {}

        // Purchase Orders
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS purchase_orders (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    location_id INT NOT NULL DEFAULT 1,
                    supplier_id INT NOT NULL,
                    po_number VARCHAR(50) NOT NULL,
                    status ENUM('Draft','Sent','Partially Received','Received','Cancelled') NOT NULL DEFAULT 'Draft',
                    notes TEXT NULL,
                    ordered_at DATETIME NULL,
                    expected_at DATETIME NULL,
                    created_by INT NULL,
                    updated_by INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_purchase_orders_number (po_number),
                    INDEX idx_purchase_orders_location (location_id),
                    INDEX idx_purchase_orders_supplier (supplier_id)
                )
            ");
            try { $pdo->exec("ALTER TABLE purchase_orders ADD CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)"); } catch (Exception $e2) {}
            // Older installs: add location_id if missing (best-effort).
            try {
                if (self::hasTable($pdo, 'purchase_orders') && !self::hasColumn($pdo, 'purchase_orders', 'location_id')) {
                    $pdo->exec("ALTER TABLE purchase_orders ADD COLUMN location_id INT NOT NULL DEFAULT 1");
                    try { $pdo->exec("ALTER TABLE purchase_orders ADD INDEX idx_purchase_orders_location (location_id)"); } catch (Exception $e3) {}
                }
            } catch (Exception $e2) {}
            try { $pdo->exec("ALTER TABLE purchase_orders ADD CONSTRAINT fk_po_location FOREIGN KEY (location_id) REFERENCES service_locations(id)"); } catch (Exception $e2) {}
        } catch (Exception $e) {}

        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS purchase_order_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    purchase_order_id INT NOT NULL,
                    part_id INT NOT NULL,
                    qty_ordered DECIMAL(12,3) NOT NULL,
                    unit_cost DECIMAL(10,2) NOT NULL,
                    received_qty DECIMAL(12,3) NOT NULL DEFAULT 0.000,
                    line_total DECIMAL(10,2) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_poi_po (purchase_order_id),
                    INDEX idx_poi_part (part_id)
                )
            ");
            try { $pdo->exec("ALTER TABLE purchase_order_items ADD CONSTRAINT fk_poi_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE"); } catch (Exception $e2) {}
            try { $pdo->exec("ALTER TABLE purchase_order_items ADD CONSTRAINT fk_poi_part FOREIGN KEY (part_id) REFERENCES parts(id)"); } catch (Exception $e2) {}
        } catch (Exception $e) {}

        // GRN + GRN items
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS goods_receive_notes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    grn_number VARCHAR(50) NOT NULL,
                    purchase_order_id INT NULL,
                    location_id INT NOT NULL DEFAULT 1,
                    supplier_id INT NOT NULL,
                    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                    tax_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                    received_at DATETIME NOT NULL,
                    notes TEXT NULL,
                    created_by INT NULL,
                    updated_by INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_grn_number (grn_number),
                    INDEX idx_grn_location (location_id),
                    INDEX idx_grn_supplier (supplier_id),
                    INDEX idx_grn_po (purchase_order_id)
                )
            ");
            try { $pdo->exec("ALTER TABLE goods_receive_notes ADD CONSTRAINT fk_grn_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)"); } catch (Exception $e2) {}
            try { $pdo->exec("ALTER TABLE goods_receive_notes ADD CONSTRAINT fk_grn_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id)"); } catch (Exception $e2) {}
            // Older installs: add location_id if missing (best-effort).
            try {
                if (self::hasTable($pdo, 'goods_receive_notes')) {
                    if (!self::hasColumn($pdo, 'goods_receive_notes', 'location_id')) {
                        $pdo->exec("ALTER TABLE goods_receive_notes ADD COLUMN location_id INT NOT NULL DEFAULT 1");
                        try { $pdo->exec("ALTER TABLE goods_receive_notes ADD INDEX idx_grn_location (location_id)"); } catch (Exception $e3) {}
                    }
                    if (!self::hasColumn($pdo, 'goods_receive_notes', 'subtotal')) {
                        $pdo->exec("ALTER TABLE goods_receive_notes ADD COLUMN subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00");
                    }
                    if (!self::hasColumn($pdo, 'goods_receive_notes', 'tax_total')) {
                        $pdo->exec("ALTER TABLE goods_receive_notes ADD COLUMN tax_total DECIMAL(15,2) NOT NULL DEFAULT 0.00");
                    }
                }
            } catch (Exception $e2) {}
            try { $pdo->exec("ALTER TABLE goods_receive_notes ADD CONSTRAINT fk_grn_location FOREIGN KEY (location_id) REFERENCES service_locations(id)"); } catch (Exception $e2) {}
        } catch (Exception $e) {}

        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS grn_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    grn_id INT NOT NULL,
                    part_id INT NOT NULL,
                    qty_received DECIMAL(12,3) NOT NULL,
                    unit_cost DECIMAL(10,2) NOT NULL,
                    line_total DECIMAL(10,2) NOT NULL,
                    INDEX idx_grni_grn (grn_id),
                    INDEX idx_grni_part (part_id)
                )
            ");
            try { $pdo->exec("ALTER TABLE grn_items ADD CONSTRAINT fk_grni_grn FOREIGN KEY (grn_id) REFERENCES goods_receive_notes(id) ON DELETE CASCADE"); } catch (Exception $e2) {}
            try { $pdo->exec("ALTER TABLE grn_items ADD CONSTRAINT fk_grni_part FOREIGN KEY (part_id) REFERENCES parts(id)"); } catch (Exception $e2) {}
        } catch (Exception $e) {}

        // purchase_order_items upgrades (decimal quantities)
        try {
            if (self::hasTable($pdo, 'purchase_order_items')) {
                try { $pdo->exec("ALTER TABLE purchase_order_items MODIFY COLUMN qty_ordered DECIMAL(12,3) NOT NULL"); } catch (Exception $e2) {}
                try { $pdo->exec("ALTER TABLE purchase_order_items MODIFY COLUMN received_qty DECIMAL(12,3) NOT NULL DEFAULT 0.000"); } catch (Exception $e2) {}
            }
        } catch (Exception $e) {
            // ignore
        }

        // grn_items upgrades (decimal quantities)
        try {
            if (self::hasTable($pdo, 'grn_items')) {
                try { $pdo->exec("ALTER TABLE grn_items MODIFY COLUMN qty_received DECIMAL(12,3) NOT NULL"); } catch (Exception $e2) {}
            }
        } catch (Exception $e) {
            // ignore
        }

        // Stock movement ledger
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS stock_movements (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    location_id INT NOT NULL DEFAULT 1,
                    part_id INT NOT NULL,
                    qty_change DECIMAL(12,3) NOT NULL,
                    movement_type ENUM('GRN','ORDER_ISSUE','ADJUSTMENT','TRANSFER_IN','TRANSFER_OUT','PRODUCTION_CONSUMPTION','PRODUCTION_RECEIPT','SALE') NOT NULL,
                    ref_table VARCHAR(64) NULL,
                    ref_id INT NULL,
                    unit_cost DECIMAL(10,2) NULL,
                    unit_price DECIMAL(10,2) NULL,
                    notes VARCHAR(255) NULL,
                    created_by INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_stock_movements_location (location_id),
                    INDEX idx_stock_movements_part (part_id),
                    INDEX idx_stock_movements_type (movement_type)
                )
            ");
            try { $pdo->exec("ALTER TABLE stock_movements ADD CONSTRAINT fk_stock_movements_part FOREIGN KEY (part_id) REFERENCES parts(id)"); } catch (Exception $e2) {}
        } catch (Exception $e) {}

        // stock_movements upgrades (location_id)
        try {
            if (self::hasTable($pdo, 'stock_movements')) {
                if (!self::hasColumn($pdo, 'stock_movements', 'location_id')) {
                    $pdo->exec("ALTER TABLE stock_movements ADD COLUMN location_id INT NOT NULL DEFAULT 1 AFTER id");
                }
                try { $pdo->exec("ALTER TABLE stock_movements ADD INDEX idx_stock_movements_location (location_id)"); } catch (Exception $e2) {}
                // qty_change should support decimal quantities
                try { $pdo->exec("ALTER TABLE stock_movements MODIFY COLUMN qty_change DECIMAL(12,3) NOT NULL"); } catch (Exception $e2) {}

                // Add stock transfer movement types (older installs had a limited ENUM set).
                // Without this, MySQL stores invalid enum inserts as '' (blank), which is what the UI shows.
                try {
                    $pdo->exec("
                        ALTER TABLE stock_movements
                        MODIFY COLUMN movement_type
                        ENUM('GRN','ORDER_ISSUE','ADJUSTMENT','TRANSFER_IN','TRANSFER_OUT','PRODUCTION_CONSUMPTION','PRODUCTION_RECEIPT','SALE','SALES_RETURN','PURCHASE_RETURN')
                        NOT NULL
                    ");
                } catch (Exception $e2) {}

                // Best-effort fix for existing blank movement_type rows
                try {
                    $pdo->exec("
                        UPDATE stock_movements
                        SET movement_type = CASE WHEN qty_change >= 0 THEN 'TRANSFER_IN' ELSE 'TRANSFER_OUT' END
                        WHERE (movement_type = '' OR movement_type IS NULL)
                          AND ref_table = 'stock_transfer_requests'
                    ");
                    $pdo->exec("
                        UPDATE stock_movements
                        SET movement_type = 'SALE'
                        WHERE (movement_type = '' OR movement_type IS NULL)
                          AND ref_table = 'invoices'
                    ");
                    $pdo->exec("
                        UPDATE stock_movements
                        SET movement_type = 'SALES_RETURN'
                        WHERE (movement_type = '' OR movement_type IS NULL)
                          AND ref_table = 'sales_returns'
                    ");
                    $pdo->exec("
                        UPDATE stock_movements
                        SET movement_type = 'PRODUCTION_CONSUMPTION'
                        WHERE (movement_type = '' OR movement_type IS NULL)
                          AND notes LIKE 'Production Consumption%'
                    ");
                    $pdo->exec("
                        UPDATE stock_movements
                        SET movement_type = 'PRODUCTION_RECEIPT'
                        WHERE (movement_type = '' OR movement_type IS NULL)
                          AND notes LIKE 'Production Entry%'
                    ");
                } catch (Exception $e2) {}
            }
        } catch (Exception $e) {
            // ignore
        }

        // Stock adjustment batches
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS stock_adjustments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    location_id INT NOT NULL DEFAULT 1,
                    adjustment_number VARCHAR(50) NOT NULL,
                    adjusted_at DATETIME NOT NULL,
                    reason VARCHAR(255) NULL,
                    notes TEXT NULL,
                    created_by INT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_stock_adjustments_number (adjustment_number),
                    INDEX idx_stock_adjustments_location (location_id),
                    INDEX idx_stock_adjustments_date (adjusted_at)
                )
            ");
        } catch (Exception $e) {}

        // stock_adjustments upgrades (location_id)
        try {
            if (self::hasTable($pdo, 'stock_adjustments')) {
                if (!self::hasColumn($pdo, 'stock_adjustments', 'location_id')) {
                    $pdo->exec("ALTER TABLE stock_adjustments ADD COLUMN location_id INT NOT NULL DEFAULT 1 AFTER id");
                }
                try { $pdo->exec("ALTER TABLE stock_adjustments ADD INDEX idx_stock_adjustments_location (location_id)"); } catch (Exception $e2) {}
            }
        } catch (Exception $e) {}

        // Dedicated Stock Counts (Stock Take Session)
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS stock_counts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    location_id INT NOT NULL DEFAULT 1,
                    count_number VARCHAR(50) NOT NULL,
                    counted_at DATETIME NOT NULL,
                    reason VARCHAR(255) NULL,
                    notes TEXT NULL,
                    status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
                    created_by INT NULL,
                    approved_by INT NULL,
                    approved_at DATETIME NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_stock_counts_number (count_number),
                    INDEX idx_stock_counts_location (location_id),
                    INDEX idx_stock_counts_date (counted_at),
                    INDEX idx_stock_counts_status (status)
                )
            ");

            $pdo->exec("
                CREATE TABLE IF NOT EXISTS stock_count_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    stock_count_id INT NOT NULL,
                    part_id INT NOT NULL,
                    batch_id INT NULL,
                    system_stock DECIMAL(12,3) NOT NULL DEFAULT 0.000,
                    physical_stock DECIMAL(12,3) NOT NULL DEFAULT 0.000,
                    variance DECIMAL(12,3) NOT NULL,
                    notes VARCHAR(255) NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_sci_count (stock_count_id),
                    INDEX idx_sci_part (part_id),
                    INDEX idx_sci_batch (batch_id),
                    FOREIGN KEY (stock_count_id) REFERENCES stock_counts(id) ON DELETE CASCADE,
                    FOREIGN KEY (part_id) REFERENCES parts(id)
                )
            ");
        } catch (Exception $e) {
            // ignore
        }

        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS stock_adjustment_items (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    stock_adjustment_id INT NOT NULL,
                    part_id INT NOT NULL,
                    batch_id INT NULL,
                    system_stock DECIMAL(12,3) NOT NULL DEFAULT 0.000,
                    physical_stock DECIMAL(12,3) NOT NULL DEFAULT 0.000,
                    qty_change DECIMAL(12,3) NOT NULL,
                    notes VARCHAR(255) NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_sai_adj (stock_adjustment_id),
                    INDEX idx_sai_part (part_id),
                    INDEX idx_sai_batch (batch_id)
                )
            ");
            try { $pdo->exec("ALTER TABLE stock_adjustment_items ADD CONSTRAINT fk_sai_adj FOREIGN KEY (stock_adjustment_id) REFERENCES stock_adjustments(id) ON DELETE CASCADE"); } catch (Exception $e2) {}
            try { $pdo->exec("ALTER TABLE stock_adjustment_items ADD CONSTRAINT fk_sai_part FOREIGN KEY (part_id) REFERENCES parts(id)"); } catch (Exception $e2) {}
        } catch (Exception $e) {}

        // stock_adjustment_items upgrades (system_stock, physical_stock)
        try {
            if (self::hasTable($pdo, 'stock_adjustment_items')) {
                $cols = [
                    'system_stock' => "DECIMAL(12,3) NOT NULL DEFAULT 0.000",
                    'physical_stock' => "DECIMAL(12,3) NOT NULL DEFAULT 0.000",
                ];
                foreach ($cols as $col => $def) {
                    if (!self::hasColumn($pdo, 'stock_adjustment_items', $col)) {
                        $pdo->exec("ALTER TABLE stock_adjustment_items ADD COLUMN {$col} {$def}");
                    }
                }
                // Ensure decimal types (existing installs might have INT columns).
                try { $pdo->exec("ALTER TABLE stock_adjustment_items MODIFY COLUMN system_stock DECIMAL(12,3) NOT NULL DEFAULT 0.000"); } catch (Exception $e2) {}
                try { $pdo->exec("ALTER TABLE stock_adjustment_items MODIFY COLUMN physical_stock DECIMAL(12,3) NOT NULL DEFAULT 0.000"); } catch (Exception $e2) {}
                try { $pdo->exec("ALTER TABLE stock_adjustment_items MODIFY COLUMN qty_change DECIMAL(12,3) NOT NULL"); } catch (Exception $e2) {}

                // Batch support for existing installs
                try {
                    if (!self::hasColumn($pdo, 'stock_adjustment_items', 'batch_id')) {
                        $pdo->exec("ALTER TABLE stock_adjustment_items ADD COLUMN batch_id INT NULL AFTER part_id");
                        $pdo->exec("ALTER TABLE stock_adjustment_items ADD INDEX idx_sai_batch (batch_id)");
                    }
                } catch (Exception $e2) {}
            }
        } catch (Exception $e) {
            // ignore
        }

        // Inventory Batches for FIFO & Expiry Tracking
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS inventory_batches (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    part_id INT NOT NULL,
                    location_id INT NOT NULL DEFAULT 1,
                    batch_number VARCHAR(100) NULL,
                    mfg_date DATE NULL,
                    expiry_date DATE NULL,
                    quantity_received DECIMAL(12,3) NOT NULL DEFAULT 0.000,
                    quantity_on_hand DECIMAL(12,3) NOT NULL DEFAULT 0.000,
                    unit_cost DECIMAL(15,4) NULL,
                    grn_id INT NULL,
                    is_exhausted TINYINT(1) NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_ib_part (part_id),
                    INDEX idx_ib_location (location_id),
                    INDEX idx_ib_mfg (mfg_date),
                    INDEX idx_ib_expiry (expiry_date),
                    INDEX idx_ib_exhausted (is_exhausted),
                    FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE,
                    FOREIGN KEY (location_id) REFERENCES service_locations(id)
                ) ENGINE=InnoDB
            ");
            
            // grn_items upgrades for batch collection
            if (self::hasTable($pdo, 'grn_items')) {
                $cols = [
                    'batch_number' => "VARCHAR(100) NULL",
                    'mfg_date' => "DATE NULL",
                    'expiry_date' => "DATE NULL",
                ];
                foreach ($cols as $col => $def) {
                    if (!self::hasColumn($pdo, 'grn_items', $col)) {
                        $pdo->exec("ALTER TABLE grn_items ADD COLUMN {$col} {$def}");
                    }
                }
            }

            // stock_movements upgrade: add batch_id to link movements to specific batches
            if (self::hasTable($pdo, 'stock_movements')) {
                if (!self::hasColumn($pdo, 'stock_movements', 'batch_id')) {
                    $pdo->exec("ALTER TABLE stock_movements ADD COLUMN batch_id INT NULL AFTER part_id");
                    $pdo->exec("ALTER TABLE stock_movements ADD INDEX idx_sm_batch (batch_id)");
                }
                // Repair order parts also need batch tracking if they are issued from a specific batch
                if (self::hasTable($pdo, 'order_parts') && !self::hasColumn($pdo, 'order_parts', 'batch_id')) {
                    $pdo->exec("ALTER TABLE order_parts ADD COLUMN batch_id INT NULL AFTER part_id");
                }
            }

            // E-Commerce Rich Data Support
            if (!self::hasColumn($pdo, 'parts', 'is_online')) {
                $pdo->exec("ALTER TABLE parts ADD COLUMN is_online TINYINT(1) NOT NULL DEFAULT 1");
            }
            if (!self::hasColumn($pdo, 'parts', 'public_description')) {
                $pdo->exec("ALTER TABLE parts ADD COLUMN public_description TEXT NULL");
            }

            // Product Gallery
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS part_images (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    part_id INT NOT NULL,
                    filename VARCHAR(255) NOT NULL,
                    label VARCHAR(100) NULL,
                    sort_order INT NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE
                )
            ");

            // Custom Attributes
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS attribute_groups (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    sort_order INT NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ");
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS attributes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    group_id INT NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    type ENUM('text', 'number', 'boolean', 'selection') NOT NULL DEFAULT 'text',
                    sort_order INT NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (group_id) REFERENCES attribute_groups(id) ON DELETE CASCADE
                )
            ");
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS part_attribute_values (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    part_id INT NOT NULL,
                    attribute_id INT NOT NULL,
                    value TEXT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_part_attr (part_id, attribute_id),
                    FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE,
                    FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE
                )
            ");
            
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS part_attribute_groups (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    part_id INT NOT NULL,
                    group_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_part_group (part_id, group_id),
                    FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE,
                    FOREIGN KEY (group_id) REFERENCES attribute_groups(id) ON DELETE CASCADE
                )
            ");

            // Storefront Menus (Nav Bar)
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS storefront_menus (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    parent_id INT NULL,
                    label VARCHAR(100) NOT NULL,
                    link_type ENUM('Internal', 'External', 'Category', 'Collection') NOT NULL DEFAULT 'Internal',
                    link_value VARCHAR(255) NULL,
                    sort_order INT NOT NULL DEFAULT 0,
                    is_active TINYINT(1) NOT NULL DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (parent_id) REFERENCES storefront_menus(id) ON DELETE CASCADE
                )
            ");

        } catch (Exception $e) {}

        @touch($flagFile);
    }
}
