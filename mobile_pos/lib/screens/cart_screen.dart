import 'package:flutter/material.dart';
import '../models/customer.dart';
import '../models/cart_item.dart';
import '../models/item.dart';
import '../services/printer_service.dart';
import '../services/api_service.dart';
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

  const CartScreen({
    super.key, 
    required this.customer,
    this.orderType,
    this.tableId,
    this.stewardId,
    this.initialHeldBill,
    this.initialCartItem,
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

  @override
  void initState() {
    super.initState();
    _fetchHeldOrdersCount();
    
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

  void _holdAndPrintOrder() async {
    if (_cart.isEmpty) return;

    final location = await _apiService.getActiveLocation();
    final locId = location != null ? location['id'] as int : 1;

    final payload = {
      'id': _heldOrderId, // update if it was already held
      'location_id': locId,
      'customer_id': widget.customer.id,
      'order_type': widget.orderType ?? 'Retail',
      'table_id': widget.tableId,
      'steward_id': widget.stewardId,
      'subtotal': _cartTotal,
      'tax_total': 0.0,
      'discount_total': 0.0,
      'grand_total': _cartTotal,
      'notes': '',
      'items': _cart.map((c) => {
        'item_id': c.item.id,
        'description': c.item.name,
        'item_type': c.item.itemType ?? 'Part',
        'quantity': c.quantity,
        'unit_price': c.item.price,
        'discount': c.discount,
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
        'total': _cartTotal.toStringAsFixed(2),
        'paymentMethod': 'Hold (Unpaid)',
        'amountTendered': 0.0,
        'grandTotal': _cartTotal,
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
    double total = 0;
    for (var cartItem in _cart) {
      total += cartItem.subtotal;
    }
    return total;
  }

  void _checkout() async {
    if (_cart.isEmpty) return;

    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CheckoutPaymentScreen(
          customer: widget.customer,
          cart: _cart,
          grandTotal: _cartTotal,
          orderType: widget.orderType,
          tableId: widget.tableId,
          stewardId: widget.stewardId,
          heldOrderId: _heldOrderId,
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
            const Text('Shopping Cart', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
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
                                    if (cartItem.discount > 0)
                                      Text(
                                        'Discount: -${_formatCurrency(cartItem.discount)}',
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Grand Total', style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6), fontSize: 16, fontWeight: FontWeight.w600)),
                      Text(_formatCurrency(_cartTotal), style: const TextStyle(color: Colors.blueAccent, fontSize: 32, fontWeight: FontWeight.w900)),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
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
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 1,
                        child: ElevatedButton(
                          onPressed: _cart.isEmpty ? null : _checkout,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 18),
                            backgroundColor: Colors.blueAccent,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            elevation: 4,
                          ),
                          child: const Text('CHECKOUT', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1)),
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
}


