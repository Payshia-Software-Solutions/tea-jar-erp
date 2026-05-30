import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:io';
import 'dart:async';
import 'dart:convert';
import 'package:geolocator/geolocator.dart';
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
import 'visit_map_screen.dart';
import '../components/gradient_background.dart';

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
  bool _reportsExpanded = false;

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

  Future<bool> _checkLocationBeforeProceeding() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Location services are disabled. Please turn on GPS.'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
      return false;
    }
    return true;
  }

  // ── Drawer Helpers ──────────────────────────────────────────────────────────

  Widget _drawerSectionLabel(String label) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 2),
      child: Text(
        label,
        style: TextStyle(
          color: Colors.white.withOpacity(0.35),
          fontSize: 9,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _drawerDivider() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
      child: Divider(color: Colors.white.withOpacity(0.08), height: 1),
    );
  }

  Widget _drawerItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color iconColor,
    required VoidCallback onTap,
    String? badge,
  }) {
    return InkWell(
      onTap: onTap,
      splashColor: iconColor.withOpacity(0.1),
      highlightColor: iconColor.withOpacity(0.05),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 1),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: iconColor, size: 16),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              if (badge != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.redAccent,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    badge,
                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                )
              else
                Icon(Icons.chevron_right_rounded, color: Colors.white.withOpacity(0.2), size: 16),
            ],
          ),
        ),
      ),
    );
  }

  // ────────────────────────────────────────────────────────────────────────────

  Widget _drawerExpandable(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color iconColor,
    required bool expanded,
    required VoidCallback onToggle,
    required List<Widget> children,
  }) {
    return Column(
      children: [
        InkWell(
          onTap: onToggle,
          splashColor: iconColor.withOpacity(0.1),
          highlightColor: iconColor.withOpacity(0.05),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 1),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              child: Row(
                children: [
                  Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: iconColor.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(icon, color: iconColor, size: 16),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      label,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  AnimatedRotation(
                    turns: expanded ? 0.25 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
                      Icons.chevron_right_rounded,
                      color: expanded ? iconColor : Colors.white.withOpacity(0.3),
                      size: 16,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        AnimatedCrossFade(
          duration: const Duration(milliseconds: 200),
          crossFadeState: expanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
          firstChild: const SizedBox.shrink(),
          secondChild: Container(
            margin: const EdgeInsets.only(left: 24, right: 12, bottom: 4),
            decoration: BoxDecoration(
              border: Border(
                left: BorderSide(color: iconColor.withOpacity(0.3), width: 2),
              ),
            ),
            child: Column(children: children),
          ),
        ),
      ],
    );
  }

  Widget _drawerSubItem({
    required IconData icon,
    required String label,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      splashColor: iconColor.withOpacity(0.1),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 1),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          child: Row(
            children: [
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(7),
                ),
                child: Icon(icon, color: iconColor, size: 13),
              ),
              const SizedBox(width: 12),
              Text(
                label,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.85),
                  fontSize: 12,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ────────────────────────────────────────────────────────────────────────────

  String _formatCurrency(dynamic amount) {
    double val = double.tryParse(amount?.toString() ?? '0') ?? 0.0;
    String str = val.toStringAsFixed(2);
    str = str.replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
    return str;
  }

  @override
  Widget build(BuildContext context) {
    return GradientBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent, // Let gradient show through
        appBar: AppBar(
          backgroundColor: Colors.transparent, // Let gradient show through
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
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF0F0F1A),
                Color(0xFF1A1A2E),
                Color(0xFF16213E),
              ],
              stops: [0.0, 0.5, 1.0],
            ),
          ),
          child: Column(
            children: [
              Expanded(
                child: ListView(
                  padding: EdgeInsets.zero,
                  children: [
                    // ── Header ──────────────────────────────────────
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.only(
                        top: MediaQuery.of(context).padding.top + 14,
                        left: 20,
                        right: 20,
                        bottom: 16,
                      ),
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Color(0xFF1565C0),
                            Color(0xFF0D47A1),
                            Color(0xFF0A2463),
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Color(0x551565C0),
                            blurRadius: 20,
                            offset: Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Logo / Brand
                          Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: Colors.white.withOpacity(0.3)),
                            ),
                            child: const Icon(Icons.point_of_sale, color: Colors.white, size: 20),
                          ),
                          const SizedBox(height: 10),
                          const Text(
                            'POS Menu',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 4),
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
                            child: Row(
                              children: [
                                const Icon(Icons.location_on, color: Colors.white60, size: 14),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    _activeLocationName,
                                    style: const TextStyle(
                                      color: Colors.white70,
                                      fontSize: 13,
                                      decoration: TextDecoration.underline,
                                      decorationColor: Colors.white38,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const Icon(Icons.info_outline, color: Colors.white38, size: 14),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 8),

                    // ── Section: Transactions ───────────────────────
                    _drawerSectionLabel('TRANSACTIONS'),
                    _drawerItem(
                      context,
                      icon: Icons.add_shopping_cart_rounded,
                      label: 'New Transaction',
                      iconColor: const Color(0xFF42A5F5),
                      onTap: () async {
                        Navigator.pop(context);
                        if (!await _checkLocationBeforeProceeding()) return;
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
                    _drawerItem(
                      context,
                      icon: Icons.restore_page_outlined,
                      label: 'Continue Bill',
                      iconColor: const Color(0xFFAB47BC),
                      onTap: () async {
                        Navigator.pop(context);
                        if (!await _checkLocationBeforeProceeding()) return;
                        await _openHeldBills(context);
                        _fetchSalesData();
                      },
                    ),
                    _drawerItem(
                      context,
                      icon: Icons.keyboard_return_rounded,
                      label: 'Returns & Refunds',
                      iconColor: const Color(0xFFEF5350),
                      onTap: () async {
                        Navigator.pop(context);
                        await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const CustomerSelectionScreen(
                              orderType: 'retail',
                              isReturnSelection: true,
                            ),
                          ),
                        );
                        _fetchSalesData();
                      },
                    ),

                    const SizedBox(height: 4),
                    _drawerDivider(),

                    // ── Section: Reports ─────────────────────────────
                    _drawerSectionLabel('REPORTS & RECORDS'),
                    _drawerItem(
                      context,
                      icon: Icons.payment_rounded,
                      label: 'Payment',
                      iconColor: const Color(0xFF26C6DA),
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const PaymentScreen()));
                      },
                    ),
                    // ── Collapsible group ─────────────────────────────
                    _drawerExpandable(
                      context,
                      icon: Icons.bar_chart_rounded,
                      label: 'Reports & Tracking',
                      iconColor: const Color(0xFF66BB6A),
                      expanded: _reportsExpanded,
                      onToggle: () => setState(() => _reportsExpanded = !_reportsExpanded),
                      children: [
                        _drawerSubItem(
                          icon: Icons.receipt_long_rounded,
                          label: "Today's Invoices",
                          iconColor: const Color(0xFF66BB6A),
                          onTap: () async {
                            Navigator.pop(context);
                            await Navigator.push(context, MaterialPageRoute(builder: (_) => const InvoicesScreen()));
                            _fetchSalesData();
                          },
                        ),
                        _drawerSubItem(
                          icon: Icons.summarize_rounded,
                          label: 'Day End Summary',
                          iconColor: const Color(0xFFFFCA28),
                          onTap: () {
                            Navigator.pop(context);
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const DayEndSummaryScreen()));
                          },
                        ),
                        _drawerSubItem(
                          icon: Icons.map_outlined,
                          label: 'Tracking & Visit Map',
                          iconColor: const Color(0xFFFF7043),
                          onTap: () {
                            Navigator.pop(context);
                            Navigator.push(context, MaterialPageRoute(builder: (_) => VisitMapScreen()));
                          },
                        ),
                      ],
                    ),

                    const SizedBox(height: 4),
                    _drawerDivider(),

                    // ── Section: Tools ───────────────────────────────
                    _drawerSectionLabel('TOOLS'),
                    _drawerItem(
                      context,
                      icon: Icons.person_add_rounded,
                      label: 'New Customer',
                      iconColor: const Color(0xFF42A5F5),
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const CustomerRegistrationScreen()));
                      },
                    ),
                    _drawerItem(
                      context,
                      icon: Icons.sync_rounded,
                      label: 'Sync Offline Data',
                      iconColor: const Color(0xFF26C6DA),
                      badge: _offlineCount > 0 ? _offlineCount.toString() : null,
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const OfflineSyncScreen())).then((_) {
                          _checkOfflineQueue();
                        });
                      },
                    ),
                    _drawerItem(
                      context,
                      icon: Icons.settings_rounded,
                      label: 'Settings',
                      iconColor: const Color(0xFF90A4AE),
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()));
                      },
                    ),

                    const SizedBox(height: 16),
                  ],
                ),
              ),

              // ── Profile & Logout ─────────────────────────────────
              Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  border: Border(
                    top: BorderSide(color: Colors.white.withOpacity(0.1)),
                  ),
                ),
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Row(
                        children: [
                          Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF1565C0), Color(0xFF42A5F5)],
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.person_rounded, color: Colors.white, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Admin User',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                                Text(
                                  'admin@payshia.com',
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.5),
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    InkWell(
                      onTap: () async {
                        Navigator.pop(context);
                        await ApiService().logout();
                        if (!context.mounted) return;
                        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
                      },
                      child: Container(
                        margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Colors.red.shade900.withOpacity(0.6), Colors.red.shade700.withOpacity(0.4)],
                          ),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.red.withOpacity(0.3)),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.logout_rounded, color: Colors.redAccent, size: 18),
                            SizedBox(width: 8),
                            Text(
                              'Logout',
                              style: TextStyle(
                                color: Colors.redAccent,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    SizedBox(height: MediaQuery.of(context).padding.bottom),
                  ],
                ),
              ),
            ],
          ),
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
                        if (!await _checkLocationBeforeProceeding()) return;
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
                        if (!await _checkLocationBeforeProceeding()) return;
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
    ));
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
