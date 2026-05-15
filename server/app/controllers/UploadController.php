<?php
/**
 * Upload Controller
 * Uploads vehicle images and order attachments to FTP storage.
 *
 * Endpoints:
 *  - POST /api/upload/vehicle_image (field: image)
 *  - POST /api/upload/order_attachment (field: file)
 *  - POST /api/upload/part_image (field: image)
 */

class UploadController extends Controller {
    private $auditModel;

    public function __construct() {
        $this->auditModel = $this->model('AuditLog');
    }

    private function extFromName($name) {
        $name = strtolower((string)$name);
        $dot = strrpos($name, '.');
        if ($dot === false) return '';
        return substr($name, $dot + 1);
    }

    private function safeFilename($prefix, $originalName) {
        $ext = $this->extFromName($originalName);
        $ext = preg_replace('/[^a-z0-9]+/', '', $ext);
        if ($ext === '') $ext = 'bin';

        $rand = bin2hex(random_bytes(8));
        $ts = date('Ymd_His');
        return $prefix . '_' . $ts . '_' . $rand . '.' . $ext;
    }

    private function requireFile($field) {
        if (!isset($_FILES[$field])) {
            $this->error('Missing file field: ' . $field, 400);
        }
        $f = $_FILES[$field];
        if (!is_array($f) || ($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            $msg = 'Upload failed';
            $err = $f['error'] ?? null;
            if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE) $msg = 'File too large';
            $this->error($msg, 400);
        }
        if (!is_uploaded_file($f['tmp_name'])) {
            $this->error('Invalid upload', 400);
        }
        return $f;
    }

    // POST /api/upload/vehicle_image
    public function vehicle_image() {
        $u = $this->requirePermission('vehicles.write');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            $this->error('Method Not Allowed', 405);
        }

        $f = $this->requireFile('image');
        $allowed = ['jpg','jpeg','png','webp','gif'];
        $ext = strtolower($this->extFromName($f['name'] ?? ''));
        if ($ext && !in_array($ext, $allowed, true)) {
            $this->error('Unsupported image type', 400);
        }

        $filename = $this->safeFilename('veh', $f['name'] ?? 'image');
        $dir = trim((string)CONTENT_VEHICLES_DIR, '/');

        try {
            $ftp = new FtpStorage();
            $ftp->upload($f['tmp_name'], $dir, $filename);
        } catch (Exception $e) {
            $this->error('FTP upload failed', 500);
        }

        $this->auditModel->write([
            'user_id' => (int)$u['sub'],
            'action' => 'upload',
            'entity' => 'vehicle_image',
            'entity_id' => null,
            'method' => $_SERVER['REQUEST_METHOD'] ?? '',
            'path' => $_SERVER['REQUEST_URI'] ?? '',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'details' => json_encode(['filename' => $filename]),
        ]);

