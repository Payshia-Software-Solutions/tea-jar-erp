<?php
/**
 * Promotion (Marketing & Discounts) Model
 */
class Promotion extends Model {
    private $table = 'promotions';

    public function __construct() {
        parent::__construct();
        require_once '../app/helpers/PromotionSchema.php';
        PromotionSchema::ensure();
    }

    /**
     * Fetch currently active promotions.
     */
    public function getActivePromotions($locationId = null) {
        $today = date('Y-m-d');
        $sql = "
            SELECT * FROM {$this->table}
            WHERE is_active = 1
            AND (start_date IS NULL OR start_date <= :today)
            AND (end_date IS NULL OR end_date >= :today)
        ";

        if ($locationId) {
            $sql .= " AND (applicable_locations IS NULL OR applicable_locations = '' OR JSON_CONTAINS(applicable_locations, :locId)) ";
        }

        $sql .= " ORDER BY priority DESC, id DESC";

        $this->db->query($sql);
        $this->db->bind(':today', $today);
        if ($locationId) $this->db->bind(':locId', json_encode((int)$locationId));

        $promotions = $this->db->resultSet();

        foreach ($promotions as $promo) {
            $promo->conditions = $this->getConditions($promo->id);
            $promo->benefits = $this->getBenefits($promo->id);
            $this->enrichPromotionDetails($promo);
        }

        return $promotions;
    }

    private function enrichPromotionDetails(&$promo) {
        // Collect all IDs needed for lookup
        $partIds = [];
        $collectionIds = [];

        foreach ($promo->conditions as $cond) {
            if ($cond->condition_type === 'ItemList') {
                $ids = json_decode($cond->requirement_value, true) ?: [];
                $partIds = array_merge($partIds, $ids);
            }
            if ($cond->condition_type === 'CollectionList') {
                $ids = json_decode($cond->requirement_value, true) ?: [];
                $collectionIds = array_merge($collectionIds, $ids);
            }
        }

        foreach ($promo->benefits as $ben) {
            if ($ben->benefit_type === 'FreeItem' && $ben->benefit_value > 0) {
                $partIds[] = (int)$ben->benefit_value;
            }
            $tIds = json_decode($ben->trigger_items ?? '[]', true) ?: [];
            $rIds = json_decode($ben->reward_items ?? '[]', true) ?: [];
            $partIds = array_merge($partIds, $tIds, $rIds);
        }

        $partIds = array_unique(array_filter($partIds));
        $collectionIds = array_unique(array_filter($collectionIds));

        $partNames = !empty($partIds) ? $this->fetchPartNamesByIds($partIds) : [];
        $collectionNames = !empty($collectionIds) ? $this->fetchCollectionNamesByIds($collectionIds) : [];

        // Map them back
        foreach ($promo->conditions as &$cond) {
            if ($cond->condition_type === 'ItemList') {
                $ids = json_decode($cond->requirement_value, true) ?: [];
                $cond->item_names = array_intersect_key($partNames, array_flip($ids));
            }
            if ($cond->condition_type === 'CollectionList') {
                $ids = json_decode($cond->requirement_value, true) ?: [];
                $cond->collection_names = array_intersect_key($collectionNames, array_flip($ids));
            }
        }

        foreach ($promo->benefits as &$ben) {
            if ($ben->benefit_type === 'FreeItem') {
                $ben->item_name = $partNames[(int)$ben->benefit_value] ?? 'Unknown Item';
            }
            $tIds = json_decode($ben->trigger_items ?? '[]', true) ?: [];
            $rIds = json_decode($ben->reward_items ?? '[]', true) ?: [];
            $ben->trigger_item_names = array_intersect_key($partNames, array_flip($tIds));
            $ben->reward_item_names = array_intersect_key($partNames, array_flip($rIds));
        }
    }

