import 'item.dart';

class CartItem {
  final Item item;
  double quantity;
  double discount; // Fixed amount discount (Manual)
  double promoDiscount; // Discount applied by Promotion Engine
  int? batchId;
  String? batchNumber;
  bool isReward;

  CartItem({
    required this.item,
    this.quantity = 1.0,
    this.discount = 0.0,
    this.promoDiscount = 0.0,
    this.batchId,
    this.batchNumber,
    this.isReward = false,
  });
  
  // Apply discount to the total for this cart item row.
  double get subtotal => (item.price * quantity) - discount - promoDiscount;
}
