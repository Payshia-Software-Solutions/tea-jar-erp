<?php
/**
 * Document Sequence Helper
 */
class DocumentSequenceHelper {
    
    /**
     * Get next standard document number (SL Government Format)
     * Format: YYMMM_QQQQ_XXXXX
     * Example: 25OCT_BR03_00001
     * 
     * @param string $docType e.g., 'INV', 'PO', 'GRN'
     * @param int $locationId 
     * @return string
     */
    public static function getStandardDocNo($docType, $locationId = 1) {
        $db = new Database();
        
        // 1. Get Branch Code
        $db->query("SELECT branch_code FROM service_locations WHERE id = :id");
        $db->bind(':id', $locationId);
        $loc = $db->single();
        $branchCode = ($loc && !empty($loc->branch_code)) ? $loc->branch_code : 'BR01';
        
        $db->beginTransaction();
        try {
            // Get sequence config
            $db->query("SELECT next_number, padding FROM document_sequences WHERE doc_type = :type FOR UPDATE");
            $db->bind(':type', $docType);
            $seq = $db->single();
            
            if (!$seq) {
                // Initialize if not exists
                $db->query("INSERT INTO document_sequences (doc_type, prefix, next_number, padding) VALUES (:type, :prefix, 2, 5)");
                $db->bind(':type', $docType);
                $db->bind(':prefix', $docType . '-');
                $db->execute();
                
                $nextNum = 1;
                $padding = 5;
            } else {
                $nextNum = $seq->next_number;
                $padding = $seq->padding > 0 ? $seq->padding : 5;
                
                $db->query("UPDATE document_sequences SET next_number = next_number + 1 WHERE doc_type = :type");
                $db->bind(':type', $docType);
                $db->execute();
            }
            
            $db->commit();
            
            // Construct format: YYMMM_QQQQ_XXXXX
            $yy = date('y');
            $mmm = strtoupper(date('M'));
            $seqPart = str_pad($nextNum, $padding, '0', STR_PAD_LEFT);
            
            // Format strictly as requested
            if ($docType === 'INV') {
                $docNo = "{$yy}{$mmm}_{$branchCode}_{$seqPart}";
            } else {
                $docNo = "{$docType}_{$yy}{$mmm}_{$branchCode}_{$seqPart}";
            }
            
            // Ensure no spaces and max 40 chars
            $docNo = str_replace(' ', '', $docNo);
            return substr($docNo, 0, 40);
            
        } catch (Exception $e) {
            $db->rollBack();
            return $docType . '-' . time();
        }
    }

    /**
     * Legacy method for backward compatibility
     */
    public static function getNext($docType, $locationId = 1) {
        return self::getStandardDocNo($docType, $locationId);
    }

    /**
     * Get next number with date prefix (e.g. WEB/20260513/0001)
     * Automatically resets daily.
     */
    public static function getNextDateBased($docType, $locationId = 1) {
        // Date based sequence should also follow standard if possible, 
        // but since it resets daily, we append the date to the doc_type key.
        $date = date('Ymd');
        $fullType = $docType . '_' . $date;
        $db = new Database();
        
        // 1. Get Branch Code
        $db->query("SELECT branch_code FROM service_locations WHERE id = :id");
        $db->bind(':id', $locationId);
        $loc = $db->single();
        $branchCode = ($loc && !empty($loc->branch_code)) ? $loc->branch_code : 'BR01';
        
        $db->beginTransaction();
        try {
            $db->query("SELECT next_number, padding FROM document_sequences WHERE doc_type = :type FOR UPDATE");
            $db->bind(':type', $fullType);
            $seq = $db->single();
            
            if (!$seq) {
                // Initialize for today
                $prefix = $docType . $date;
                $db->query("INSERT INTO document_sequences (doc_type, prefix, next_number, padding) VALUES (:type, :prefix, 2, 5)");
                $db->bind(':type', $fullType);
                $db->bind(':prefix', $prefix);
                $db->execute();
                
                $nextNum = 1;
                $padding = 5;
            } else {
                $nextNum = $seq->next_number;
                $padding = $seq->padding > 0 ? $seq->padding : 5;
                
                $db->query("UPDATE document_sequences SET next_number = next_number + 1 WHERE doc_type = :type");
                $db->bind(':type', $fullType);
                $db->execute();
            }

            $db->commit();
            
            $yy = date('y');
            $mmm = strtoupper(date('M'));
            $seqPart = str_pad($nextNum, $padding, '0', STR_PAD_LEFT);
            
            if ($docType === 'INV') {
                $docNo = "{$yy}{$mmm}_{$branchCode}_{$seqPart}";
            } else {
                $docNo = "{$docType}_{$yy}{$mmm}_{$branchCode}_{$seqPart}";
            }
            
            $docNo = str_replace(' ', '', $docNo);
            return substr($docNo, 0, 40);
        } catch (Exception $e) {
            $db->rollBack();
            return $docType . $date . substr(time(), -4);
        }
    }
}
