import 'package:flutter/material.dart';
import '../models/customer.dart';
import '../models/cart_item.dart';
import '../models/item.dart';
import '../models/tax.dart';
import '../models/service_location.dart';
import 'dart:convert';
import 'dart:async';
import '../services/printer_service.dart';
import '../services/api_service.dart';
import '../services/db_service.dart';
import '../services/promotion_service.dart';
import 'products_screen.dart';
import 'checkout_payment_screen.dart';
import 'held_bills_screen.dart';
import '../components/guest_receipt_dialog.dart';
import '../components/kot_receipt_dialog.dart';


class CartScreen extends StatefulWidget {
  final Customer customer;
  final String? orderType;
  final int? tableId;
  final int? stewardId;
  final Map<String, dynamic>? initialHeldBill;
  final CartItem? initialCartItem;
  final bool isReturnMode;

  const CartScreen({
    super.key, 
    required this.customer,
    this.orderType,
    this.tableId,
    this.stewardId,
    this.initialHeldBill,
    this.initialCartItem,
    this.isReturnMode = false,
  });

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final List<CartItem> _cart = [];
  int? _heldOrderId;
  int _heldOrdersCount = 0;
  final Map<int, double> _initialQuantities = {};
  final ApiService _apiService = ApiService();
  List<ServiceLocation> _locations = [];
  ServiceLocation? _activeLocation;
  List<Tax> _systemTaxes = [];
  
  String _billDiscountType = 'fixed';
  double _billDiscountValue = 0.0;

  List<dynamic> _cachedPromotions = [];
  Map<String, dynamic>? _appliedPromotion;
  bool _isPromotionPromptOpen = false;
  Timer? _promotionTimer;

  @override
  void initState() {
    super.initState();
    _fetchHeldOrdersCount();
    _fetchTaxesAndLocation();
    _fetchPromotions();
    
    if (widget.initialHeldBill != null) {
      _heldOrderId = widget.initialHeldBill!['id'] is int 
          ? widget.initialHeldBill!['id'] 
          : int.tryParse(widget.initialHeldBill!['id']?.toString() ?? '');
      if (widget.initialHeldBill!['items'] != null) {
        for (var it in widget.initialHeldBill!['items']) {
          final parsedItem = Item(
            id: it['item_id'] is int ? it['item_id'] : int.tryParse(it['item_id']?.toString() ?? '0') ?? 0,
            name: it['description'] ?? 'Item',
            price: double.tryParse(it['unit_price']?.toString() ?? '0') ?? 0.0,
            stockLevel: 0,
            itemType: it['item_type'] ?? 'Part',
          );
          final qty = double.tryParse(it['quantity']?.toString() ?? '1') ?? 1.0;
          _cart.add(CartItem(
            item: parsedItem,
            quantity: qty,
            discount: double.tryParse(it['discount']?.toString() ?? '0') ?? 0.0,
          ));
          _initialQuantities[parsedItem.id] = qty;
        }
      }
    }
    
    if (widget.initialCartItem != null) {
      _cart.add(widget.initialCartItem!);
    }
  }

  String _formatCurrency(dynamic amount) {
    double val = double.tryParse(amount?.toString() ?? '0') ?? 0.0;
    String str = val.toStringAsFixed(2);
    str = str.replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
    return 'LKR $str';
  }

  Future<void> _fetchHeldOrdersCount() async {
    final location = await _apiService.getActiveLocation();
    if (location != null) {
      final locId = location['id'] as int;
      final orders = await _apiService.fetchHeldOrders(locId);
      if (mounted) {
        setState(() {
          _heldOrdersCount = orders.length;
        });
      }
    }
  }

  Future<void> _fetchTaxesAndLocation() async {
    final taxes = await _apiService.fetchTaxes();
    final locations = await _apiService.fetchLocations();
    final activeLocJson = await _apiService.getActiveLocation();
    ServiceLocation? activeLoc;
    
    if (activeLocJson != null) {
      final locId = activeLocJson['id'];
      try {
        activeLoc = locations.firstWhere((l) => l.id == locId);
      } catch (e) {
        if (locations.isNotEmpty) activeLoc = locations.first;
      }
    } else if (locations.isNotEmpty) {
      activeLoc = locations.first;
    }

    if (mounted) {
      setState(() {
        _systemTaxes = taxes;
        _activeLocation = activeLoc;
      });
      _triggerPromotionValidation();
    }
  }

