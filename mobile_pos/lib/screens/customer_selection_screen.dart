import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../models/customer.dart';
import '../services/api_service.dart';
import '../services/printer_service.dart';
import 'cart_screen.dart';
import 'qr_checkin_screen.dart';
import 'qr_scanner_screen.dart' as qr_scanner;

class CustomerSelectionScreen extends StatefulWidget {
  final String? orderType;
  final int? tableId;
  final int? stewardId;

  const CustomerSelectionScreen({
    super.key,
    this.orderType,
    this.tableId,
    this.stewardId,
  });

  @override
  State<CustomerSelectionScreen> createState() => _CustomerSelectionScreenState();
}

class _CustomerSelectionScreenState extends State<CustomerSelectionScreen> {
  final ApiService _apiService = ApiService();
  List<Customer> _customers = [];
  List<Customer> _filteredCustomers = [];
  List<int> _activeRoutes = [];
  List<int> _visitedCustomerIds = [];
  bool _showVisited = false;
  bool _isLoading = true;
  bool _isMapView = false;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadCustomers();
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
      _filteredCustomers = _customers.where((c) {
        final matchesRoute = _activeRoutes.isEmpty || (c.routeId != null && _activeRoutes.contains(c.routeId));
        final matchesSearch = c.name.toLowerCase().contains(query) || 
                              (c.phone != null && c.phone!.contains(query)) ||
                              (c.email != null && c.email!.toLowerCase().contains(query));
        
        final isVisited = _visitedCustomerIds.contains(c.id);
        final matchesVisitedStatus = _showVisited ? isVisited : !isVisited;

        return matchesRoute && matchesSearch && matchesVisitedStatus;
      }).toList();
    });
  }

  Future<void> _loadCustomers({bool force = true}) async {
    try {
      _activeRoutes = await _apiService.getActiveRoutes();
      final visitedIds = await _apiService.getTodayVisitedCustomerIds();
      final customers = await _apiService.fetchCustomers(forceRefresh: force);
      if (mounted) {
        setState(() {
          _visitedCustomerIds = visitedIds;
          _customers = customers;
          _isLoading = false;
        });
        _onSearchChanged();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load customers: ${e.toString()}')),
        );
      }
    }
  }

  Widget _buildCustomerAvatar(Customer customer) {
    String initials = "C";
    if (customer.name.isNotEmpty) {
      final parts = customer.name.split(' ');
      if (parts.length > 1) {
        initials = '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      } else {
        initials = customer.name.substring(0, 1).toUpperCase();
      }
    }

    return CircleAvatar(
      backgroundColor: Colors.blueAccent.withOpacity(0.2),
      foregroundColor: Colors.blueAccent,
      radius: 24,
      child: Text(initials, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
    );
  }

  Future<void> _onCustomerSelected(Customer customer) async {
    final enforceVisit = await ApiService().getEnforceVisitBeforeSale();
    if (enforceVisit) {
      _showVisitDialog(customer);
    } else {
      _proceedToCart(customer);
    }
  }

  void _proceedToCart(Customer customer) {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => CartScreen(
          customer: customer,
          orderType: widget.orderType,
          tableId: widget.tableId,
          stewardId: widget.stewardId,
        ),
      ),
    );
  }

  Future<void> _showVisitDialog(Customer customer) async {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, top: 16, left: 16, right: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Log Shop Visit', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            const Text('A physical visit is required before creating an order. You can either use GPS to verify your location or scan the shop\'s QR code.', style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                _handleCheckIn(customer, 'SALE', 'Start Order');
              },
              icon: const Icon(Icons.shopping_cart, color: Colors.white),
              label: const Text('Start Order', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green, padding: const EdgeInsets.symmetric(vertical: 12)),
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                _handleQRCheckIn(customer);
              },
              icon: const Icon(Icons.qr_code_scanner, color: Colors.white),
              label: const Text('Scan Shop QR to Check In', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent, padding: const EdgeInsets.symmetric(vertical: 12)),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () {
                Navigator.pop(ctx);
                _handleCheckIn(customer, 'NO_SALE', 'Shop Closed');
              },
              child: const Text('No Sale - Shop Closed'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () {
                Navigator.pop(ctx);
                _handleCheckIn(customer, 'NO_SALE', 'Overstocked');
              },
              child: const Text('No Sale - Overstocked'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () {
                Navigator.pop(ctx);
                _handleCheckIn(customer, 'NO_SALE', 'Owner Unavailable');
              },
              child: const Text('No Sale - Owner Unavailable'),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Future<void> _handleCheckIn(Customer customer, String type, String reason) async {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Verifying location...'), duration: Duration(seconds: 2))
      );
    }

    // 1. Check permissions
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Location services are disabled.')));
      return;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Location permissions are denied')));
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Location permissions are permanently denied, we cannot request permissions.')));
      return;
    }

    // 2. Get current position with timeout
    Position? position;
    try {
      position = await Geolocator.getCurrentPosition(
        timeLimit: const Duration(seconds: 10),
      );
    } catch (e) {
      // If high accuracy fails or times out, try last known position
      position = await Geolocator.getLastKnownPosition();
      if (position == null) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to get location. Please try again.')));
        return;
      }
    }

    // 3. Verify distance
    if (customer.latitude != null && customer.longitude != null && customer.latitude != 0) {
      double distanceInMeters = Geolocator.distanceBetween(
        position.latitude, position.longitude,
        customer.latitude!, customer.longitude!
      );

      if (distanceInMeters > 50) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('You are too far from the shop (${distanceInMeters.toStringAsFixed(0)}m). Must be within 50m to check in.')));
        return;
      }
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Warning: Customer has no saved GPS coordinates. Visit logged anyway.')));
    }

    // 4. Log Visit
    final success = await ApiService().logVisit({
      'customer_id': customer.id,
      'visit_type': type,
      'reason': reason,
      'latitude': position.latitude,
      'longitude': position.longitude,
    });

    if (success) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Visit logged successfully!')));
        setState(() {
          if (!_visitedCustomerIds.contains(customer.id)) {
            _visitedCustomerIds.add(customer.id);
          }
        });
        _onSearchChanged();
      }
      if (type == 'SALE') {
        _proceedToCart(customer);
      }
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to log visit to server.')));
    }
  }

  Future<void> _handleQRCheckIn(Customer customer) async {
    final expectedQrCode = 'CUSTOMER:${customer.id}';
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => QrCheckinScreen(
          expectedQrCode: expectedQrCode,
          customerName: customer.name,
        ),
      ),
    );

    if (result == true) {
      // Scanned successfully! Log visit as SALE and proceed.
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('QR Code verified! Logging visit...'))
        );
      }

      // We use dummy coordinates (0,0) or last known because GPS is bypassed by QR
      Position? position;
      try { position = await Geolocator.getLastKnownPosition(); } catch (_) {}
      
      final success = await ApiService().logVisit({
        'customer_id': customer.id,
        'visit_type': 'SALE',
        'reason': 'QR Scan',
        'latitude': position?.latitude ?? 0.0,
        'longitude': position?.longitude ?? 0.0,
      });

      if (success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Visit logged successfully via QR!')));
          setState(() {
            if (!_visitedCustomerIds.contains(customer.id)) {
              _visitedCustomerIds.add(customer.id);
            }
          });
          _onSearchChanged();
        }
        _proceedToCart(customer);
      } else {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to log visit to server.')));
      }
    }
  }

  Future<void> _printQR(Customer customer) async {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Printing QR...')));
    await PrinterService().printCustomerQR(customer.toMap());
  }

  Widget _buildMapView() {
    if (_filteredCustomers.isEmpty) {
      return const Center(child: Text('No customers to display on map.'));
    }

    LatLng initialCenter = const LatLng(6.9271, 79.8612);
    for (var c in _filteredCustomers) {
      if (c.latitude != null && c.longitude != null && c.latitude != 0 && c.longitude != 0) {
        initialCenter = LatLng(c.latitude!, c.longitude!);
        break;
      }
    }

    return FlutterMap(
      options: MapOptions(
        initialCenter: initialCenter,
        initialZoom: 12,
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.payshia.mobile_pos',
        ),
        MarkerLayer(
          markers: _filteredCustomers
              .where((c) => c.latitude != null && c.longitude != null && c.latitude != 0 && c.longitude != 0)
              .map((customer) {
            return Marker(
              point: LatLng(customer.latitude!, customer.longitude!),
              width: 40,
              height: 40,
              child: GestureDetector(
                onTap: () {
                  showModalBottomSheet(
                    context: context,
                    builder: (ctx) => Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ListTile(
                            leading: _buildCustomerAvatar(customer),
                            title: Text(customer.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (customer.phone != null && customer.phone!.isNotEmpty)
                                  Text(customer.phone!),
                                if (customer.lastVisitDate != null && customer.lastVisitDate!.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.history, size: 12, color: Colors.blueAccent),
                                        const SizedBox(width: 4),
                                        Text(
                                          'Last Visited: ${customer.lastVisitDate!.split(' ')[0]}',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.blueAccent,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                              ],
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.print, color: Colors.blueAccent),
                              onPressed: () => _printQR(customer),
                            ),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () {
                              Navigator.pop(ctx);
                              _onCustomerSelected(customer);
                            },
                            style: ElevatedButton.styleFrom(
                              minimumSize: const Size.fromHeight(48),
                              backgroundColor: Colors.blueAccent,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: const Text('SELECT / CHECK-IN', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          )
                        ],
                      ),
                    ),
                  );
                },
                child: Icon(
                  _visitedCustomerIds.contains(customer.id) ? Icons.check_circle : Icons.location_on, 
                  color: _visitedCustomerIds.contains(customer.id) ? Colors.green : Colors.red, 
                  size: 40
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildListView() {
    if (_filteredCustomers.isEmpty) {
      return const Center(child: Text('No customers found'));
    }
    return RefreshIndicator(
      onRefresh: () => _loadCustomers(force: true),
      color: Colors.blueAccent,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: _filteredCustomers.length,
        separatorBuilder: (context, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
        final customer = _filteredCustomers[index];
        return GestureDetector(
          onTap: () => _onCustomerSelected(customer),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.1)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ]
            ),
            child: Row(
              children: [
                _buildCustomerAvatar(customer),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              customer.name, 
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Theme.of(context).textTheme.bodyLarge?.color),
                            ),
                          ),
                          if (_visitedCustomerIds.contains(customer.id))
                            const Icon(Icons.check_circle, color: Colors.green, size: 18),
                        ],
                      ),
                      if (customer.phone != null && customer.phone!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Row(
                            children: [
                              Icon(Icons.phone, size: 12, color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.5)),
                              const SizedBox(width: 4),
                              Text(customer.phone!, style: TextStyle(fontSize: 12, color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7))),
                            ],
                          ),
                        ),
                      if (customer.email != null && customer.email!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Row(
                            children: [
                              Icon(Icons.email, size: 12, color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.5)),
                              const SizedBox(width: 4),
                              Text(customer.email!, style: TextStyle(fontSize: 12, color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7))),
                            ],
                          ),
                        ),
                      if (customer.lastVisitDate != null && customer.lastVisitDate!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.blueAccent.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.history, size: 12, color: Colors.blueAccent),
                                const SizedBox(width: 4),
                                Text(
                                  'Last Visited: ${customer.lastVisitDate!.split(' ')[0]}',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.blueAccent,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.print, color: Colors.blueAccent),
                  onPressed: () => _printQR(customer),
                ),
                const Icon(Icons.chevron_right, color: Colors.blueAccent),
              ],
            ),
          ),
        );
      },
    ),
  );
}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Customer', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: Icon(_isMapView ? Icons.list : Icons.map),
            onPressed: () {
              setState(() {
                _isMapView = !_isMapView;
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const qr_scanner.QRScannerScreen()),
              );
              if (result != null && result is String) {
                final customer = _customers.firstWhere(
                  (c) => c.qrCodeHash == result,
                  orElse: () => Customer(id: 0, name: ''),
                );
                if (customer.id != 0) {
                  _onCustomerSelected(customer);
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Customer not found for this QR code.')),
                  );
                }
              }
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by name, phone or email...',
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
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: SegmentedButton<bool>(
              segments: const [
                ButtonSegment<bool>(
                  value: false,
                  label: Text('To Visit'),
                  icon: Icon(Icons.location_on_outlined),
                ),
                ButtonSegment<bool>(
                  value: true,
                  label: Text('Visited'),
                  icon: Icon(Icons.check_circle_outline),
                ),
              ],
              selected: {_showVisited},
              onSelectionChanged: (Set<bool> newSelection) {
                setState(() {
                  _showVisited = newSelection.first;
                });
                _onSearchChanged();
              },
              style: SegmentedButton.styleFrom(
                backgroundColor: Theme.of(context).cardColor,
                selectedForegroundColor: Colors.white,
                selectedBackgroundColor: Colors.blueAccent,
              ),
            ),
          ),
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator(color: Colors.blueAccent))
              : _isMapView
                  ? _buildMapView()
                  : _buildListView(),
          ),
        ],
      ),
      floatingActionButton: _isMapView ? null : FloatingActionButton.extended(
        backgroundColor: Colors.blueAccent,
        onPressed: () {
          final walkIn = Customer(id: 0, name: 'Walk-in Customer');
          _onCustomerSelected(walkIn);
        },
        icon: const Icon(Icons.person_outline, color: Colors.white),
        label: const Text('WALK-IN', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