        $this->success([
            'filename' => $filename,
            'url' => rtrim(CONTENT_BASE_URL, '/') . '/' . trim(CONTENT_VEHICLES_DIR, '/') . '/' . $filename,
        ], 'Uploaded');
    }

    // POST /api/upload/order_attachment
    public function order_attachment() {
        $u = $this->requirePermission('orders.write');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            $this->error('Method Not Allowed', 405);
        }

        $f = $this->requireFile('file');
        $filename = $this->safeFilename('ord', $f['name'] ?? 'file');
        $dir = trim((string)CONTENT_ORDERS_DIR, '/');

        try {
            $ftp = new FtpStorage();
            $ftp->upload($f['tmp_name'], $dir, $filename);
        } catch (Exception $e) {
            $this->error('FTP upload failed', 500);
        }

        $this->auditModel->write([
            'user_id' => (int)$u['sub'],
            'action' => 'upload',
            'entity' => 'order_attachment',
            'entity_id' => null,
            'method' => $_SERVER['REQUEST_METHOD'] ?? '',
            'path' => $_SERVER['REQUEST_URI'] ?? '',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'details' => json_encode(['filename' => $filename]),
        ]);

        $this->success([
            'filename' => $filename,
            'url' => rtrim(CONTENT_BASE_URL, '/') . '/' . trim(CONTENT_ORDERS_DIR, '/') . '/' . $filename,
        ], 'Uploaded');
    }

    // POST /api/upload/part_image
    public function part_image() {
        $u = $this->requirePermission('parts.write');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            $this->error('Method Not Allowed', 405);
        }

        $f = $this->requireFile('image');
        $allowed = ['jpg','jpeg','png','webp','gif'];
        $ext = strtolower($this->extFromName($f['name'] ?? ''));
        if ($ext && !in_array($ext, $allowed, true)) {
            $this->error('Unsupported image type', 400);
        }

        $filename = $this->safeFilename('itm', $f['name'] ?? 'image');
        $dir = trim((string)CONTENT_ITEMS_DIR, '/');

        try {
            $ftp = new FtpStorage();
            $ftp->upload($f['tmp_name'], $dir, $filename);
        } catch (Exception $e) {
            $this->error('FTP upload failed', 500);
        }

        $this->auditModel->write([
            'user_id' => (int)$u['sub'],
            'action' => 'upload',
            'entity' => 'part_image',
            'entity_id' => null,
            'method' => $_SERVER['REQUEST_METHOD'] ?? '',
            'path' => $_SERVER['REQUEST_URI'] ?? '',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'details' => json_encode(['filename' => $filename]),
        ]);

        $this->success([
            'filename' => $filename,
            'url' => rtrim(CONTENT_BASE_URL, '/') . '/' . trim(CONTENT_ITEMS_DIR, '/') . '/' . $filename,
        ], 'Uploaded');
    }

    // POST /api/upload/marketing_image
    public function marketing_image() {
        // We only require basic authenticated access for marketing, or a specific permission
        $u = $this->requireAuth();
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            $this->error('Method Not Allowed', 405);
        }

        $f = $this->requireFile('image');
        $allowed = ['jpg','jpeg','png','webp','gif'];
        $ext = strtolower($this->extFromName($f['name'] ?? ''));
        if ($ext && !in_array($ext, $allowed, true)) {
            $this->error('Unsupported image type', 400);
        }

        $filename = $this->safeFilename('mkt', $f['name'] ?? 'image');
        $dir = 'marketing'; // Hardcoded directory for marketing assets

        try {
            $ftp = new FtpStorage();
            $ftp->upload($f['tmp_name'], $dir, $filename);
        } catch (Exception $e) {
            $this->error('FTP upload failed: ' . $e->getMessage(), 500);
        }

        $url = rtrim(CONTENT_BASE_URL ?? 'https://content-provider.payshia.com', '/') . '/' . $dir . '/' . $filename;

        // Insert into marketing_media table
        try {
            $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME, DB_USER, DB_PASS);
            $stmt = $pdo->prepare("INSERT INTO marketing_media (filename, url) VALUES (:f, :u)");
            $stmt->execute([':f' => $filename, ':u' => $url]);
            $media_id = $pdo->lastInsertId();
        } catch (Exception $e) {
            // Non-fatal if DB insert fails, but log it
            error_log("Failed to insert marketing media: " . $e->getMessage());
        }

        $this->auditModel->write([
            'user_id' => (int)$u['sub'],
            'action' => 'upload',
            'entity' => 'marketing_image',
            'entity_id' => $media_id ?? null,
            'method' => $_SERVER['REQUEST_METHOD'] ?? '',
            'path' => $_SERVER['REQUEST_URI'] ?? '',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'details' => json_encode(['filename' => $filename, 'url' => $url]),
        ]);

        $this->success([
            'id' => $media_id ?? null,
            'filename' => $filename,
            'url' => $url,
        ], 'Uploaded successfully');
    }

    // POST /api/upload/part_gallery
    public function part_gallery() {
        $u = $this->requirePermission('parts.write');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            $this->error('Method Not Allowed', 405);
        }

        $partId = isset($_POST['part_id']) ? (int)$_POST['part_id'] : 0;
        if ($partId <= 0) $this->error('part_id is required', 400);

        $f = $this->requireFile('image');
        $allowed = ['jpg','jpeg','png','webp','gif'];
        $ext = strtolower($this->extFromName($f['name'] ?? ''));
        if ($ext && !in_array($ext, $allowed, true)) {
            $this->error('Unsupported image type', 400);
        }

        $filename = $this->safeFilename('glr', $f['name'] ?? 'image');
        $dir = trim((string)CONTENT_ITEMS_DIR, '/');

        try {
            $ftp = new FtpStorage();
            $ftp->upload($f['tmp_name'], $dir, $filename);
            
            require_once '../app/models/PartImage.php';
            $imgModel = new PartImage();
            $imgModel->add($partId, $filename, $_POST['label'] ?? null, (int)$u['sub']);

        } catch (Exception $e) {
            $this->error('Upload failed: ' . $e->getMessage(), 500);
        }

        $this->success([
            'filename' => $filename,
            'url' => rtrim(CONTENT_BASE_URL, '/') . '/' . trim(CONTENT_ITEMS_DIR, '/') . '/' . $filename,
        ], 'Uploaded to gallery');
    }

    // POST /api/upload/storefront_asset
    public function storefront_asset() {
        $u = $this->requireAuth();
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            $this->error('Method Not Allowed', 405);
        }

        $f = $this->requireFile('file');
        $allowed = ['jpg','jpeg','png','webp','gif','mp4','webm','mov','svg'];
        $ext = strtolower($this->extFromName($f['name'] ?? ''));
        if ($ext && !in_array($ext, $allowed, true)) {
            $this->error('Unsupported file type', 400);
        }

        $filename = $this->safeFilename('stf', $f['name'] ?? 'file');
        $dir = 'storefront'; 

        try {
            $ftp = new FtpStorage();
            $ftp->upload($f['tmp_name'], $dir, $filename);
        } catch (Exception $e) {
            $this->error('FTP upload failed', 500);
        }

        $url = rtrim(CONTENT_BASE_URL ?? 'https://content-provider.payshia.com', '/') . '/' . $dir . '/' . $filename;

        $this->success([
            'filename' => $filename,
            'url' => $url,
        ], 'Uploaded successfully');
    }

    // POST /api/upload/vehicle_document
    public function vehicle_document() {
        $u = $this->requirePermission('vehicles.write');
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            $this->error('Method Not Allowed', 405);
        }

        $f = $this->requireFile('file');
        $filename = $this->safeFilename('doc', $f['name'] ?? 'file');
        $dir = trim((string)CONTENT_DOCUMENTS_DIR, '/');

        try {
            $ftp = new FtpStorage();
            $ftp->upload($f['tmp_name'], $dir, $filename);
        } catch (Exception $e) {
            $this->error('FTP upload failed', 500);
        }

        $this->auditModel->write([
            'user_id' => (int)$u['sub'],
            'action' => 'upload',
            'entity' => 'vehicle_document',
            'entity_id' => null,
            'method' => $_SERVER['REQUEST_METHOD'] ?? '',
            'path' => $_SERVER['REQUEST_URI'] ?? '',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'details' => json_encode(['filename' => $filename]),
        ]);

        $this->success([
            'filename' => $filename,
            'url' => rtrim(CONTENT_BASE_URL, '/') . '/' . trim(CONTENT_DOCUMENTS_DIR, '/') . '/' . $filename,
        ], 'Uploaded');
    }
}
