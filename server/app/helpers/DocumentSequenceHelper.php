<?php
/**
 * Document Sequence Helper
 */
class DocumentSequenceHelper {
    public static function getNext($docType) {
        $db = new Database();
        $db->beginTransaction();
        try {
            $db->query("SELECT prefix, next_number, padding FROM document_sequences WHERE doc_type = :type FOR UPDATE");
            $db->bind(':type', $docType);
            $seq = $db->single();
            
            if (!$seq) {
                $db->rollBack();
                return $docType . '-' . time();
            }

            $docNo = $seq->prefix . str_pad($seq->next_number, $seq->padding, '0', STR_PAD_LEFT);

            // Update sequence
            $db->query("UPDATE document_sequences SET next_number = next_number + 1 WHERE doc_type = :type");
            $db->bind(':type', $docType);
            $db->execute();

            $db->commit();
            return $docNo;
        } catch (Exception $e) {
            $db->rollBack();
            return $docType . '-' . time();
        }
    }

    /**
     * Get next number with date prefix (e.g. WEB/20260513/0001)
     * Automatically resets daily.
     */
    public static function getNextDateBased($docType) {
        $date = date('Ymd');
        $fullType = $docType . '_' . $date;
        $db = new Database();
        $db->beginTransaction();
        try {
            $db->query("SELECT next_number, padding FROM document_sequences WHERE doc_type = :type FOR UPDATE");
            $db->bind(':type', $fullType);
            $seq = $db->single();
            
            if (!$seq) {
                // Initialize for today
                $prefix = $docType . $date;
                $db->query("INSERT INTO document_sequences (doc_type, prefix, next_number, padding) VALUES (:type, :prefix, 2, 4)");
                $db->bind(':type', $fullType);
                $db->bind(':prefix', $prefix);
                $db->execute();
                $db->commit();
                return $prefix . '0001';
            }

            $prefix = $docType . $date;
            $docNo = $prefix . str_pad($seq->next_number, $seq->padding, '0', STR_PAD_LEFT);

            $db->query("UPDATE document_sequences SET next_number = next_number + 1 WHERE doc_type = :type");
            $db->bind(':type', $fullType);
            $db->execute();

            $db->commit();
            return $docNo;
        } catch (Exception $e) {
            $db->rollBack();
            return $docType . $date . substr(time(), -4);
        }
    }
}
