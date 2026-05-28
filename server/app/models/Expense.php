<?php
/**
 * Expense Model
 * Handles general payment vouchers for utilities, services, and miscellaneous expenses.
 */
class Expense extends Model {
    private $table = 'acc_expenses';

    public function __construct() {
        parent::__construct();
        // // $this->ensureSchema();
    }

    public function ensureSchema() { return;
        $this->db->query("
            CREATE TABLE IF NOT EXISTS {$this->table} (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                voucher_no      VARCHAR(30) NOT NULL UNIQUE,
                payee_id        INT NULL,
                expense_account_id INT NOT NULL,
                payment_account_id INT NOT NULL,
                amount          DECIMAL(12,2) NOT NULL,
                payment_date    DATE NOT NULL,
                payee_name      VARCHAR(150) NOT NULL,
                payment_method  ENUM('Cash', 'Cheque', 'TT', 'Bank Transfer') NOT NULL DEFAULT 'Cash',
                cheque_no       VARCHAR(50) NULL,
                tt_ref_no       VARCHAR(50) NULL,
                reference_no    VARCHAR(100) NULL,
                notes           TEXT NULL,
                status          ENUM('Paid', 'Pending', 'Cancelled') NOT NULL DEFAULT 'Paid',
                created_by      INT NULL,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_exp_payee   (payee_id),
                INDEX idx_exp_account (expense_account_id),
                INDEX idx_exp_payment (payment_account_id),
                INDEX idx_exp_date    (payment_date),
                INDEX idx_exp_method  (payment_method)
            )
        ");
        $this->db->execute();

        // Add cancellation columns if missing
        $cols = [
            'cancelled_at' => "DATETIME NULL",
            'cancelled_by' => "INT NULL",
            'cancellation_reason' => "TEXT NULL"
        ];
        foreach ($cols as $col => $def) {
            try {
                $this->db->query("SELECT $col FROM {$this->table} LIMIT 1");
                $this->db->execute();
            } catch (Exception $e) {
                $this->db->query("ALTER TABLE {$this->table} ADD COLUMN $col $def");
                $this->db->execute();
            }
        }

        // Seed sequence if missing
        $this->db->query("INSERT IGNORE INTO document_sequences (doc_type, prefix, next_number, padding) VALUES ('PV', 'PV-', 1, 5)");
        $this->db->execute();
    }

    public function cancel($id, $reason, $userId) {
        $exp = $this->getById($id);
        if (!$exp) return false;
        if ($exp->status === 'Cancelled') return true;

        $this->db->beginTransaction();
        try {
            // 1. Update Expense Status
            $this->db->query("
                UPDATE {$this->table} 
                SET status = 'Cancelled',
                    cancelled_at = NOW(),
                    cancelled_by = :user,
                    cancellation_reason = :reason
                WHERE id = :id
            ");
            $this->db->bind(':user', $userId);
            $this->db->bind(':reason', $reason);
            $this->db->bind(':id', $id);
            $this->db->execute();

            // 2. Reverse Accounting Entries
            require_once 'Journal.php';
            $journal = new Journal();
            $journal->reverseEntries('Expense', $id, $userId);

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Expense cancellation failed: " . $e->getMessage());
            return false;
        }
    }

    private function generateVoucherNo($locationId = 1) {
        require_once __DIR__ . '/../helpers/DocumentSequenceHelper.php';
        return DocumentSequenceHelper::getStandardDocNo('PV', $locationId);
    }

    public function create($data) {
        try {
            $this->db->beginTransaction();

            $voucherNo = $this->generateVoucherNo($data['location_id'] ?? 1);

            $this->db->query("
                INSERT INTO {$this->table} 
                    (voucher_no, payee_id, expense_account_id, payment_account_id, amount, payment_date, payee_name, payment_method, cheque_no, tt_ref_no, reference_no, notes, status, created_by)
                VALUES 
                    (:voucher_no, :payee_id, :expense_account_id, :payment_account_id, :amount, :payment_date, :payee_name, :payment_method, :cheque_no, :tt_ref_no, :reference_no, :notes, :status, :created_by)
            ");
            $this->db->bind(':voucher_no', $voucherNo);
            $this->db->bind(':payee_id', $data['payee_id'] ?? null);
            $this->db->bind(':expense_account_id', $data['expense_account_id']);
            $this->db->bind(':payment_account_id', $data['payment_account_id']);
            $this->db->bind(':amount', $data['amount']);
            $this->db->bind(':payment_date', $data['payment_date'] ?? date('Y-m-d'));
            $this->db->bind(':payee_name', $data['payee_name']);
            $this->db->bind(':payment_method', $data['payment_method'] ?? 'Cash');
            $this->db->bind(':cheque_no', $data['cheque_no'] ?? null);
            $this->db->bind(':tt_ref_no', $data['tt_ref_no'] ?? null);
            $this->db->bind(':reference_no', $data['reference_no'] ?? null);
            $this->db->bind(':notes', $data['notes'] ?? null);
            $this->db->bind(':status', $data['status'] ?? 'Paid');
            $this->db->bind(':created_by', $data['userId']);
            $this->db->execute();

            $expenseId = $this->db->lastInsertId();

            $this->db->commit();

            // Accounting integration
            require_once __DIR__ . '/../helpers/AccountingHelper.php';
            AccountingHelper::postExpenseVoucher($expenseId, $data);

            return $expenseId;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Expense create failed: " . $e->getMessage());
            return false;
        }
    }

    public function getAll($filters = []) {
        $sql = "SELECT e.*, ea.name as expense_account_name, pa.name as payment_account_name 
                FROM {$this->table} e
                JOIN acc_accounts ea ON e.expense_account_id = ea.id
                JOIN acc_accounts pa ON e.payment_account_id = pa.id
                WHERE e.status != 'Cancelled'";
        
        if (!empty($filters['from_date'])) $sql .= " AND e.payment_date >= :from";
        if (!empty($filters['to_date'])) $sql .= " AND e.payment_date <= :to";
        if (!empty($filters['expense_account_id'])) $sql .= " AND e.expense_account_id = :eaid";
        
        $sql .= " ORDER BY e.payment_date DESC, e.id DESC";
        
        $this->db->query($sql);
        if (!empty($filters['from_date'])) $this->db->bind(':from', $filters['from_date']);
        if (!empty($filters['to_date'])) $this->db->bind(':to', $filters['to_date']);
        if (!empty($filters['expense_account_id'])) $this->db->bind(':eaid', $filters['expense_account_id']);
        
        return $this->db->resultSet();
    }
    public function getById($id) {
        $sql = "SELECT e.*, ea.name as expense_account_name, pa.name as payment_account_name, p.address as payee_address
                FROM {$this->table} e
                JOIN acc_accounts ea ON e.expense_account_id = ea.id
                JOIN acc_accounts pa ON e.payment_account_id = pa.id
                LEFT JOIN acc_payees p ON e.payee_id = p.id
                WHERE e.id = :id LIMIT 1";
        $this->db->query($sql);
        $this->db->bind(':id', (int)$id);
        return $this->db->single();
    }
}
