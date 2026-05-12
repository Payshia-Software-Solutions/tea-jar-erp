<?php
/**
 * ProductReview Model
 */
class ProductReview extends Model {
    
    public function getAll($status = null) {
        $sql = "SELECT pr.*, p.part_number, p.part_name as product_name, c.name as customer_name 
                FROM product_reviews pr
                JOIN parts p ON pr.part_id = p.id
                JOIN customers c ON pr.customer_id = c.id";
        
        if ($status) {
            $sql .= " WHERE pr.status = :status";
        }
        
        $sql .= " ORDER BY pr.created_at DESC";
        
        $this->db->query($sql);
        if ($status) {
            $this->db->bind(':status', $status);
        }
        return $this->db->resultSet();
    }

    public function getByProduct($partId, $onlyApproved = true) {
        $sql = "SELECT pr.*, c.name as customer_name 
                FROM product_reviews pr
                JOIN customers c ON pr.customer_id = c.id
                WHERE pr.part_id = :pid";
        
        if ($onlyApproved) {
            $sql .= " AND pr.status = 'Approved'";
        }
        
        $sql .= " ORDER BY pr.created_at DESC";
        
        $this->db->query($sql);
        $this->db->bind(':pid', (int)$partId);
        $reviews = $this->db->resultSet();

        // Get images for each review
        foreach ($reviews as &$review) {
            $review->images = $this->getReviewImages($review->id);
        }

        return $reviews;
    }

    public function getReviewImages($reviewId) {
        $this->db->query("SELECT * FROM product_review_images WHERE review_id = :rid");
        $this->db->bind(':rid', (int)$reviewId);
        return $this->db->resultSet();
    }

    public function add($data) {
        $this->db->query("
            INSERT INTO product_reviews (part_id, customer_id, rating, comment, status)
            VALUES (:pid, :cid, :rating, :comment, :status)
        ");
        $this->db->bind(':pid', (int)$data['part_id']);
        $this->db->bind(':cid', (int)$data['customer_id']);
        $this->db->bind(':rating', (int)$data['rating']);
        $this->db->bind(':comment', $data['comment']);
        $this->db->bind(':status', $data['status'] ?? 'Pending');
        
        if ($this->db->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function addImage($reviewId, $imagePath) {
        $this->db->query("INSERT INTO product_review_images (review_id, image_path) VALUES (:rid, :path)");
        $this->db->bind(':rid', (int)$reviewId);
        $this->db->bind(':path', $imagePath);
        return $this->db->execute();
    }

    public function updateStatus($id, $status) {
        $this->db->query("UPDATE product_reviews SET status = :status WHERE id = :id");
        $this->db->bind(':status', $status);
        $this->db->bind(':id', (int)$id);
        return $this->db->execute();
    }

    public function updateReply($id, $reply) {
        $this->db->query("UPDATE product_reviews SET admin_reply = :reply, replied_at = NOW() WHERE id = :id");
        $this->db->bind(':reply', $reply);
        $this->db->bind(':id', (int)$id);
        return $this->db->execute();
    }

    public function getByCustomer($customerId) {
        $this->db->query("SELECT * FROM product_reviews WHERE customer_id = :cid ORDER BY created_at DESC");
        $this->db->bind(':cid', (int)$customerId);
        return $this->db->resultSet();
    }

    public function delete($id) {
        $this->db->query("DELETE FROM product_reviews WHERE id = :id");
        $this->db->bind(':id', (int)$id);
        return $this->db->execute();
    }
}