    private function fetchPartNamesByIds($ids) {
        if (empty($ids)) return [];
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $this->db->query("SELECT id, part_name FROM parts WHERE id IN ($placeholders)");
        foreach ($ids as $k => $id) $this->db->bind($k + 1, $id);
        $rows = $this->db->resultSet();
        $map = [];
        foreach ($rows as $r) $map[$r->id] = $r->part_name;
        return $map;
    }

    private function fetchCollectionNamesByIds($ids) {
        if (empty($ids)) return [];
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $this->db->query("SELECT id, name FROM parts_categories WHERE id IN ($placeholders)");
        foreach ($ids as $k => $id) $this->db->bind($k + 1, $id);
        $rows = $this->db->resultSet();
        $map = [];
        foreach ($rows as $r) $map[$r->id] = $r->name;
        return $map;
    }

    private function getConditions($promoId) {
        $this->db->query("SELECT * FROM promotion_conditions WHERE promotion_id = :pid");
        $this->db->bind(':pid', $promoId);
        return $this->db->resultSet();
    }

    private function getBenefits($promoId) {
        $this->db->query("SELECT * FROM promotion_benefits WHERE promotion_id = :pid");
        $this->db->bind(':pid', $promoId);
        return $this->db->resultSet();
    }

    /**
     * Get a detailed string explaining why a promotion is rejected for a cart.
     */
    public function getPromotionRejectionReason($promoId, $cartItems, $subtotal, $bankId = null, $cardCategory = null, $locationId = null) {
        $promo = $this->getPromotion($promoId);
        if (!$promo) return "Promotion ID {$promoId} does not exist.";
        if (!$promo->is_active) return "Promotion '{$promo->name}' is not active.";
        
        $today = date('Y-m-d');
        if ($promo->start_date && $promo->start_date > $today) return "Promotion '{$promo->name}' has not started yet.";
        if ($promo->end_date && $promo->end_date < $today) return "Promotion '{$promo->name}' has expired.";
        
        if ($locationId && $promo->applicable_locations) {
            $locs = json_decode($promo->applicable_locations, true) ?: [];
            if (!in_array((string)$locationId, $locs) && !in_array((int)$locationId, $locs)) {
                return "Promotion '{$promo->name}' is not applicable at this location.";
            }
        }

        // Check conditions
        if (!empty($promo->conditions)) {
            foreach ($promo->conditions as $cond) {
                switch ($cond->condition_type) {
                    case 'MinAmount':
                        if ($subtotal < (float)$cond->requirement_value) return "Minimum order amount of {$cond->requirement_value} not met.";
                        break;
                    case 'MinQty':
                        $totalQty = array_reduce($cartItems, function($acc, $item) { return $acc + $item->quantity; }, 0);
                        if ($totalQty < (int)$cond->requirement_value) return "Minimum quantity of {$cond->requirement_value} not met.";
                        break;
                    case 'ItemList':
                        $required = json_decode($cond->requirement_value, true) ?: [];
                        $itemIdsInCart = array_map(function($i) { return (int)($i->item_id ?? $i->id ?? 0); }, $cartItems);
                        $intersect = array_intersect($required, $itemIdsInCart);
                        if ($cond->operator === 'IN' && empty($intersect)) return "Required promotional items are missing from the cart.";
                        break;
                    case 'BankCard':
                        if (!$bankId || (int)$cond->requirement_value !== (int)$bankId) return "Promotion requires a specific bank card.";
                        break;
                    case 'CardCategory':
                        if ($cond->requirement_value !== 'Any' && $cardCategory !== $cond->requirement_value) return "Promotion requires a {$cond->requirement_value} card.";
                        break;
                }
            }
        }

        $benefit = $this->calculateBenefitValue($promo, $cartItems, $subtotal);
        if ($benefit->discount_value <= 0 && empty($benefit->missing_rewards)) {
            return "Cart does not contain the required combination or quantities of items to trigger the discount.";
        }

        return "Unknown validation failure.";
    }

