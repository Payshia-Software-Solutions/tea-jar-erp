import 'dart:convert';
import 'package:collection/collection.dart';
import '../models/cart_item.dart';
import '../models/item.dart';

class PromotionService {
  List<Map<String, dynamic>> validatePromotionsLocal({
    required List<dynamic> cachedPromotions,
    required List<CartItem> cartItems,
    required double subtotal,
    int? locationId,
    int? bankId,
    String? cardCategory,
  }) {
    List<Map<String, dynamic>> matches = [];

    // Filter active promotions
    final now = DateTime.now();
    final activePromotions = cachedPromotions.where((promo) {
      if (promo['is_active']?.toString() != '1') return false;
      
      // Date checks
      if (promo['start_date'] != null) {
        final start = DateTime.tryParse(promo['start_date'].toString());
        if (start != null && now.isBefore(start)) return false;
      }
      if (promo['end_date'] != null) {
        final end = DateTime.tryParse(promo['end_date'].toString());
        if (end != null && now.isAfter(end.add(const Duration(days: 1)))) return false;
      }
      
      // Location check
      if (locationId != null && promo['applicable_locations'] != null) {
        try {
          final locs = jsonDecode(promo['applicable_locations'].toString()) as List;
          if (!locs.contains(locationId) && !locs.contains(locationId.toString())) {
            return false;
          }
        } catch (_) {}
      }
      return true;
    }).toList();

    for (var promo in activePromotions) {
      if (_isEligible(promo, cartItems, subtotal, bankId, cardCategory)) {
        final benefit = _calculateBenefitValue(promo, cartItems, subtotal);
        if ((benefit['discount_value'] as double) > 0 || benefit.containsKey('missing_rewards')) {
          matches.add(benefit);
        }
      }
    }

    matches.sort((a, b) => (b['discount_value'] as double).compareTo(a['discount_value'] as double));
    return matches;
  }

  bool _isEligible(Map<String, dynamic> promo, List<CartItem> cartItems, double subtotal, int? bankId, String? cardCategory) {
    final conditions = promo['conditions'] as List<dynamic>? ?? [];
    if (conditions.isEmpty) return true;

    for (var cond in conditions) {
      final type = cond['condition_type']?.toString();
      final reqVal = cond['requirement_value']?.toString() ?? '';
      
      switch (type) {
        case 'MinAmount':
          if (subtotal < (double.tryParse(reqVal) ?? 0)) return false;
          break;
        case 'MinQty':
          final totalQty = cartItems.fold(0.0, (sum, item) => sum + item.quantity);
          if (totalQty < (double.tryParse(reqVal) ?? 0)) return false;
          break;
        case 'ItemList':
          try {
            final requiredIds = jsonDecode(reqVal) as List;
            final cartItemIds = cartItems.map((c) => c.item.id).toList();
            bool hasIntersection = requiredIds.any((id) => cartItemIds.contains(int.tryParse(id.toString())));
            if (cond['operator'] == 'IN' && !hasIntersection) return false;
          } catch (_) {}
          break;
        case 'BankCard':
          if (bankId == null || int.tryParse(reqVal) != bankId) return false;
          break;
        case 'CardCategory':
          if (reqVal != 'Any' && cardCategory != reqVal) return false;
          break;
      }
    }
    return true;
  }

