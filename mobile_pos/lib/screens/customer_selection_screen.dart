import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geolocator_android/geolocator_android.dart';
import '../models/customer.dart';
import '../services/api_service.dart';
import '../services/db_service.dart';
import '../services/printer_service.dart';
import 'cart_screen.dart';
import 'qr_checkin_screen.dart';
import 'qr_scanner_screen.dart' as qr_scanner;

class CustomerSelectionScreen extends StatefulWidget {
  final String? orderType;
  final int? tableId;
  final int? stewardId;
  final bool isReturnSelection;

  const CustomerSelectionScreen({
    super.key,
    this.orderType,
    this.tableId,
    this.stewardId,
    this.isReturnSelection = false,
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
  bool _isLocating = false;
  final TextEditingController _searchController = TextEditingController();
  Position? _currentPosition;
  List<LatLng> _trackingPath = [];

  @override
  void initState() {
    super.initState();
    _loadCustomers();
    _fetchLocationAndSort();
    _loadTrackingPath();
    _searchController.addListener(_onSearchChanged);
  }

  Future<void> _loadTrackingPath() async {
    final logs = await DbService().getOfflineTrackingLogs();
    if (mounted) {
      setState(() {
        _trackingPath = logs.map((log) => LatLng(
          double.tryParse(log['latitude'].toString()) ?? 0.0, 
          double.tryParse(log['longitude'].toString()) ?? 0.0
        )).where((latLng) => latLng.latitude != 0.0).toList();
      });
    }
  }

  Future<void> _fetchLocationAndSort() async {
    if (mounted) setState(() => _isLocating = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) setState(() => _isLocating = false);
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted) setState(() => _isLocating = false);
          return;
        }
      }
      if (permission == LocationPermission.deniedForever) {
        if (mounted) setState(() => _isLocating = false);
        return;
      }

