import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:io';
import 'dart:async';
import 'dart:convert';
import '../services/api_service.dart';
import '../services/db_service.dart';
import 'customer_selection_screen.dart';
import '../components/order_type_selector.dart';
import 'login_screen.dart';
import 'settings_screen.dart';
import 'invoices_screen.dart';
import 'day_end_summary_screen.dart';
import 'offline_sync_screen.dart';
import 'customer_registration_screen.dart';
import '../components/guest_receipt_dialog.dart';
import '../components/route_selector_widget.dart';
import '../components/kot_receipt_dialog.dart';
import '../models/service_location.dart';
import '../services/printer_service.dart';
import '../models/customer.dart';
import 'products_screen.dart';
import 'cart_screen.dart';
import 'held_bills_screen.dart';
import 'payment_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _activeLocationName = 'Loading...';
  int _activeLocationId = 0;
  bool _isOnline = true;
  int _offlineCount = 0;
  Timer? _pingTimer;
  Map<String, dynamic>? _salesData;
  bool _isLoadingSales = true;

  @override
  void initState() {
    super.initState();
    _loadLocation();
    _fetchSalesData();
    _checkConnectivity();
    
    // Check real internet connection every 5 seconds
    _pingTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      _checkConnectivity();
    });

    Connectivity().onConnectivityChanged.listen((List<ConnectivityResult> results) {
      if (results.contains(ConnectivityResult.none) && results.length == 1) {
        if (mounted && _isOnline) {
          setState(() => _isOnline = false);
        }
      } else {
        _checkConnectivity();
      }
    });
  }

  @override
  void dispose() {
    _pingTimer?.cancel();
    super.dispose();
  }

  Future<void> _checkConnectivity() async {
    bool hasInternet = false;
    try {
      final connectivityResult = await Connectivity().checkConnectivity();
      if (connectivityResult.contains(ConnectivityResult.none) && connectivityResult.length == 1) {
        hasInternet = false;
      } else {
        final socket = await Socket.connect('8.8.8.8', 53, timeout: const Duration(seconds: 2));
        socket.destroy();
        hasInternet = true;
      }
    } catch (_) {
      hasInternet = false;
    }

    if (mounted) {
      if (_isOnline != hasInternet) {
        setState(() {
          _isOnline = hasInternet;
        });
      }
      if (hasInternet) _checkOfflineQueue();
    }
  }

  Future<void> _checkOfflineQueue() async {
    final queue = await DbService().getOfflineInvoices();
    if (mounted) {
      setState(() {
        _offlineCount = queue.length;
      });
    }
  }

  Future<void> _syncData() async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const Center(child: CircularProgressIndicator()),
    );
    try {
      await ApiService().syncOfflineInvoices();
      await _checkOfflineQueue();
    } finally {
      if (mounted) Navigator.pop(context);
    }
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sync Complete!')));
    }
  }

  Future<void> _loadLocation() async {
    final location = await ApiService().getActiveLocation();
    if (mounted && location != null) {
      setState(() {
        _activeLocationName = location['name'] as String;
        _activeLocationId = location['id'] as int;
      });
    } else if (mounted) {
      setState(() {
        _activeLocationName = 'No Location Selected';
      });
    }
  }

  Future<void> _fetchSalesData() async {
    final data = await ApiService().fetchDashboardSales();
    if (mounted) {
      setState(() {
        _salesData = data;
        _isLoadingSales = false;
      });
    }
  }

  String _formatCurrency(dynamic amount) {
    double val = double.tryParse(amount?.toString() ?? '0') ?? 0.0;
    String str = val.toStringAsFixed(2);
    str = str.replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
    return str;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 0,
        actions: [
          RouteSelectorWidget(
            onRoutesChanged: () {
              // Optionally trigger a silent refetch or just update UI
              // _fetchSalesData();
            },
          ),
          InkWell(
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Checking connection...'), duration: Duration(seconds: 1)));
              _checkConnectivity();
            },
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: _isOnline ? Colors.green.withOpacity(0.2) : Colors.red.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _isOnline ? Colors.green : Colors.red),
              ),
              child: Row(
                children: [
                  Icon(
                    _isOnline ? Icons.wifi : Icons.wifi_off,
                    size: 16,
                    color: _isOnline ? Colors.green : Colors.red,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _isOnline ? 'Online' : 'Offline',
                    style: TextStyle(
                      color: _isOnline ? Colors.green : Colors.red,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      drawer: Drawer(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  DrawerHeader(
                    decoration: const BoxDecoration(
                      color: Colors.blueAccent,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        const Text(
                          'POS Menu',
                          style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        InkWell(
                          onTap: () async {
                            if (_activeLocationId != 0) {
                              showDialog(
                                context: context,
                                barrierDismissible: false,
                                builder: (context) => const Center(child: CircularProgressIndicator()),
                              );
                              try {
                                final locations = await ApiService().fetchLocations();
                                final taxes = await ApiService().fetchTaxes();
                                if (mounted) Navigator.pop(context); // close loader
                                
                                final activeLoc = locations.firstWhere((l) => l.id == _activeLocationId, orElse: () => ServiceLocation(id: _activeLocationId, name: _activeLocationName, locationType: 'service'));
                                
                                List<String> taxNames = [];
                                if (activeLoc.allowedTaxesJson != null) {
                                  try {
                                    List<dynamic> decodedIds = jsonDecode(activeLoc.allowedTaxesJson!);
                                    List<int> allowedIds = decodedIds.map((e) => int.tryParse(e.toString()) ?? -1).toList();
                                    taxNames = taxes.where((t) => t.isActive && allowedIds.contains(t.id)).map((t) => t.name).toList();
                                  } catch (_) {}
                                }

                                if (mounted) {
                                  showDialog(
                                    context: context,
                                    builder: (context) {
                                      return AlertDialog(
                                        title: Row(
                                          children: [
                                            const Icon(Icons.info, color: Colors.blueAccent),
                                            const SizedBox(width: 8),
                                            Expanded(child: Text(activeLoc.name)),
                                          ],
                                        ),
                                        content: Column(
                                          mainAxisSize: MainAxisSize.min,
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text('Type: ${activeLoc.locationType}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                            const SizedBox(height: 8),
                                            Text('Retail allowed: ${activeLoc.allowRetail ? "Yes" : "No"}'),
                                            Text('Dine-In allowed: ${activeLoc.allowDineIn ? "Yes" : "No"}'),
                                            const Divider(),
                                            const Text('Taxes & Charges', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blueAccent)),
                                            const SizedBox(height: 4),
                                            Text('Service Charge: ${activeLoc.allowServiceCharge ? "${activeLoc.serviceChargeRate}%" : "Not Allowed"}'),
                                            const SizedBox(height: 4),
                                            Text('Applied Taxes: ${taxNames.isEmpty ? "None" : taxNames.join(', ')}'),
                                          ],
                                        ),
                                        actions: [
                                          TextButton(
                                            onPressed: () => Navigator.pop(context),
                                            child: const Text('Close'),
                                          ),
                                        ],
                                      );
                                    }
                                  );
                                }
                              } catch (e) {
                                if (mounted) {
                                  Navigator.pop(context);
                                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to load location info: $e')));
                                }
                              }
                            }
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4.0),
                            child: Row(
                              children: [
                                const Icon(Icons.location_on, color: Colors.white70, size: 16),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    _activeLocationName,
                                    style: const TextStyle(color: Colors.white, fontSize: 14, decoration: TextDecoration.underline),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  ListTile(
                    leading: const Icon(Icons.add_shopping_cart),
                    title: const Text('New Transaction'),
                    onTap: () async {
                      Navigator.pop(context);
                      if (_activeLocationId != 0) {
                        final loc = ServiceLocation(id: _activeLocationId, name: _activeLocationName, locationType: 'service');
                        final result = await OrderTypeSelector.show(context, loc);
                        if (result != null) {
                          await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => CustomerSelectionScreen(
                                orderType: result['orderType'],
                                tableId: result['tableId'],
                                stewardId: result['stewardId'],
                              ),
                            ),
                          );
                          _fetchSalesData();
                        }
                      }
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.restore_page_outlined),
                    title: const Text('Continue Bill'),
                    onTap: () async {
                      Navigator.pop(context);
                      await _openHeldBills(context);
                      _fetchSalesData();
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.payment),
                    title: const Text('Payment'),
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const PaymentScreen()));
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.receipt_long),
                    title: const Text("Today's Invoices"),
                    onTap: () async {
                      Navigator.pop(context);
                      await Navigator.push(context, MaterialPageRoute(builder: (_) => const InvoicesScreen()));
                      _fetchSalesData();
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.summarize),
                    title: const Text("Day End Summary"),
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const DayEndSummaryScreen()));
                    },
                  ),
                  const Divider(),
                  ListTile(
                    leading: const Icon(Icons.person_add),
                    title: const Text('New Customer'),
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const CustomerRegistrationScreen()));
                    },
                  ),
                  ListTile(
                    leading: Badge(
                      isLabelVisible: _offlineCount > 0,
                      label: Text(_offlineCount.toString()),
                      child: const Icon(Icons.sync),
                    ),
                    title: const Text('Sync Offline Data'),
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const OfflineSyncScreen())).then((_) {
                        _checkOfflineQueue();
                      });
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.keyboard_return),
                    title: const Text('Returns & Refunds'),
                    onTap: () {
                      Navigator.pop(context);
                      // TODO: Implement Returns/Refunds List View
                    },
                  ),

                  ListTile(
                    leading: const Icon(Icons.settings),
                    title: const Text('Settings'),
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()));
                    },
                  ),
                ],
              ),
            ),
            // Profile Bottom Area
            const Divider(height: 1),
            ListTile(
              leading: const CircleAvatar(
                backgroundColor: Colors.blueAccent,
                child: Icon(Icons.person, color: Colors.white),
              ),
              title: const Text('Admin User', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('admin@payshia.com'),
              onTap: () {},
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text('Logout', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
              onTap: () async {
                Navigator.pop(context);
                await ApiService().logout();
                if (!context.mounted) return;
                Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await _loadLocation();
            await _fetchSalesData();
            await _checkOfflineQueue();
            
            // Forcibly refresh all cached master data
            try {
              await ApiService().fetchCustomers(forceRefresh: true);
              await ApiService().fetchProducts(forceRefresh: true);
              await ApiService().fetchTaxes(forceRefresh: true);
              await ApiService().fetchLocations(forceRefresh: true);
            } catch (_) {}
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
              // Noticeboard Section (Placeholder)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.blue.withOpacity(0.3)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.campaign, color: Colors.blue, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Noticeboard / Announcements', 
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.blueAccent)
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'No new announcements at the moment. Check back later!', 
                            style: TextStyle(color: Colors.grey[700], fontSize: 13)
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              // Stats Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildStatCard(
                    context, 
                    'Today\'s Sales', 
                    _isLoadingSales ? '...' : _formatCurrency(_salesData?['kpis']?['today']?['revenue']), 
                    Icons.trending_up, 
                    Colors.blue
                  ),
                  const SizedBox(width: 16),
                  _buildStatCard(
                    context, 
                    'Transactions', 
                    _isLoadingSales ? '...' : '${_salesData?['kpis']?['today']?['count'] ?? 0}', 
                    Icons.receipt, 
                    Colors.orange
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildStatCard(
                    context, 
                    'Outstanding', 
                    _isLoadingSales ? '...' : _formatCurrency(_salesData?['kpis']?['outstanding']), 
                    Icons.account_balance_wallet, 
                    Colors.purple
                  ),
                  const SizedBox(width: 16),
                  _buildStatCard(
                    context, 
                    'Collections', 
                    _isLoadingSales ? '...' : _formatCurrency(_salesData?['kpis']?['today']?['collection']), 
                    Icons.money, 
                    Colors.green
                  ),
                ],
              ),
              const SizedBox(height: 48),

              // Action Cards
              Column(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                    _buildActionCard(
                      context,
                      title: 'New Transaction',
                      subtitle: 'Start a completely new bill for a customer',
                      icon: Icons.add_circle_outline,
                      color: Colors.blueAccent,
                      onTap: () async {
                        if (_activeLocationId != 0) {
                          final loc = ServiceLocation(id: _activeLocationId, name: _activeLocationName, locationType: 'service');
                          final result = await OrderTypeSelector.show(context, loc);
                          if (result != null) {
                            await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => CustomerSelectionScreen(
                                  orderType: result['orderType'],
                                  tableId: result['tableId'],
                                  stewardId: result['stewardId'],
                                ),
                              ),
                            );
                            _fetchSalesData();
                          }
                        }
                      },
                    ),
                    const SizedBox(height: 16),
                    _buildActionCard(
                      context,
                      title: 'Continue Bill',
                      subtitle: 'Resume an existing draft or pending order',
                      icon: Icons.restore_page_outlined,
                      color: Colors.orangeAccent,
                      onTap: () async {
                        await _openHeldBills(context);
                        _fetchSalesData();
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 48),
                
                // Top Selling Items Section
                if (_isLoadingSales || (_salesData != null && (_salesData!['topItems'] as List?)?.isNotEmpty == true)) ...[
                  Row(
                    children: [
                      const Icon(Icons.star, color: Colors.amber, size: 28),
                      const SizedBox(width: 8),
                      Text(
                        'Top Selling Items',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Theme.of(context).textTheme.bodyLarge?.color),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 15, offset: const Offset(0, 5))
                      ],
                    ),
                    child: _isLoadingSales
                      ? const Padding(padding: EdgeInsets.all(32.0), child: Center(child: CircularProgressIndicator()))
                      : ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: (_salesData!['topItems'] as List?)?.length ?? 0,
                          separatorBuilder: (context, index) => const Divider(height: 1, indent: 16, endIndent: 16),
                          itemBuilder: (context, index) {
                            final item = (_salesData!['topItems'] as List)[index];
                            return ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                              leading: CircleAvatar(
                                backgroundColor: Colors.blueAccent.withOpacity(0.1),
                                child: const Icon(Icons.inventory, color: Colors.blueAccent),
                              ),
                              title: Text(item['name']?.toString() ?? 'Item', style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text('${item['qty']} Sold', style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6))),
                              trailing: Text(
                                _formatCurrency(item['revenue']),
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.green),
                              ),
                            );
                          },
                        ),
                  ),
                  const SizedBox(height: 48),
                ],
              ],
            ),
          ),
        ),
        ),
      ),
    );
  }

  Widget _buildStatCard(BuildContext context, String title, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.1)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 12),
            Text(title, style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6), fontSize: 14)),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color, fontSize: 20, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(BuildContext context, {required String title, required String subtitle, required IconData icon, required Color color, required VoidCallback onTap}) {
    final textColor = Theme.of(context).textTheme.bodyLarge?.color;
    final subtitleColor = Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6);
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: color.withOpacity(0.05),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: color.withOpacity(0.2), width: 2),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 36),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: textColor)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: TextStyle(fontSize: 13, color: subtitleColor)),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: color, size: 32),
          ],
        ),
      ),
    );
  }

  Future<void> _openHeldBills(BuildContext context) async {
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
            'subtotal': double.tryParse(it['line_total']?.toString() ?? '0') ?? 0.0,
          }).toList() ?? [],
        };
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => GuestReceiptDialog(orderData: orderData),
        );
      } else if (action == 'continue') {
        final customerId = int.tryParse(billData['customer_id']?.toString() ?? '1') ?? 1;
        final customerName = billData['customer_name']?.toString() ?? 'Walk-in Customer';
        final customerPhone = billData['customer_phone']?.toString() ?? '';
        
        final customer = Customer(id: customerId, name: customerName, phone: customerPhone);
        
        await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => CartScreen(
              customer: customer,
              orderType: billData['order_type']?.toString() ?? 'Retail',
              tableId: int.tryParse(billData['table_id']?.toString() ?? ''),
              stewardId: int.tryParse(billData['steward_id']?.toString() ?? ''),
              initialHeldBill: billData,
            ),
          ),
        );
      }
    }
  }
}