    /**
     * Logic to find the SINGLE BEST promotion for a given cart.
     * $cartItems: Array of objects with [id, quantity, unit_price, collection_id]
     * $bankId: Optional ID of the bank selected during checkout
     * $cardCategory: Optional category of the card (Credit/Debit)
     * $locationId: Optional ID of the location to filter by
     */
    public function findEligiblePromotions($cartItems, $subtotal, $bankId = null, $cardCategory = null, $locationId = null) {
        $active = $this->getActivePromotions($locationId);
        $matches = [];

        foreach ($active as $promo) {
            if ($this->isEligible($promo, $cartItems, $subtotal, $bankId, $cardCategory)) {
                $benefit = $this->calculateBenefitValue($promo, $cartItems, $subtotal);
                if ($benefit->discount_value > 0 || !empty($benefit->missing_rewards)) {
                    $matches[] = $benefit;
                }
            }
        }

        // Sort by total discount value (highest first)
        usort($matches, function($a, $b) {
            return $b->discount_value <=> $a->discount_value;
        });

        return $matches;
    }

    // Keep findBestPromotion for legacy/backend internal validation (returns best match)
    public function findBestPromotion($cartItems, $subtotal, $bankId = null, $cardCategory = null, $locationId = null) {
        $matches = $this->findEligiblePromotions($cartItems, $subtotal, $bankId, $cardCategory, $locationId);
        return !empty($matches) ? $matches[0] : null;
    }

    private function isEligible($promo, $cartItems, $subtotal, $bankId = null, $cardCategory = null) {
        if (empty($promo->conditions)) return true;

        foreach ($promo->conditions as $cond) {
            switch ($cond->condition_type) {
                case 'MinAmount':
                    if ($subtotal < (float)$cond->requirement_value) return false;
                    break;
                case 'MinQty':
                    $totalQty = array_reduce($cartItems, function($acc, $item) { return $acc + $item->quantity; }, 0);
                    if ($totalQty < (int)$cond->requirement_value) return false;
                    break;
                case 'ItemList':
                    $required = json_decode($cond->requirement_value, true) ?: [];
                    $itemIdsInCart = array_map(function($i) { return (int)($i->item_id ?? $i->id ?? 0); }, $cartItems);
                    $intersect = array_intersect($required, $itemIdsInCart);
                    if ($cond->operator === 'IN' && empty($intersect)) return false;
                    break;
                case 'BankCard':
                    if (!$bankId || (int)$cond->requirement_value !== (int)$bankId) return false;
                    break;
                case 'CardCategory':
                    if ($cond->requirement_value !== 'Any' && $cardCategory !== $cond->requirement_value) return false;
                    break;
                // More conditions can be added here
            }
        }
        return true;
    }