  Future<void> _fetchPromotions() async {
    _cachedPromotions = await _apiService.fetchPromotions();
    _triggerPromotionValidation();
  }

  void _triggerPromotionValidation() {
    for (var item in _cart) {
      item.promoDiscount = 0.0;
    }
    
    _promotionTimer?.cancel();
    _promotionTimer = Timer(const Duration(milliseconds: 600), () {
      _validatePromotions();
    });
  }

  void _validatePromotions() {
    final regularItems = _cart.where((i) => !i.isReward).toList();
    if (regularItems.isEmpty) {
      if (mounted) setState(() { _appliedPromotion = null; });
      return;
    }

    double subtotal = 0;
    for (var item in regularItems) {
      subtotal += item.subtotal;
    }

    final matches = PromotionService().validatePromotionsLocal(
      cachedPromotions: _cachedPromotions,
      cartItems: regularItems,
      subtotal: subtotal,
      locationId: _activeLocation?.id,
    );

    if (matches.isNotEmpty) {
      final bestMatch = matches.first;

      if (_appliedPromotion != null && _appliedPromotion!['promotion_id'] != bestMatch['promotion_id']) {
        _removePromotionRewards();
        _appliedPromotion = null;
      }

      if (_appliedPromotion == null && !_isPromotionPromptOpen && bestMatch.containsKey('missing_rewards')) {
        _promptMissingReward(bestMatch);
      } else if (_appliedPromotion == null && (bestMatch['discount_value'] as double) > 0 && !bestMatch.containsKey('missing_rewards')) {
         setState(() {
           _appliedPromotion = bestMatch;
         });
      }
    } else {
       if (_appliedPromotion != null) {
          _removePromotionRewards();
          setState(() { _appliedPromotion = null; });
       }
    }
  }

  void _removePromotionRewards() {
     _cart.removeWhere((i) => i.isReward);
  }

