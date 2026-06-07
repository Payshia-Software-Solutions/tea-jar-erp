import 'package:flutter/material.dart';
import 'dart:convert';
import '../models/item.dart';
import '../models/cart_item.dart';
import '../services/api_service.dart';
import '../models/customer.dart';
import 'cart_screen.dart';
import 'held_bills_screen.dart';
import '../services/printer_service.dart';
import '../services/db_service.dart';
import '../components/guest_receipt_dialog.dart';
import '../components/kot_receipt_dialog.dart';

class ProductsScreen extends StatefulWidget {
  final Customer? customer;
  final String? orderType;
  final int? tableId;
  final int? stewardId;
  final Map<String, dynamic>? initialHeldBill;
  final bool isPicker;

  const ProductsScreen({
    super.key,
    this.customer,
    this.orderType,
    this.tableId,
    this.stewardId,
    this.initialHeldBill,
    this.isPicker = false,
  });

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  final ApiService _apiService = ApiService();
  List<Item> _items = [];
  List<Item> _filteredItems = [];
  bool _isLoading = true;
  bool _isGridView = true; // State for toggle
  final TextEditingController _searchController = TextEditingController();
  int? _activeLocationId;
  String? _activeLocationName;
  int _heldOrdersCount = 0;
  
  // Cart state initialization when passed from dashboard
  Customer? _currentCustomer;
  String? _currentOrderType;
  int? _currentTableId;
  int? _currentStewardId;
  Map<String, dynamic>? _pendingInitialHeldBill;