  Map<String, dynamic> _calculateBenefitValue(Map<String, dynamic> promo, List<CartItem> cartItems, double subtotal) {
    double totalDiscount = 0.0;
    Map<String, double> breakdown = {};
    Map<String, dynamic>? missingRewards;

    final benefits = promo['benefits'] as List<dynamic>? ?? [];
    
    for (var benefit in benefits) {
      final type = benefit['benefit_type']?.toString();
      final val = double.tryParse(benefit['benefit_value']?.toString() ?? '0') ?? 0.0;
      
      switch (type) {
        case 'Percentage':
          totalDiscount += subtotal * (val / 100);
          break;
        case 'FixedAmount':
          totalDiscount += val;
          break;
        case 'FixedPrice':
          final diff = subtotal - val;
          if (diff > 0) totalDiscount += diff;
          break;
        case 'BuyXGetY':
          List<int> triggerItems = [];
          List<int> rewardItems = [];
          try {
            if (benefit['trigger_items'] != null) triggerItems = (jsonDecode(benefit['trigger_items'].toString()) as List).map((e) => int.parse(e.toString())).toList();
            if (benefit['reward_items'] != null) rewardItems = (jsonDecode(benefit['reward_items'].toString()) as List).map((e) => int.parse(e.toString())).toList();
          } catch (_) {}
          
          final xCount = int.tryParse(benefit['trigger_qty']?.toString() ?? '1') ?? 1;
          final yCount = int.tryParse(benefit['reward_qty']?.toString() ?? '1') ?? 1;
          final discountPct = double.tryParse(benefit['benefit_discount_pct']?.toString() ?? '100') ?? 100.0;

          // 1. Get eligible trigger items in cart
          final cartTriggerMatches = cartItems.where((c) {
            return triggerItems.isEmpty || triggerItems.contains(c.item.id);
          }).toList();
          final totalTriggerQty = cartTriggerMatches.fold(0.0, (sum, c) => sum + c.quantity);

          // 2. Identify reward targets
          final cartRewardMatches = cartItems.where((c) {
            return rewardItems.isEmpty || rewardItems.contains(c.item.id);
          }).toList();

          // 3. Cycles & Missing Rewards
          bool sameItems = const ListEquality().equals(triggerItems, rewardItems);
          int cycles = 0;
          int toDiscountCount = 0;
          int missingQty = 0;

          if (sameItems) {
            int completeBundles = (totalTriggerQty / (xCount + yCount)).floor();
            int remainder = (totalTriggerQty % (xCount + yCount)).toInt();
            int extraRewardsEntitled = 0;
            int extraRewardsPresent = 0;

            if (remainder >= xCount) {
              extraRewardsEntitled = yCount;
              extraRewardsPresent = remainder - xCount;
            }

            cycles = completeBundles + (extraRewardsEntitled > 0 ? 1 : 0);
            missingQty = extraRewardsEntitled - extraRewardsPresent;
            toDiscountCount = (completeBundles * yCount) + extraRewardsPresent;
          } else {
            cycles = (totalTriggerQty / xCount).floor();
            final availableRewards = cartRewardMatches.fold(0.0, (sum, c) => sum + c.quantity).toInt();
            toDiscountCount = availableRewards < cycles * yCount ? availableRewards : cycles * yCount;
            missingQty = (cycles * yCount) - toDiscountCount;
          }
          
          if (cycles <= 0) break;

          // 4. Flat list of rewards sorted by price (cheapest first)
          List<Map<String, dynamic>> rewardPool = [];
          for (var item in cartRewardMatches) {
            for (int i = 0; i < item.quantity.toInt(); i++) {
              rewardPool.add({
                'id': item.item.id,
                'name': item.item.name,
                'price': item.item.price,
              });
            }
          }
          rewardPool.sort((a, b) => (a['price'] as double).compareTo(b['price'] as double));

          // 5. Apply discount for up to toDiscountCount items
          for (int i = 0; i < toDiscountCount && i < rewardPool.length; i++) {
            final itemDiscount = (rewardPool[i]['price'] as double) * (discountPct / 100);
            totalDiscount += itemDiscount;
            
            final itemId = rewardPool[i]['id'].toString();
            breakdown[itemId] = (breakdown[itemId] ?? 0.0) + itemDiscount;
          }

          // 6. Missing Rewards
          if (missingQty > 0 && rewardItems.isNotEmpty) {
            final firstRewardId = rewardItems[0];
            missingRewards = {
              'item_id': firstRewardId,
              'qty': missingQty,
              'potential_discount_pct': discountPct, // Used by UI to calculate local discount
            };
          }
          break;
      }
    }

    final result = {
      'promotion_id': promo['id'],
      'name': promo['name'],
      'type': promo['type'],
      'discount_value': totalDiscount,
      'item_breakdown': breakdown,
    };
    if (missingRewards != null) {
      result['missing_rewards'] = missingRewards;
    }
    return result;
  }
}