  void _promptMissingReward(Map<String, dynamic> promo) {
     setState(() { _isPromotionPromptOpen = true; });
     final missing = promo['missing_rewards'];
     showDialog(
       context: context,
       barrierDismissible: false,
       builder: (ctx) => AlertDialog(
         title: const Text('Promotion Available!'),
         content: Text('Customer qualifies for a reward (Qty: ${missing['qty']}). How would you like to apply it?'),
         actions: [
           TextButton(
             onPressed: () {
               setState(() { _isPromotionPromptOpen = false; });
               Navigator.pop(ctx);
             },
             child: const Text('Dismiss', style: TextStyle(color: Colors.grey))
           ),
           TextButton(
             onPressed: () async {
                Navigator.pop(ctx);
                await _applyMissingRewardAsDiscount(promo);
             },
             child: const Text('Apply as Discount', style: TextStyle(color: Colors.orange))
           ),
           ElevatedButton(
             onPressed: () async {
                Navigator.pop(ctx);
                await _applyMissingReward(promo);
             },
             style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent),
             child: const Text('Add Reward Item', style: TextStyle(color: Colors.white))
           ),
         ]
       )
     );
  }

  Future<void> _applyMissingRewardAsDiscount(Map<String, dynamic> promo) async {
     final missing = promo['missing_rewards'];
     final itemId = missing['item_id'];
     final qty = missing['qty'] as int;
     final pct = (missing['potential_discount_pct'] as num).toDouble();

     final cachedProducts = await DbService().getCachedProducts();
     final productJson = cachedProducts.firstWhere((p) => p['id']?.toString() == itemId?.toString(), orElse: () => null);
     
     if (productJson != null) {
        final itemPrice = double.tryParse(productJson['price']?.toString() ?? '0') ?? 0.0;
        final totalRewardValue = itemPrice * qty * (pct / 100);

        final benefits = promo['benefits'] as List<dynamic>? ?? [];
        List<int> tIds = [];
        for (var b in benefits) {
          if (b['trigger_items'] != null) {
             try {
               tIds.addAll((jsonDecode(b['trigger_items'].toString()) as List).map((e) => int.parse(e.toString())));
             } catch (_) {}
          }
        }
        
        List<CartItem> triggerItemsInCart = _cart.where((c) => !c.isReward && (tIds.isEmpty || tIds.contains(c.item.id))).toList();
        if (triggerItemsInCart.isEmpty) triggerItemsInCart = _cart.where((c) => !c.isReward).toList();

        double totalTrigQty = triggerItemsInCart.fold(0.0, (sum, c) => sum + c.quantity);
        if (totalTrigQty > 0) {
           double discountPerUnit = totalRewardValue / totalTrigQty;
           setState(() {
              for (var c in triggerItemsInCart) {
                 c.promoDiscount += (discountPerUnit * c.quantity); 
              }
              _appliedPromotion = promo;
              _isPromotionPromptOpen = false;
           });
        }
     }
  }

  Future<void> _applyMissingReward(Map<String, dynamic> promo) async {
     final missing = promo['missing_rewards'];
     final itemId = missing['item_id'];
     final qty = missing['qty'] as int;
     final pct = (missing['potential_discount_pct'] as num).toDouble();

     final cachedProducts = await DbService().getCachedProducts();
     final productJson = cachedProducts.firstWhere((p) => p['id']?.toString() == itemId?.toString(), orElse: () => null);
     
     if (productJson != null) {
        final item = Item.fromJson(productJson);
        setState(() {
           _cart.add(CartItem(
              item: item,
              quantity: qty.toDouble(),
              discount: item.price * (pct / 100),
              isReward: true,
           ));
           _appliedPromotion = promo;
           _isPromotionPromptOpen = false;
        });
        _triggerPromotionValidation();
     }
  }

  Map<String, dynamic> _calculateTotals() {
    double subtotal = 0;
    for (var cartItem in _cart) {
      subtotal += cartItem.subtotal;
    }

    double promoDiscountAmt = _appliedPromotion != null ? (_appliedPromotion!['discount_value'] as num).toDouble() : 0.0;
    double rewardLineDiscounts = 0;
    for (var c in _cart) {
      if (c.isReward) {
        rewardLineDiscounts += c.discount * c.quantity;
      }
    }
    promoDiscountAmt -= rewardLineDiscounts;
    if (promoDiscountAmt < 0) promoDiscountAmt = 0;

    double billDiscountAmt = promoDiscountAmt;
    if (_billDiscountValue > 0) {
      if (_billDiscountType == 'percentage') {
        billDiscountAmt = subtotal * (_billDiscountValue / 100);
      } else {
        billDiscountAmt = _billDiscountValue;
      }
    }

    double taxableAmount = subtotal - billDiscountAmt;
    if (taxableAmount < 0) taxableAmount = 0;
    double currentBase = taxableAmount;
    double taxSum = 0;
    List<Map<String, dynamic>> appliedTaxes = [];

    List<Tax> applicableTaxes = [];
    if (_activeLocation != null && _activeLocation!.allowedTaxesJson != null) {
      try {
        List<dynamic> decodedIds = jsonDecode(_activeLocation!.allowedTaxesJson!);
        List<int> allowedIds = decodedIds.map((e) => int.tryParse(e.toString()) ?? -1).toList();
        applicableTaxes = _systemTaxes.where((t) => t.isActive && allowedIds.contains(t.id)).toList();
      } catch (e) {
        applicableTaxes = [];
      }
    }

    applicableTaxes.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
    for (var tax in applicableTaxes) {
      double applyTo = tax.applyOn == 'base_plus_previous' ? currentBase : taxableAmount;
      double taxAmt = applyTo * (tax.ratePercent / 100);
      taxSum += taxAmt;
      appliedTaxes.add({
        'name': tax.name,
        'code': tax.code,
        'rate_percent': tax.ratePercent,
        'amount': taxAmt,
      });
      currentBase += taxAmt;
    }

    double serviceChargeAmt = 0;
    if ((widget.orderType?.toLowerCase() == 'dine in' || widget.orderType?.toLowerCase() == 'dine_in') && 
        _activeLocation != null && 
        _activeLocation!.allowServiceCharge) {
      if (_activeLocation!.serviceChargeRate > 0) {
        serviceChargeAmt = taxableAmount * (_activeLocation!.serviceChargeRate / 100);
        appliedTaxes.add({
          'name': 'Service Charge',
          'code': 'SC',
          'rate_percent': _activeLocation!.serviceChargeRate,
          'amount': serviceChargeAmt,
          'is_sc': true,
        });
        taxSum += serviceChargeAmt;
      }
    }

    double grandTotal = taxableAmount + taxSum;

    return {
      'subtotal': subtotal,
      'discount_total': billDiscountAmt,
      'discount_type': _billDiscountType,
      'discount_value': _billDiscountValue,
      'promo_discount': promoDiscountAmt,
      'tax_total': taxSum,
      'grand_total': grandTotal,
      'applied_taxes': appliedTaxes,
    };
  }

  void _holdAndPrintOrder() async {
    if (_cart.isEmpty) return;

    final location = await _apiService.getActiveLocation();
    final locId = location != null ? location['id'] as int : 1;

    final totals = _calculateTotals();

    final payload = {
      'id': _heldOrderId,
      'location_id': locId,
      'customer_id': widget.customer.id,
      'order_type': widget.orderType ?? 'Retail',
      'table_id': widget.tableId,
      'steward_id': widget.stewardId,
      'subtotal': totals['subtotal'],
      'tax_total': totals['tax_total'],
      'applied_taxes': totals['applied_taxes'],
      'discount_total': totals['promo_discount'],
      'grand_total': totals['grand_total'],
      'applied_promotion_id': _appliedPromotion != null ? int.tryParse(_appliedPromotion!['promotion_id']?.toString() ?? '') : null,
      'applied_promotion_name': _appliedPromotion != null ? _appliedPromotion!['name'] : null,
      'notes': '',
      'items': _cart.map((c) => {
        'item_id': c.item.id,
        'description': c.item.name,
        'item_type': c.item.itemType ?? 'Part',
        'quantity': c.quantity,
        'unit_price': c.item.price,
        'discount': c.discount,
        'is_reward': c.isReward ? 1 : 0,
        'line_total': c.subtotal,
      }).toList(),
    };

    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
    final res = await _apiService.holdOrder(payload);
    if (!mounted) return;
    Navigator.pop(context); // close dialog

    if (res['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order Held & KOT Printed!')));
      
      final fullOrderData = {
        'id': 'KOT-${res['id'] ?? payload['id'] ?? '1'}',
        'customer': widget.customer.name,
        'total': (totals['grand_total'] as double).toStringAsFixed(2),
        'paymentMethod': 'Hold (Unpaid)',
        'amountTendered': 0.0,
        'grandTotal': totals['grand_total'],
        'applied_taxes': totals['applied_taxes'],
        'tax_total': totals['tax_total'],
        'items': _cart.map((c) => {
          'name': c.item.name,
          'price': c.item.price,
          'quantity': c.quantity,
          'discount': c.discount,
          'subtotal': c.subtotal,
        }).toList(),
      };

      if (widget.initialHeldBill != null) {
        List<Map<String, dynamic>> newItems = [];
        for (var c in _cart) {
          final initialQty = _initialQuantities[c.item.id] ?? 0.0;
          final delta = c.quantity - initialQty;
          if (delta > 0) {
            newItems.add({
              'name': c.item.name,
              'price': c.item.price,
              'quantity': delta,
              'discount': c.discount,
              'subtotal': c.item.price * delta,
            });
          }
        }
        
        if (newItems.isNotEmpty) {
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Print KOT Options'),
              content: const Text('Do you want to print the Full KOT or only the newly added items?'),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _showKOTDialog(fullOrderData);
                  }, 
                  child: const Text('Full KOT')
                ),
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                    final newOrderData = {...fullOrderData, 'items': newItems};
                    _showKOTDialog(newOrderData);
                  }, 
                  child: const Text('New Items Only')
                ),
              ]
            )
          );
        } else {
          _showKOTDialog(fullOrderData);
        }
      } else {
        _showKOTDialog(fullOrderData);
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'])));
    }
  }

  void _showKOTDialog(Map<String, dynamic> orderData) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => KOTReceiptDialog(orderData: orderData),
    ).then((_) {
      Navigator.pop(context); // go back to dashboard after dialog is closed
    });
  }

  void _showGuestReceiptDialog(Map<String, dynamic> orderData) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => GuestReceiptDialog(orderData: orderData),
    );
  }

  double get _cartTotal {
    return _calculateTotals()['grand_total'] as double;
  }

  void _checkout() async {
    if (_cart.isEmpty) return;

    final totals = _calculateTotals();
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CheckoutPaymentScreen(
          customer: widget.customer,
          cart: _cart,
          grandTotal: totals['grand_total'],
          subtotal: totals['subtotal'],
          taxTotal: totals['tax_total'],
          appliedTaxes: totals['applied_taxes'],
          discountTotal: totals['discount_total'] ?? 0.0,
          discountType: totals['discount_type'] ?? 'fixed',
          discountValue: totals['discount_value'] ?? 0.0,
          appliedPromotionId: _appliedPromotion != null ? int.tryParse(_appliedPromotion!['promotion_id']?.toString() ?? '') : null,
          appliedPromotionName: _appliedPromotion != null ? _appliedPromotion!['name'] : null,
          orderType: widget.orderType,
          tableId: widget.tableId,
          stewardId: widget.stewardId,
          heldOrderId: _heldOrderId,
          isReturnMode: widget.isReturnMode,
        ),
      ),
    );

    if (result == true) {
      // Checkout successful, clear cart and return to dashboard
      setState(() {
        _cart.clear();
      });
      if (mounted) Navigator.pop(context);
    }
  }

  String _formatQty(double qty) {
    if (qty == qty.toInt().toDouble()) {
      return qty.toInt().toString();
    }
    return qty.toString();
  }

  Widget _buildProductImage(String? imageUrl) {
    if (imageUrl != null && imageUrl.isNotEmpty) {
      return Image.network(
        imageUrl,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _buildPlaceholderImage(),
      );
    }
    return _buildPlaceholderImage();
  }

  Widget _buildPlaceholderImage() {
    return Container(
      color: Colors.blueAccent.withOpacity(0.05),
      child: const Center(
        child: Icon(Icons.image_not_supported, color: Colors.blueAccent, size: 24),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.isReturnMode ? 'Process Return' : 'Shopping Cart', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Row(
              children: [
                const Icon(Icons.person, size: 12, color: Colors.blueAccent),
                const SizedBox(width: 4),
                Text(widget.customer.name, style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7), fontSize: 12)),
              ],
            ),
          ],
        ),
        elevation: 0,
        actions: [
          TextButton.icon(
            onPressed: () async {
              final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => const HeldBillsScreen()));
              if (result != null && result is Map<String, dynamic>) {
                final action = result['action'];
                final billData = result['data'] as Map<String, dynamic>;

                if (action == 'reprint') {
                  final orderData = {
                    'id': 'KOT-${billData['id']}',
                    'customer': billData['customer_name'] ?? 'Walk-in Customer',
                    'total': billData['grand_total']?.toString() ?? '0.00',
                    'paymentMethod': 'Hold (Unpaid)',
                    'amountTendered': 0.0,
                    'grandTotal': double.tryParse(billData['grand_total']?.toString() ?? '0') ?? 0.0,
                    'items': (billData['items'] as List<dynamic>?)?.map((it) => {
                      'name': it['description'] ?? 'Item',
                      'price': double.tryParse(it['unit_price']?.toString() ?? '0') ?? 0.0,
                      'quantity': double.tryParse(it['quantity']?.toString() ?? '1') ?? 1.0,
                      'discount': double.tryParse(it['discount']?.toString() ?? '0') ?? 0.0,
                      'subtotal': double.tryParse(it['line_total']?.toString() ?? '0') ?? 0.0,
                    }).toList() ?? [],
                  };
                  _showKOTDialog(orderData);
                } else if (action == 'guest_receipt') {
                  final orderData = {
                    'id': 'BILL-${billData['id']}',
                    'customer': billData['customer_name'] ?? 'Walk-in Customer',
                    'total': billData['grand_total']?.toString() ?? '0.00',
                    'paymentMethod': 'Hold (Unpaid)',
                    'amountTendered': 0.0,
                    'grandTotal': double.tryParse(billData['grand_total']?.toString() ?? '0') ?? 0.0,
                    'items': (billData['items'] as List<dynamic>?)?.map((it) => {
                      'name': it['description'] ?? 'Item',
                      'price': double.tryParse(it['unit_price']?.toString() ?? '0') ?? 0.0,
                      'quantity': double.tryParse(it['quantity']?.toString() ?? '1') ?? 1.0,
                      'discount': double.tryParse(it['discount']?.toString() ?? '0') ?? 0.0,
                      'subtotal': double.tryParse(it['line_total']?.toString() ?? '0') ?? 0.0,
                    }).toList() ?? [],
                  };
                  _showGuestReceiptDialog(orderData);
                } else if (action == 'continue') {
                  // Populate cart with the held bill
                  setState(() {
                    _cart.clear();
                    _heldOrderId = billData['id'];
                    // items mapping:
                    if (billData['items'] != null) {
                      for (var it in billData['items']) {
                        final parsedItem = Item(
                          id: it['item_id'] is int ? it['item_id'] : int.tryParse(it['item_id']?.toString() ?? '0') ?? 0,
                          name: it['description'] ?? 'Item',
                          price: double.tryParse(it['unit_price']?.toString() ?? '0') ?? 0.0,
                          stockLevel: 0, // Not needed for cart view
                          itemType: it['item_type'] ?? 'Part',
                        );
                        _cart.add(CartItem(
                          item: parsedItem,
                          quantity: double.tryParse(it['quantity']?.toString() ?? '1') ?? 1.0,
                          discount: double.tryParse(it['discount']?.toString() ?? '0') ?? 0.0,
                        ));
                      }
                    }
                  });
                }
              }
              _fetchHeldOrdersCount();
            },
            style: TextButton.styleFrom(
              backgroundColor: Colors.orange.withOpacity(0.1),
              foregroundColor: Colors.deepOrange,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            ),
            icon: const Icon(Icons.access_time_filled, size: 20),
            label: Text('HELD ($_heldOrdersCount)', style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _cart.isEmpty 
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.shopping_cart_outlined, size: 80, color: Theme.of(context).dividerColor.withOpacity(0.2)),
                      const SizedBox(height: 16),
                      Text('Your cart is empty', style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.5), fontSize: 18)),
                    ],
                  )
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _cart.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final cartItem = _cart[index];
                    
                    return Dismissible(
                      key: Key('${cartItem.item.id}_$index'),
                      direction: DismissDirection.endToStart,
                      onDismissed: (direction) {
                        setState(() {
                          _cart.removeAt(index);
                        });
                        _triggerPromotionValidation();
                      },
                      background: Container(
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 20),
                        decoration: BoxDecoration(
                          color: Colors.redAccent,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(Icons.delete, color: Colors.white),
                      ),
                      child: Container(
                        clipBehavior: Clip.hardEdge,
                        decoration: BoxDecoration(
                          color: Theme.of(context).cardColor,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.1)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.03),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            )
                          ]
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 80,
                              height: 80,
                              child: _buildProductImage(cartItem.item.imageUrl),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      cartItem.item.name, 
                                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Theme.of(context).textTheme.bodyLarge?.color),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    if (cartItem.batchNumber != null)
                                      Text(
                                        'Batch: ${cartItem.batchNumber}',
                                        style: TextStyle(fontSize: 12, color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.5)),
                                      ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${_formatCurrency(cartItem.item.price)} x ${_formatQty(cartItem.quantity)}',
                                      style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7), fontSize: 13)
                                    ),
                                    if ((cartItem.discount + cartItem.promoDiscount) > 0)
                                      Text(
                                        'Discount: -${_formatCurrency(cartItem.discount + cartItem.promoDiscount)}',
                                        style: const TextStyle(color: Colors.redAccent, fontSize: 12)
                                      ),
                                  ],
                                ),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.only(right: 16.0),
                              child: Text(
                                _formatCurrency(cartItem.subtotal), 
                                style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
          ),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(32), topRight: Radius.circular(32)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 20,
                  offset: const Offset(0, -5),
                )
              ]
            ),
            child: SafeArea(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  OutlinedButton.icon(
                    onPressed: () async {
                      final result = await Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const ProductsScreen(isPicker: true)),
                      );

                      if (result != null && result is CartItem) {
                        setState(() {
                          _cart.add(result);
                        });
                        _triggerPromotionValidation();
                      }
                    },
                    icon: const Icon(Icons.add, color: Colors.blueAccent),
                    label: const Text('ADD MORE ITEMS', style: TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold, letterSpacing: 1)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: BorderSide(color: Colors.blueAccent.withOpacity(0.5), width: 2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      backgroundColor: Colors.blueAccent.withOpacity(0.05),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Builder(
                    builder: (context) {
                      final totals = _calculateTotals();
                      final subtotal = totals['subtotal'] as double;
                      final grandTotal = totals['grand_total'] as double;
                      final appliedTaxes = totals['applied_taxes'] as List<dynamic>;

                      final discountTotal = totals['discount_total'] as double;
                      final discountType = totals['discount_type'] as String;

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Subtotal :', style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6), fontSize: 16)),
                              Text(_formatCurrency(subtotal), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          if (_appliedPromotion != null)
                             Row(
                               mainAxisAlignment: MainAxisAlignment.spaceBetween,
                               children: [
                                 Text(
                                   'Promo: ${_appliedPromotion!['name']} :',
                                   style: const TextStyle(color: Colors.green, fontSize: 15, fontWeight: FontWeight.bold),
                                 ),
                                 Text('-${_formatCurrency(totals['promo_discount'])}', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 15)),
                               ],
                             ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              InkWell(
                                onTap: _showBillDiscountDialog,
                                child: Text(
                                  discountTotal > 0 ? 'Discount ($discountType) :' : '+ Add Bill Discount',
                                  style: const TextStyle(color: Colors.orange, fontSize: 15, fontWeight: FontWeight.bold),
                                ),
                              ),
                              if (discountTotal > 0)
                                Text('-${_formatCurrency(discountTotal)}', style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 15)),
                            ],
                          ),
                          if (appliedTaxes.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 12,
                              runSpacing: 4,
                              children: appliedTaxes.map((tax) {
                                return Text(
                                  '${tax['code'] ?? tax['name']}: ${_formatCurrency(tax['amount'])}',
                                  style: const TextStyle(color: Colors.blueAccent, fontSize: 13, fontWeight: FontWeight.bold),
                                );
                              }).toList(),
                            ),
                          ],
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('TOTAL', style: TextStyle(color: Colors.black87, fontSize: 16, fontWeight: FontWeight.bold)),
                              Text(_formatCurrency(grandTotal), style: const TextStyle(color: Colors.teal, fontSize: 32, fontWeight: FontWeight.w900)),
                            ],
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      if (!widget.isReturnMode)
                        Expanded(
                          flex: 1,
                          child: OutlinedButton(
                            onPressed: _cart.isEmpty ? null : _holdAndPrintOrder,
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 18),
                              side: const BorderSide(color: Colors.orange, width: 2),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              backgroundColor: Colors.orange.withOpacity(0.05),
                              foregroundColor: Colors.orange,
                            ),
                            child: const Text('HOLD & PRINT ORDER', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      if (!widget.isReturnMode) const SizedBox(width: 12),
                      Expanded(
                        flex: 1,
                        child: ElevatedButton(
                          onPressed: _cart.isEmpty ? null : _checkout,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 18),
                            backgroundColor: widget.isReturnMode ? Colors.redAccent : Colors.blueAccent,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            elevation: 4,
                          ),
                          child: Text(widget.isReturnMode ? 'PROCEED TO REFUND' : 'CHECKOUT', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  void _showBillDiscountDialog() {
    String tempType = _billDiscountType;
    String tempVal = _billDiscountValue == 0 ? '' : _billDiscountValue.toString();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: const Text('Add Bill Discount'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  value: tempType,
                  items: const [
                    DropdownMenuItem(value: 'fixed', child: Text('Fixed Amount')),
                    DropdownMenuItem(value: 'percentage', child: Text('Percentage (%)')),
                  ],
                  onChanged: (val) {
                    if (val != null) setDialogState(() => tempType = val);
                  },
                  decoration: const InputDecoration(labelText: 'Discount Type'),
                ),
                const SizedBox(height: 16),
                TextField(
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Discount Value', prefixIcon: Icon(Icons.money_off)),
                  onChanged: (val) => tempVal = val,
                  controller: TextEditingController(text: tempVal)..selection = TextSelection.collapsed(offset: tempVal.length),
                ),
              ],
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
              TextButton(
                onPressed: () {
                  setState(() {
                    _billDiscountType = tempType;
                    _billDiscountValue = double.tryParse(tempVal) ?? 0.0;
                  });
                  Navigator.pop(ctx);
                },
                child: const Text('Apply'),
              ),
            ],
          );
        }
      )
    );
  }
}