    private function calculateBenefitValue($promo, $cartItems, $subtotal) {
        $totalDiscount = 0.0;
        $breakdown = [];
        
        foreach ($promo->benefits as $benefit) {
            switch ($benefit->benefit_type) {
                case 'Percentage':
                    $totalDiscount += $subtotal * ((float)$benefit->benefit_value / 100);
                    break;
                case 'FixedAmount':
                    $totalDiscount += (float)$benefit->benefit_value;
                    break;
                case 'FixedPrice':
                    $diff = $subtotal - (float)$benefit->benefit_value;
                    if ($diff > 0) $totalDiscount += $diff;
                    break;
                case 'BuyXGetY':
                    // Complex bundle logic
                    $triggerItems = json_decode($benefit->trigger_items ?? '[]', true) ?: [];
                    $rewardItems = json_decode($benefit->reward_items ?? '[]', true) ?: [];
                    $xCount = (int)($benefit->trigger_qty ?? 1);
                    $yCount = (int)($benefit->reward_qty ?? 1);
                    $discountPct = (float)($benefit->benefit_discount_pct ?? 100);

                    // 1. Get all eligible items in cart for trigger
                    $cartTriggerMatches = array_filter($cartItems, function($i) use ($triggerItems) {
                        $itemId = (int)($i->item_id ?? $i->id ?? 0);
                        return empty($triggerItems) || in_array($itemId, $triggerItems);
                    });
                    $totalTriggerQty = array_reduce($cartTriggerMatches, function($acc, $i) { return $acc + $i->quantity; }, 0);

                    // 2. Identify reward targets (can be the same as triggers)
                    $cartRewardMatches = array_filter($cartItems, function($i) use ($rewardItems) {
                        $itemId = (int)($i->item_id ?? $i->id ?? 0);
                        return empty($rewardItems) || in_array($itemId, $rewardItems);
                    });

                    // 3. How many cycles do we have?
                    // To match the frontend's discount behavior, cycles are based solely on the trigger quantity.
                    $cycles = floor($totalTriggerQty / $xCount);
                    
                    if ($cycles <= 0) break;

                    // 4. Create flat list of reward candidates in cart and sort by price (cheapest first)
                    // Each entry: { id, unit_price }
                    $rewardPool = [];
                    foreach ($cartRewardMatches as $item) {
                        $itemId = (int)($item->item_id ?? $item->id ?? 0);
                        $itemPrice = (float)$item->unit_price;
                        if ($itemPrice == 0) {
                            $this->db->query("SELECT price FROM parts WHERE id = :id");
                            $this->db->bind(':id', $itemId);
                            $r = $this->db->single();
                            if ($r) $itemPrice = (float)$r->price;
                        }
                        for ($i = 0; $i < $item->quantity; $i++) {
                            $rewardPool[] = (object)['id' => $itemId, 'price' => $itemPrice];
                        }
                    }
                    usort($rewardPool, function($a, $b) { return $a->price <=> $b->price; });

                    // 5. Apply discount for up to $cycles * $yCount items
                    $toDiscountCount = min(count($rewardPool), $cycles * $yCount);
                    for ($i = 0; $i < $toDiscountCount; $i++) {
                        $itemDiscount = $rewardPool[$i]->price * ($discountPct / 100);
                        $totalDiscount += $itemDiscount;
                        
                        // Add to breakdown
                        $itemId = $rewardPool[$i]->id;
                        if (!isset($breakdown[$itemId])) $breakdown[$itemId] = 0;
                        $breakdown[$itemId] += $itemDiscount;
                    }

                    // 6. If we have cycles but missing rewards, calculate potential discount
                    $missingQty = ($cycles * $yCount) - $toDiscountCount;
                    if ($missingQty > 0 && !empty($rewardItems)) {
                        $firstRewardId = (int)$rewardItems[0];
                        $this->db->query("SELECT price, part_name FROM parts WHERE id = :id");
                        $this->db->bind(':id', $firstRewardId);
                        $rItem = $this->db->single();
                        if ($rItem) {
                            $missingRewards = [
                                'item_id' => $firstRewardId,
                                'item_name' => $rItem->part_name,
                                'qty' => $missingQty,
                                'potential_discount' => round(($rItem->price * ($discountPct / 100)) * $missingQty, 2)
                            ];
                        }
                    }
                    break;
            }
        }

        $result = [
            'promotion_id' => $promo->id,
            'name' => $promo->name,
            'type' => $promo->type,
            'discount_value' => round($totalDiscount, 2),
            'item_breakdown' => $breakdown
        ];

        if (isset($missingRewards)) {
            $result['missing_rewards'] = $missingRewards;
        }

        return (object)$result;
    }

    public function getPromotion($id) {
        $this->db->query("SELECT * FROM {$this->table} WHERE id = :id");
        $this->db->bind(':id', $id);
        $promo = $this->db->single();
        if ($promo) {
            $promo->conditions = $this->getConditions($promo->id);
            $promo->benefits = $this->getBenefits($promo->id);
        }
        return $promo;
    }