  @override
  void initState() {
    super.initState();
    _currentCustomer = widget.customer ?? Customer(id: 1, name: 'Walk-in Customer', phone: '');
    _currentOrderType = widget.orderType ?? 'Retail';
    _currentTableId = widget.tableId;
    _currentStewardId = widget.stewardId;
    _pendingInitialHeldBill = widget.initialHeldBill;

    _loadItems();
    _searchController.addListener(_onSearchChanged);
  }
  
  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _filteredItems = _items.where((item) => item.name.toLowerCase().contains(query)).toList();
    });
  }

  Future<void> _loadItems() async {
    try {
      final location = await _apiService.getActiveLocation();
      if (location != null) {
        setState(() {
          _activeLocationId = location['id'] as int;
        });
      }
      
      final items = await _apiService.fetchProducts();
      _fetchHeldOrdersCount();
      if (mounted) {
        setState(() {
          _items = items;
          _filteredItems = items;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load products: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _fetchHeldOrdersCount() async {
    if (_activeLocationId == null) return;
    final heldOrders = await _apiService.fetchHeldOrders(_activeLocationId!);
    if (mounted) {
      setState(() {
        _heldOrdersCount = heldOrders.length;
      });
    }
  }

  void _showItemDialog(Item item) async {
    final activeLocation = await _apiService.getActiveLocation();
    final locationId = activeLocation != null ? (activeLocation['id'] as int) : 1;
    
    double qty = 1.0;
    double discount = 0.0;
    
    // Fetch batches
    List<Map<String, dynamic>> batches = [];
    bool isLoadingBatches = true;
    int? selectedBatchId;
    String? selectedBatchNumber;
    
    // Fetch promotions
    List<Map<String, dynamic>> itemPromotions = [];
    bool isLoadingPromotions = true;
    
    final TextEditingController qtyController = TextEditingController(text: '1');
    final TextEditingController discountController = TextEditingController();

    if (mounted) {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (ctx) {
          return StatefulBuilder(
            builder: (context, setSheetState) {
              if (isLoadingBatches) {
                _apiService.fetchProductBatches(item.id, locationId).then((b) {
                  if (mounted) {
                    setSheetState(() {
                      batches = b;
                      isLoadingBatches = false;
                      if (batches.isNotEmpty) {
                        selectedBatchId = null;
                        selectedBatchNumber = null;
                      }
                    });
                  }
                });
              }

              if (isLoadingPromotions) {
                 DbService().getCachedPromotions().then((promos) {
                   if (mounted) {
                     setSheetState(() {
                       itemPromotions = promos.where((p) {
                         if (p['is_active']?.toString() != '1') return false;
                         if (p['benefits'] != null) {
                            try {
                              final benefits = p['benefits'] as List;
                              for (var b in benefits) {
                                if (b['trigger_items'] != null) {
                                   final tIds = (jsonDecode(b['trigger_items'].toString()) as List).map((e) => int.parse(e.toString())).toList();
                                   if (tIds.isEmpty || tIds.contains(item.id)) return true;
                                }
                              }
                            } catch (_) {}
                         }
                         return false;
                       }).toList().cast<Map<String, dynamic>>();
                       isLoadingPromotions = false;
                     });
                   }
                 });
              }

              bool isService = item.itemType?.toLowerCase() == 'service' ||
                               item.recipeType?.toLowerCase() == 'a la carte' ||
                               item.recipeType?.toLowerCase() == 'buffet';
              bool isOutOfStock = !isService && item.stockLevel <= 0;

              return Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(24),
                    topRight: Radius.circular(24),
                  ),
                ),
                padding: EdgeInsets.only(
                  bottom: MediaQuery.of(context).viewInsets.bottom,
                ),
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.85,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(24),
                          topRight: Radius.circular(24),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isService ? Colors.purple.withOpacity(0.1) : Colors.blue.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    (item.itemType ?? 'Part').toUpperCase(),
                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isService ? Colors.purple : Colors.blueAccent),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  item.name,
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                if (item.sku != null && item.sku!.isNotEmpty)
                                  Text(
                                    item.sku!,
                                    style: const TextStyle(
                                      fontSize: 14,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close),
                            onPressed: () => Navigator.pop(ctx),
                          ),
                        ],
                      ),
                    ),
                    Flexible(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            if (isOutOfStock)
                              Container(
                                padding: const EdgeInsets.all(12),
                                margin: const EdgeInsets.only(bottom: 16),
                                decoration: BoxDecoration(
                                  color: Colors.redAccent.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 20),
                                    SizedBox(width: 8),
                                    Expanded(child: Text('This part is currently out of stock.', style: TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.bold))),
                                  ],
                                ),
                              ),
                            
                            if (!isService && isLoadingBatches)
                              const Padding(
                                padding: EdgeInsets.all(16.0),
                                child: Center(child: CircularProgressIndicator()),
                              ),
                            if (!isService && !isLoadingBatches && batches.isNotEmpty)
                              DropdownButtonFormField<int?>(
                                decoration: InputDecoration(
                                  labelText: 'Select Batch',
                                  labelStyle: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6)),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                value: selectedBatchId,
                                isExpanded: true,
                                items: [
                                  const DropdownMenuItem<int?>(
                                    value: null,
                                    child: Text('Auto Select (FIFO)'),
                                  ),
                                  ...batches.map((b) {
                                    final num = b['batch_number'] ?? 'Unknown';
                                    final expiry = b['expiry_date'] != null ? ' (Exp: ${b['expiry_date']})' : '';
                                    final stock = ' [Stock: ${b['quantity_on_hand']}]';
                                    int? parsedId = b['id'] is int ? b['id'] : int.tryParse(b['id']?.toString() ?? '');
                                    return DropdownMenuItem<int?>(
                                      value: parsedId == 0 ? 0 : parsedId,
                                      child: Text('$num$expiry$stock'),
                                    );
                                  }),
                                ],
                                onChanged: (val) {
                                  setSheetState(() {
                                    selectedBatchId = val;
                                    final batch = batches.firstWhere((b) {
                                      int? bId = b['id'] is int ? b['id'] : int.tryParse(b['id']?.toString() ?? '');
                                      return bId == val;
                                    }, orElse: () => {});
                                    selectedBatchNumber = batch['batch_number'];
                                  });
                                },
                              ),
                            const SizedBox(height: 16),
                            if (itemPromotions.isNotEmpty) ...[
                              Container(
                                padding: const EdgeInsets.all(12),
                                margin: const EdgeInsets.only(bottom: 16),
                                decoration: BoxDecoration(
                                  color: Colors.green.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.green.withOpacity(0.3)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Row(
                                      children: [
                                        Icon(Icons.local_offer, color: Colors.green, size: 20),
                                        SizedBox(width: 8),
                                        Text('Available Promotions', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    ...itemPromotions.map((p) {
                                       String? triggerQtyStr;
                                       if (p['benefits'] != null) {
                                          try {
                                            for (var b in p['benefits'] as List) {
                                              if (b['trigger_items'] != null) {
                                                 final tList = (jsonDecode(b['trigger_items'].toString()) as List).map((e) => e.toString()).toList();
                                                 if (tList.contains(item.id.toString())) {
                                                    triggerQtyStr = b['trigger_qty']?.toString();
                                                    break;
                                                 }
                                              }
                                            }
                                          } catch (_) {}
                                       }
                                       return Padding(
                                         padding: const EdgeInsets.only(top: 4.0),
                                         child: Row(
                                           mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                           children: [
                                             Expanded(child: Text('• ${p['name'] ?? ''}', style: TextStyle(color: Colors.green.shade700, fontSize: 13))),
                                             if (triggerQtyStr != null)
                                               TextButton(
                                                 onPressed: () {
                                                   setSheetState(() {
                                                     qty = double.tryParse(triggerQtyStr!) ?? 1.0;
                                                     qtyController.text = qty.toInt().toString();
                                                   });
                                                 },
                                                 style: TextButton.styleFrom(
                                                   padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                                   minimumSize: Size.zero,
                                                   tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                                   backgroundColor: Colors.green.withOpacity(0.2),
                                                 ),
                                                 child: Text('Set Qty: $triggerQtyStr', style: const TextStyle(color: Colors.green, fontSize: 12, fontWeight: FontWeight.bold)),
                                               ),
                                           ],
                                         ),
                                       );
                                    }).toList(),
                                  ],
                                ),
                              ),
                            ],
                            TextField(
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                              decoration: InputDecoration(
                                labelText: 'Quantity',
                                labelStyle: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6)),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.blueAccent, width: 2)),
                              ),
                              onChanged: (val) {
                                qty = double.tryParse(val) ?? 1.0;
                              },
                              controller: qtyController,
                            ),
                            const SizedBox(height: 16),
                            TextField(
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                              decoration: InputDecoration(
                                labelText: 'Discount Amount (Fixed)',
                                labelStyle: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6)),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.blueAccent, width: 2)),
                                prefixText: '\$ ',
                                prefixStyle: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6)),
                              ),
                              onChanged: (val) {
                                discount = double.tryParse(val) ?? 0.0;
                              },
                              controller: discountController,
                            ),
                            const SizedBox(height: 32),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.blueAccent,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              onPressed: isOutOfStock ? null : () {
                                final cartItem = CartItem(
                                  item: item, 
                                  quantity: qty, 
                                  discount: discount,
                                  batchId: selectedBatchId,
                                  batchNumber: selectedBatchNumber,
                                );
                                Navigator.pop(ctx); 
                                if (widget.isPicker) {
                                  Navigator.pop(context, cartItem); 
                                } else {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => CartScreen(
                                        customer: _currentCustomer!,
                                        orderType: _currentOrderType,
                                        tableId: _currentTableId,
                                        stewardId: _currentStewardId,
                                        initialHeldBill: _pendingInitialHeldBill,
                                        initialCartItem: cartItem,
                                      ),
                                    ),
                                  ).then((_) {
                                    if (mounted) {
                                      setState(() {
                                        _pendingInitialHeldBill = null;
                                      });
                                      _fetchHeldOrdersCount();
                                    }
                                  });
                                }
                              },
                              child: const Text('ADD TO CART', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                            )
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }
          );
        }
      );
    }
  }

  Widget _buildProductImage(String? imageUrl) {
    if (imageUrl != null && imageUrl.isNotEmpty) {
      return Image.network(
        imageUrl,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => const Icon(Icons.inventory_2_rounded, size: 48, color: Colors.blueAccent),
      );
    }
    return const Icon(Icons.inventory_2_rounded, size: 48, color: Colors.blueAccent);
  }

  Widget _buildGridView() {
    return GridView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.85,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: _filteredItems.length,
      itemBuilder: (context, index) {
        final item = _filteredItems[index];
        return GestureDetector(
          onTap: () => _showItemDialog(item),
          child: Container(
            clipBehavior: Clip.hardEdge,
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.1)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ]
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  flex: 3,
                  child: Stack(
                    children: [
                      Container(
                        width: double.infinity,
                        height: double.infinity,
                        color: Theme.of(context).scaffoldBackgroundColor,
                        child: _buildProductImage(item.imageUrl),
                      ),
                      Positioned(
                        top: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: item.itemType?.toLowerCase() == 'service' ? Colors.purple.withOpacity(0.9) : 
                                   (item.recipeType?.toLowerCase() == 'a la carte' || item.recipeType?.toLowerCase() == 'buffet') ? Colors.orange.withOpacity(0.9) : 
                                   Colors.blueAccent.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            (item.recipeType?.toLowerCase() == 'a la carte' || item.recipeType?.toLowerCase() == 'buffet') 
                                ? item.recipeType!.toUpperCase() 
                                : (item.itemType ?? 'Part').toUpperCase(),
                            style: const TextStyle(fontSize: 9, color: Colors.white, fontWeight: FontWeight.bold)
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.name, 
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Theme.of(context).textTheme.bodyLarge?.color), 
                              maxLines: 1, 
                              overflow: TextOverflow.ellipsis
                            ),
                            if (item.sku != null && item.sku!.isNotEmpty)
                              Text(item.sku!, style: TextStyle(fontSize: 10, color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.5)), maxLines: 1, overflow: TextOverflow.ellipsis),
                          ],
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '\$${item.price.toStringAsFixed(2)}', 
                              style: const TextStyle(color: Colors.green, fontSize: 14, fontWeight: FontWeight.bold)
                            ),
                            if (item.itemType?.toLowerCase() != 'service' && item.recipeType?.toLowerCase() != 'a la carte' && item.recipeType?.toLowerCase() != 'buffet')
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: item.stockLevel > 0 ? Colors.blueAccent.withOpacity(0.1) : Colors.redAccent.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  item.stockLevel > 0 ? '${item.stockLevel % 1 == 0 ? item.stockLevel.toInt() : item.stockLevel} left' : 'Out',
                                  style: TextStyle(
                                    fontSize: 10, 
                                    color: item.stockLevel > 0 ? Colors.blueAccent : Colors.redAccent, 
                                    fontWeight: FontWeight.bold
                                  )
                                ),
                              )
                          ],
                        )
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildListView() {
    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: _filteredItems.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = _filteredItems[index];
        return GestureDetector(
          onTap: () => _showItemDialog(item),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.1)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ]
            ),
            child: Row(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  clipBehavior: Clip.hardEdge,
                  decoration: BoxDecoration(
                    color: Theme.of(context).scaffoldBackgroundColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: _buildProductImage(item.imageUrl),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            margin: const EdgeInsets.only(right: 6),
                            decoration: BoxDecoration(
                              color: item.itemType?.toLowerCase() == 'service' ? Colors.purple.withOpacity(0.1) : 
                                     (item.recipeType?.toLowerCase() == 'a la carte' || item.recipeType?.toLowerCase() == 'buffet') ? Colors.orange.withOpacity(0.1) : 
                                     Colors.blueAccent.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              (item.recipeType?.toLowerCase() == 'a la carte' || item.recipeType?.toLowerCase() == 'buffet') 
                                  ? item.recipeType!.toUpperCase() 
                                  : (item.itemType ?? 'Part').toUpperCase(),
                              style: TextStyle(
                                fontSize: 8, 
                                color: item.itemType?.toLowerCase() == 'service' ? Colors.purple : 
                                       (item.recipeType?.toLowerCase() == 'a la carte' || item.recipeType?.toLowerCase() == 'buffet') ? Colors.deepOrange : 
                                       Colors.blueAccent, 
                                fontWeight: FontWeight.bold)
                            ),
                          ),
                          Expanded(
                            child: Text(
                              item.name, 
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Theme.of(context).textTheme.bodyLarge?.color), 
                              maxLines: 1, 
                              overflow: TextOverflow.ellipsis
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      if (item.sku != null && item.sku!.isNotEmpty)
                        Text(item.sku!, style: TextStyle(fontSize: 11, color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.5))),
                      const SizedBox(height: 4),
                      if (item.itemType?.toLowerCase() != 'service')
                        Text(
                          item.stockLevel > 0 ? 'Stock: ${item.stockLevel % 1 == 0 ? item.stockLevel.toInt() : item.stockLevel}' : 'Out of Stock',
                          style: TextStyle(
                            fontSize: 11, 
                            color: item.stockLevel > 0 ? Colors.blueAccent : Colors.redAccent, 
                            fontWeight: FontWeight.bold
                          )
                        )
                    ],
                  ),
                ),
                Text(
                  '\$${item.price.toStringAsFixed(2)}', 
                  style: const TextStyle(color: Colors.green, fontSize: 18, fontWeight: FontWeight.bold)
                ),
              ],
            ),
          ),
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Products', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          TextButton.icon(
            onPressed: () async {
              // Navigate to held bills screen
              final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => const HeldBillsScreen()));
              _fetchHeldOrdersCount(); // Refresh count when coming back
              
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
                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (context) => KOTReceiptDialog(orderData: orderData),
                  );
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
                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (context) => GuestReceiptDialog(orderData: orderData),
                  );
                } else if (action == 'continue') {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (context) => CartScreen(
                        customer: _currentCustomer!,
                        tableId: _currentTableId,
                        stewardId: _currentStewardId,
                        orderType: _currentOrderType,
                        initialHeldBill: billData,
                      ),
                    ),
                  );
                }
              }
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
          IconButton(
            icon: const Icon(Icons.local_offer, color: Colors.green),
            tooltip: 'View Active Promotions',
            onPressed: () async {
              showDialog(
                context: context,
                barrierDismissible: false,
                builder: (ctx) => const Center(child: CircularProgressIndicator()),
              );
              final promos = await _apiService.fetchPromotions(forceRefresh: true);
              if (!mounted) return;
              Navigator.pop(context); // close loading

              final activePromos = promos.where((p) => p['is_active']?.toString() == '1').toList();
              
              if (!mounted) return;
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Row(
                    children: [
                      Icon(Icons.local_offer, color: Colors.green),
                      SizedBox(width: 8),
                      Text('Active Promotions'),
                    ],
                  ),
                  content: activePromos.isEmpty 
                      ? const Text('No active promotions available at the moment.')
                      : SizedBox(
                          width: double.maxFinite,
                          child: ListView.separated(
                            shrinkWrap: true,
                            itemCount: activePromos.length,
                            separatorBuilder: (c, i) => const Divider(),
                            itemBuilder: (c, i) {
                              final p = activePromos[i];
                              
                              String subtitleText = p['description'] ?? 'Special offer';
                              if (p['benefits'] != null) {
                                try {
                                  final benefits = p['benefits'] as List;
                                  for (var b in benefits) {
                                    if (b['benefit_type'] == 'BuyXGetY') {
                                      final tNames = b['trigger_item_names'] != null ? (b['trigger_item_names'] as Map).values.join(', ') : '';
                                      final rNames = b['reward_item_names'] != null ? (b['reward_item_names'] as Map).values.join(', ') : '';
                                      if (tNames.isNotEmpty && rNames.isNotEmpty) {
                                        subtitleText += '\n\n• Buy: $tNames\n• Get Free: $rNames';
                                      } else if (tNames.isNotEmpty) {
                                        subtitleText += '\n\n• Eligible Items: $tNames';
                                      }
                                    }
                                  }
                                } catch (_) {}
                              }

                              return ListTile(
                                isThreeLine: subtitleText.contains('\n'),
                                title: Text(p['name'] ?? 'Promo', style: const TextStyle(fontWeight: FontWeight.bold)),
                                subtitle: Text(subtitleText),
                                trailing: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    p['type'] ?? 'Offer', 
                                    style: const TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Close'),
                    )
                  ],
                ),
              );
            },
          ),
          IconButton(
            icon: Icon(_isGridView ? Icons.view_list_rounded : Icons.grid_view_rounded),
            onPressed: () {
              setState(() {
                _isGridView = !_isGridView;
              });
            },
            tooltip: _isGridView ? 'Switch to List View' : 'Switch to Grid View',
          )
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search products by name...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                        },
                      )
                    : null,
                filled: true,
                fillColor: Theme.of(context).cardColor,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _loadItems,
              child: _isLoading 
                ? const Center(child: CircularProgressIndicator(color: Colors.blueAccent))
                : _filteredItems.isEmpty 
                  ? ListView(physics: const AlwaysScrollableScrollPhysics(), children: [SizedBox(height: MediaQuery.of(context).size.height*0.4), const Center(child: Text('No products available'))])
                  : _isGridView ? _buildGridView() : _buildListView(),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Colors.blueAccent,
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => CartScreen(
                customer: _currentCustomer!,
                orderType: _currentOrderType,
                tableId: _currentTableId,
                stewardId: _currentStewardId,
                initialHeldBill: _pendingInitialHeldBill,
              ),
            ),
          ).then((_) {
            if (mounted) {
              setState(() {
                _pendingInitialHeldBill = null;
              });
              _fetchHeldOrdersCount();
            }
          });
        },
        child: const Icon(Icons.shopping_cart, color: Colors.white),
      ),
    );
  }
}
