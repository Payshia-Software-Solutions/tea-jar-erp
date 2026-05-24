import 'item.dart';

class CartItem {
  final Item item;
  double quantity;
  double discount; // Fixed amount discount
  int? batchId;
  String? batchNumber;

  CartItem({
    required this.item,
    this.quantity = 1.0,
    this.discount = 0.0,
    this.batchId,
    this.batchNumber,
  });
  
  // Apply discount to the total for this cart item row.
  double get subtotal => (item.price * quantity) - discount;
}