    public function savePromotion($data) {
        $id = $data['id'] ?? null;
        try {
            $this->db->beginTransaction();

            if ($id) {
                // Update basic info
                $this->db->query("UPDATE promotions SET name = :name, description = :description, type = :type, start_date = :start_date, end_date = :end_date, is_active = :is_active, priority = :priority, applicable_locations = :locations WHERE id = :id");
                $this->db->bind(':id', $id);
            } else {
                // Create basic info
                $this->db->query("INSERT INTO promotions (name, description, type, start_date, end_date, is_active, priority, applicable_locations) VALUES (:name, :description, :type, :start_date, :end_date, :is_active, :priority, :locations)");
            }

            $this->db->bind(':name', $data['name']);
            $this->db->bind(':description', $data['description'] ?? '');
            $this->db->bind(':type', $data['type']);
            $this->db->bind(':start_date', $data['start_date'] ?: null);
            $this->db->bind(':end_date', $data['end_date'] ?: null);
            $this->db->bind(':is_active', (int)($data['is_active'] ?? 1));
            $this->db->bind(':priority', (int)($data['priority'] ?? 0));
            $this->db->bind(':locations', isset($data['applicable_locations']) ? (is_array($data['applicable_locations']) ? json_encode($data['applicable_locations']) : $data['applicable_locations']) : null);
            $this->db->execute();

            if (!$id) $id = $this->db->lastInsertId();

            // Handle Conditions (Delete all then Re-insert)
            $this->db->query("DELETE FROM promotion_conditions WHERE promotion_id = :pid");
            $this->db->bind(':pid', $id);
            $this->db->execute();

            if (!empty($data['conditions'])) {
                foreach ($data['conditions'] as $cond) {
                    $this->db->query("INSERT INTO promotion_conditions (promotion_id, condition_type, requirement_value, operator) VALUES (:pid, :type, :val, :op)");
                    $this->db->bind(':pid', $id);
                    $this->db->bind(':type', $cond['condition_type']);
                    $this->db->bind(':val', is_array($cond['requirement_value']) ? json_encode($cond['requirement_value']) : $cond['requirement_value']);
                    $this->db->bind(':op', $cond['operator'] ?? '=');
                    $this->db->execute();
                }
            }

            // Handle Benefits (Delete all then Re-insert)
            $this->db->query("DELETE FROM promotion_benefits WHERE promotion_id = :pid");
            $this->db->bind(':pid', $id);
            $this->db->execute();

            if (!empty($data['benefits'])) {
                foreach ($data['benefits'] as $benefit) {
                    $this->db->query("INSERT INTO promotion_benefits (promotion_id, benefit_type, benefit_value, trigger_items, reward_items, trigger_qty, reward_qty, benefit_discount_pct) VALUES (:pid, :type, :val, :ti, :ri, :tq, :rq, :dp)");
                    $this->db->bind(':pid', $id);
                    $this->db->bind(':type', $benefit['benefit_type']);
                    $this->db->bind(':val', $benefit['benefit_value'] ?? 0);
                    $this->db->bind(':ti', $benefit['trigger_items'] ?? null);
                    $this->db->bind(':ri', $benefit['reward_items'] ?? null);
                    $this->db->bind(':tq', (int)($benefit['trigger_qty'] ?? 1));
                    $this->db->bind(':rq', (int)($benefit['reward_qty'] ?? 1));
                    $this->db->bind(':dp', (float)($benefit['benefit_discount_pct'] ?? 100));
                    $this->db->execute();
                }
            }

            $this->db->commit();
            return $id;
        } catch (Exception $e) {
            if ($this->db) $this->db->rollBack();
            throw $e;
        }
    }

    public function toggleActive($id, $status) {
        $this->db->query("UPDATE promotions SET is_active = :status WHERE id = :id");
        $this->db->bind(':id', $id);
        $this->db->bind(':status', (int)$status);
        return $this->db->execute();
    }

    public function deletePromotion($id) {
        $this->db->query("DELETE FROM promotions WHERE id = :id");
        $this->db->bind(':id', $id);
        return $this->db->execute();
    }
}