      LocationSettings locationSettings;
      if (Platform.isAndroid) {
        locationSettings = AndroidSettings(
          accuracy: LocationAccuracy.high,
          forceLocationManager: true,
          timeLimit: const Duration(seconds: 10),
        );
      } else {
        locationSettings = const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        );
      }

      _currentPosition = await Geolocator.getCurrentPosition(
        locationSettings: locationSettings,
      );
    } catch (_) {
      try {
        _currentPosition = await Geolocator.getLastKnownPosition();
      } catch (_) {
        _currentPosition = null;
      }
    }
    
    if (mounted) {
      setState(() => _isLocating = false);
      if (_currentPosition != null) {
        setState(() {
          _trackingPath.add(LatLng(_currentPosition!.latitude, _currentPosition!.longitude));
        });
        _onSearchChanged();
      }
    }
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

      if (_currentPosition != null) {
        _filteredCustomers.sort((a, b) {
          final hasLocA = a.latitude != null && a.longitude != null && a.latitude != 0 && a.longitude != 0;
          final hasLocB = b.latitude != null && b.longitude != null && b.latitude != 0 && b.longitude != 0;
          
          if (!hasLocA && !hasLocB) return 0;
          if (!hasLocA) return 1; // Send shops without location to the bottom
          if (!hasLocB) return -1;

          final distA = Geolocator.distanceBetween(
            _currentPosition!.latitude, _currentPosition!.longitude,
            a.latitude!, a.longitude!
          );
          final distB = Geolocator.distanceBetween(
            _currentPosition!.latitude, _currentPosition!.longitude,
            b.latitude!, b.longitude!
          );
          return distA.compareTo(distB);
        });
      }
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
        initials = customer.name.substring(0, customer.name.length >= 2 ? 2 : 1).toUpperCase();
      }
    }

    return CircleAvatar(
      backgroundColor: Colors.blueAccent.withOpacity(0.2),
      foregroundColor: Colors.blueAccent,
      child: Text(initials, style: const TextStyle(fontWeight: FontWeight.bold)),
    );
  }

  String? _getDistanceString(Customer customer) {
    if (_currentPosition == null) return null;
    if (customer.latitude == null || customer.longitude == null || customer.latitude == 0 || customer.longitude == 0) return null;

    final distanceMeters = Geolocator.distanceBetween(
      _currentPosition!.latitude, 
      _currentPosition!.longitude,
      customer.latitude!, 
      customer.longitude!
    );

    if (distanceMeters < 1000) {
      return '${distanceMeters.toStringAsFixed(0)} m away';
    } else {
      return '${(distanceMeters / 1000).toStringAsFixed(1)} km away';
    }
  }

  String _formatDateToMinutes(String dateStr) {
    if (dateStr.length >= 16) {
      return dateStr.substring(0, 16);
    }
    return dateStr;
  }



  Future<void> _onCustomerSelected(Customer customer) async {
    final enforceVisit = await ApiService().getEnforceVisitBeforeSale();
    if (enforceVisit) {
      _showVisitDialog(customer);
    } else {
      if (widget.isReturnSelection) {
        _proceedToReturnCart(customer);
      } else {
        _proceedToCart(customer);
      }
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
          isReturnMode: false,
        ),
      ),
    );
  }

  void _proceedToReturnCart(Customer customer) {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => CartScreen(
          customer: customer,
          orderType: widget.orderType,
          tableId: widget.tableId,
          stewardId: widget.stewardId,
          isReturnMode: true,
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
            const SizedBox(height: 8),
            
            // --- NEW: Inline Visit History ---
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blueAccent.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blueAccent.withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.history, size: 16, color: Colors.blueAccent),
                      SizedBox(width: 6),
                      Text('Recent Visits', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blueAccent)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  FutureBuilder<List<Map<String, dynamic>>>(
                    future: ApiService().fetchVisitHistory(customer.id),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(child: Padding(padding: EdgeInsets.all(8.0), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))));
                      }
                      if (snapshot.hasError || !snapshot.hasData || snapshot.data!.isEmpty) {
                        return const Text('No recent visits recorded.', style: TextStyle(color: Colors.grey, fontSize: 12));
                      }
                      final visits = snapshot.data!.take(3).toList(); // Show top 3
                      return Column(
                        children: visits.map((v) {
                          final isSale = v['visit_type'] == 'SALE';
                          final dateStr = _formatDateToMinutes((v['created_at'] ?? '').toString());
                          final reason = v['reason'] ?? 'N/A';
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 6.0),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(
                                  isSale ? Icons.shopping_bag : Icons.cancel_presentation,
                                  color: isSale ? Colors.green : Colors.red,
                                  size: 14,
                                ),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    '$dateStr - $reason',
                                    style: const TextStyle(fontSize: 12),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // ---------------------------------

            const Text('A physical visit is required before creating an order. You can either use GPS to verify your location or scan the shop\'s QR code.', style: TextStyle(color: Colors.grey, fontSize: 13)),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                _handleCheckIn(customer, widget.isReturnSelection ? 'RETURN' : 'SALE', widget.isReturnSelection ? 'Start Return' : 'Start Order');
              },
              icon: Icon(widget.isReturnSelection ? Icons.keyboard_return : Icons.shopping_cart, color: Colors.white),
              label: Text(widget.isReturnSelection ? 'Start Return (50m)' : 'Start Order (50m)', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(backgroundColor: widget.isReturnSelection ? Colors.redAccent : Colors.green, padding: const EdgeInsets.symmetric(vertical: 12)),
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                _handleQRCheckIn(customer);
              },
              icon: const Icon(Icons.qr_code_scanner, color: Colors.white),
              label: const Text('Scan Shop QR to Check In (1000m)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent, padding: const EdgeInsets.symmetric(vertical: 12)),
            ),
            const SizedBox(height: 8),
            if (!widget.isReturnSelection) ...[
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
          ],
        ),
      ),
    );
  }

  Future<void> _handleCheckIn(Customer customer, String type, String reason) async {
    if (mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          content: Row(
            children: const [
              CircularProgressIndicator(),
              SizedBox(width: 20),
              Text('Logging...'),
            ],
          ),
        ),
      );
    }

    // Helper to close dialog safely
    void closeLoadingDialog() {
      if (mounted && Navigator.canPop(context)) {
        Navigator.pop(context);
      }
    }

    // 1. Check permissions
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      closeLoadingDialog();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Location services are disabled.')));
      return;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        closeLoadingDialog();
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Location permissions are denied')));
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      closeLoadingDialog();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Location permissions are permanently denied, we cannot request permissions.')));
      return;
    }

    // 2. Get current position with timeout
    Position? position;
    try {
      LocationSettings locationSettings;
      if (Platform.isAndroid) {
        locationSettings = AndroidSettings(
          accuracy: LocationAccuracy.high,
          forceLocationManager: true, // Forces true GPS, ignoring VPN/Network location
          timeLimit: const Duration(seconds: 15),
        );
      } else {
        locationSettings = const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        );
      }

      position = await Geolocator.getCurrentPosition(
        locationSettings: locationSettings,
      );
    } catch (e) {
      closeLoadingDialog();
      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('GPS Signal Weak'),
            content: const Text('Failed to get a precise GPS location in time. Please step outside or wait for a better signal and try again.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
            ],
          ),
        );
      }
      return;
    }

    // 3. Verify distance
    if (customer.latitude != null && customer.longitude != null && customer.latitude != 0) {
      double distanceInMeters = Geolocator.distanceBetween(
        position.latitude, position.longitude,
        customer.latitude!, customer.longitude!
      );

      if (distanceInMeters > 50) {
        closeLoadingDialog();
        if (mounted) {
          showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Location Error'),
              content: Text('You are too far from the shop (${distanceInMeters.toStringAsFixed(0)}m).\n\nMust be within 50m to check in. Please ensure you are physically at the shop.'),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
              ],
            ),
          );
        }
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

    closeLoadingDialog();

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
      if (type == 'SALE' || type == 'RETURN') {
        if (widget.isReturnSelection) {
          _proceedToReturnCart(customer);
        } else {
          _proceedToCart(customer);
        }
      }
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to log visit. Please try again.')));
    }
  }

  Future<void> _handleQRCheckIn(Customer customer) async {
    if (customer.latitude != null && customer.longitude != null && customer.latitude != 0 && _currentPosition != null) {
      double distanceInMeters = Geolocator.distanceBetween(
        _currentPosition!.latitude, _currentPosition!.longitude,
        customer.latitude!, customer.longitude!
      );

      if (distanceInMeters > 1000) {
        if (mounted) {
          showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Location Error'),
              content: Text('You are too far from the shop (${distanceInMeters.toStringAsFixed(0)}m).\n\nMust be within 1000m to use QR check-in.'),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
              ],
            ),
          );
        }
        return;
      }
    }

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
        'visit_type': widget.isReturnSelection ? 'RETURN' : 'SALE',
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
        if (widget.isReturnSelection) {
          _proceedToReturnCart(customer);
        } else {
          _proceedToCart(customer);
        }
      } else {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to log visit to server.')));
      }
    }
  }

  Future<void> _showVisitHistoryDialog(Customer customer) async {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Container(
            padding: const EdgeInsets.all(20),
            constraints: const BoxConstraints(maxHeight: 500),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        '${customer.name} - Visits',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const Divider(),
                Expanded(
                  child: FutureBuilder<List<Map<String, dynamic>>>(
                    future: ApiService().fetchVisitHistory(customer.id),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(
                          child: CircularProgressIndicator(color: Colors.blueAccent),
                        );
                      }
                      if (snapshot.hasError || snapshot.data == null) {
                        return const Center(child: Text('Failed to load visit history.'));
                      }
                      final visits = snapshot.data!;
                      if (visits.isEmpty) {
                        return const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.history_toggle_off, size: 48, color: Colors.grey),
                              SizedBox(height: 12),
                              Text('No visits recorded yet', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w500)),
                            ],
                          ),
                        );
                      }
                      return ListView.separated(
                        shrinkWrap: true,
                        itemCount: visits.length,
                        separatorBuilder: (context, index) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final v = visits[index];
                          final isSale = v['visit_type'] == 'SALE';
                          final dateStr = v['created_at'] ?? '';
                          final reason = v['reason'] ?? 'N/A';
                          final repName = v['user_name'] ?? 'Unknown Rep';
                          final lat = v['latitude'];
                          final lng = v['longitude'];

                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: isSale ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    isSale ? Icons.shopping_bag : Icons.cancel_presentation,
                                    color: isSale ? Colors.green : Colors.red,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            isSale ? 'Sale Visit' : 'No-Sale Visit',
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              color: isSale ? Colors.green : Colors.red,
                                            ),
                                          ),
                                          Text(
                                            dateStr.split(' ')[0],
                                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Reason: $reason',
                                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                                      ),
                                      Text(
                                        'Logged by: $repName',
                                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                                      ),
                                      if (lat != null && lng != null && double.tryParse(lat.toString()) != 0)
                                        Text(
                                          'GPS: ${double.tryParse(lat.toString())?.toStringAsFixed(4)}, ${double.tryParse(lng.toString())?.toStringAsFixed(4)}',
                                          style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: Colors.grey),
                                        ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _printQR(Customer customer) async {
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
      LocationSettings locationSettings;
      if (Platform.isAndroid) {
        locationSettings = AndroidSettings(
          accuracy: LocationAccuracy.high,
          forceLocationManager: true, // Forces true GPS, ignoring VPN/Network location
          timeLimit: const Duration(seconds: 15),
        );
      } else {
        locationSettings = const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        );
      }

      position = await Geolocator.getCurrentPosition(
        locationSettings: locationSettings,
      );
    } catch (e) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('GPS Signal Weak'),
            content: const Text('Failed to get a precise GPS location in time. Please step outside or wait for a better signal and try again.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
            ],
          ),
        );
      }
      return;
    }

    // 3. Verify distance
    if (customer.latitude != null && customer.longitude != null && customer.latitude != 0) {
      double distanceInMeters = Geolocator.distanceBetween(
        position.latitude, position.longitude,
        customer.latitude!, customer.longitude!
      );

      if (distanceInMeters > 50) {
        if (mounted) {
          showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Location Error'),
              content: Text('You are too far from the shop (${distanceInMeters.toStringAsFixed(0)}m).\n\nMust be within 50m to print. Please ensure you are physically at the shop.'),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
              ],
            ),
          );
        }
        return;
      }
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Warning: Customer has no saved GPS coordinates. Printing anyway.')));
    }

    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Printing QR...')));
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

    Customer? nextShop;
    try {
      nextShop = _filteredCustomers.firstWhere((c) => !_visitedCustomerIds.contains(c.id) && c.latitude != null && c.latitude != 0);
    } catch (_) {}

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
        if (_trackingPath.isNotEmpty)
          PolylineLayer(
            polylines: [
              Polyline(
                points: _trackingPath,
                color: Colors.blueAccent.withOpacity(0.7),
                strokeWidth: 4.0,
              ),
            ],
          ),
        MarkerLayer(
          markers: _filteredCustomers
              .where((c) => c.latitude != null && c.longitude != null && c.latitude != 0 && c.longitude != 0)
              .map((customer) {
            return Marker(
              point: LatLng(customer.latitude!, customer.longitude!),
              width: 120,
              height: 90,
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
                                    child: InkWell(
                                      onTap: () {
                                        Navigator.pop(ctx);
                                        _showVisitHistoryDialog(customer);
                                      },
                                      borderRadius: BorderRadius.circular(4),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(Icons.history, size: 12, color: Colors.blueAccent),
                                          const SizedBox(width: 4),
                                          Flexible(
                                            child: Text(
                                              _formatDateToMinutes(customer.lastVisitDate!),
                                              style: const TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w600,
                                                color: Colors.blueAccent,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.history, color: Colors.blueAccent),
                                  onPressed: () {
                                    Navigator.pop(ctx);
                                    _showVisitHistoryDialog(customer);
                                  },
                                ),
                                IconButton(
                                  icon: const Icon(Icons.print, color: Colors.blueAccent),
                                  onPressed: () => _printQR(customer),
                                ),
                              ],
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
                          ),
                        ],
                      ),
                    ),
                  );
                },
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _visitedCustomerIds.contains(customer.id) ? Icons.check_circle : Icons.location_on, 
                      color: customer.id == nextShop?.id ? Colors.orange : (_visitedCustomerIds.contains(customer.id) ? Colors.green : Colors.red), 
                      size: customer.id == nextShop?.id ? 50 : 30
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                      decoration: BoxDecoration(
                        color: customer.id == nextShop?.id ? Colors.orange : Colors.black.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        customer.id == nextShop?.id ? 'NEXT: ${customer.name}' : customer.name,
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
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
                              Expanded(
                                child: Text(
                                  customer.phone!, 
                                  style: TextStyle(fontSize: 12, color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7)),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      if (_getDistanceString(customer) != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Row(
                            children: [
                              Icon(Icons.location_on, size: 12, color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.5)),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  _getDistanceString(customer)!, 
                                  style: TextStyle(fontSize: 12, color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7)),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      if (customer.lastVisitDate != null && customer.lastVisitDate!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: InkWell(
                            onTap: () => _showVisitHistoryDialog(customer),
                            borderRadius: BorderRadius.circular(8),
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
                                  Flexible(
                                    child: Text(
                                      _formatDateToMinutes(customer.lastVisitDate!),
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.blueAccent,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.history, color: Colors.blueAccent),
                  tooltip: 'Visit History',
                  onPressed: () => _showVisitHistoryDialog(customer),
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
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Select Customer', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() => _isLoading = true);
              _fetchLocationAndSort();
              _loadCustomers(force: true);
            },
          ),
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
          if (_isLocating)
            const Padding(
              padding: EdgeInsets.only(bottom: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.blueAccent)),
                  SizedBox(width: 8),
                  Text('Calculating distances...', style: TextStyle(color: Colors.blueAccent, fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: InkWell(
                onTap: _fetchLocationAndSort,
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.my_location, size: 14, color: Colors.blueAccent),
                    SizedBox(width: 4),
                    Text('Recalculate Distances', style: TextStyle(color: Colors.blueAccent, fontSize: 12, fontWeight: FontWeight.bold)),
                  ],
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
    );
  }
}
