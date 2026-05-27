import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../services/db_service.dart';
import '../models/customer.dart';

class VisitMapScreen extends StatefulWidget {
  const VisitMapScreen({Key? key}) : super(key: key);

  @override
  State<VisitMapScreen> createState() => _VisitMapScreenState();
}

class _VisitMapScreenState extends State<VisitMapScreen> {
  final ApiService _apiService = ApiService();
  final DbService _dbService = DbService();
  
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now();
  
  bool _isLoading = false;
  List<LatLng> _trackingRoute = [];
  List<Marker> _customerMarkers = [];
  
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _selectDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: DateTimeRange(start: _startDate, end: _endDate),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).brightness == Brightness.dark 
              ? const ColorScheme.dark(primary: Colors.blueAccent)
              : const ColorScheme.light(primary: Colors.blue),
          ),
          child: child!,
        );
      },
    );
    
    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
      });
      _loadData();
    }
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    try {
      final startStr = DateFormat('yyyy-MM-dd').format(_startDate);
      final endStr = DateFormat('yyyy-MM-dd').format(_endDate);

      // 1. Fetch Tracking Logs
      final trackingData = await _apiService.fetchTrackingLogs(startDate: startStr, endDate: endStr);
      _trackingRoute = trackingData
          .map((e) => LatLng(double.parse(e['latitude'].toString()), double.parse(e['longitude'].toString())))
          .toList();

      // 2. Fetch Visited Customers
      final visitedIds = await _apiService.getVisitedCustomerIds(startDate: startStr, endDate: endStr);
      
      // 3. Fetch Invoices for this date range to get sales amounts
      final invoices = await _apiService.fetchInvoices(startDate: startStr, endDate: endStr);
      
      // Group invoices by customer_id to calculate total sales per customer in this range
      Map<int, double> salesByCustomer = {};
      for (var inv in invoices) {
        final cid = int.tryParse(inv['customer_id'].toString()) ?? 0;
        final total = double.tryParse(inv['grand_total'].toString()) ?? 0.0;
        if (cid > 0) {
          salesByCustomer[cid] = (salesByCustomer[cid] ?? 0.0) + total;
        }
      }

      // 4. Build Markers
      List<Customer> localCustomers = await _dbService.getCustomers();
      _customerMarkers = [];
      
      for (var cid in visitedIds) {
        try {
          final cust = localCustomers.firstWhere((c) => c.id == cid);
          if (cust.latitude != null && cust.longitude != null) {
            double lat = double.parse(cust.latitude!);
            double lng = double.parse(cust.longitude!);
            
            final saleAmount = salesByCustomer[cid] ?? 0.0;
            final bool hasSale = saleAmount > 0;
            
            _customerMarkers.add(
              Marker(
                point: LatLng(lat, lng),
                width: hasSale ? 100 : 40,
                height: hasSale ? 50 : 40,
                child: hasSale 
                  ? Container(
                      decoration: BoxDecoration(
                        color: Colors.green.shade600,
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0,2))],
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.store, color: Colors.white, size: 16),
                          Text(
                            'Rs.${saleAmount.toStringAsFixed(0)}',
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                            overflow: TextOverflow.ellipsis,
                          )
                        ],
                      ),
                    )
                  : const Icon(Icons.location_on, color: Colors.blueAccent, size: 40),
              ),
            );
          }
        } catch (e) {
          // Customer not found in local db, ignore
        }
      }

      // If we have route data or markers, try to center the map
      if (_trackingRoute.isNotEmpty || _customerMarkers.isNotEmpty) {
        _fitMapBounds();
      }

    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading map data: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
  
  void _fitMapBounds() {
    if (_trackingRoute.isEmpty && _customerMarkers.isEmpty) return;
    
    double minLat = 90.0, maxLat = -90.0, minLng = 180.0, maxLng = -180.0;
    
    for (var p in _trackingRoute) {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    }
    for (var m in _customerMarkers) {
      if (m.point.latitude < minLat) minLat = m.point.latitude;
      if (m.point.latitude > maxLat) maxLat = m.point.latitude;
      if (m.point.longitude < minLng) minLng = m.point.longitude;
      if (m.point.longitude > maxLng) maxLng = m.point.longitude;
    }
    
    if (minLat == 90.0) return; // No points

    // Add padding
    final latPadding = (maxLat - minLat) * 0.1;
    final lngPadding = (maxLng - minLng) * 0.1;
    
    final bounds = LatLngBounds(
      LatLng(minLat - latPadding, minLng - lngPadding),
      LatLng(maxLat + latPadding, maxLng + lngPadding),
    );

    // Call fitBounds after build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      try {
        _mapController.fitCamera(CameraFit.bounds(bounds: bounds, padding: const EdgeInsets.all(50)));
      } catch (e) {
        // Ignored
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    final dateFmt = DateFormat('MMM dd, yyyy');
    final dateStr = _startDate.isAtSameMomentAs(_endDate) 
        ? dateFmt.format(_startDate)
        : '${dateFmt.format(_startDate)} - ${dateFmt.format(_endDate)}';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Visit & Tracking Map', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.date_range),
            onPressed: _selectDateRange,
            tooltip: 'Select Date Range',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: const LatLng(6.9271, 79.8612), // Colombo default
              initialZoom: 12.0,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.bizflow.app',
                tileBuilder: (context, widget, tile) {
                  return isDark 
                    ? ColorFiltered(
                        colorFilter: const ColorFilter.matrix([
                          -1, 0, 0, 0, 255,
                          0, -1, 0, 0, 255,
                          0, 0, -1, 0, 255,
                          0, 0, 0, 1, 0,
                        ]),
                        child: widget,
                      )
                    : widget;
                },
              ),
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: _trackingRoute,
                    strokeWidth: 4.0,
                    color: Colors.blueAccent.withOpacity(0.8),
                  ),
                ],
              ),
              MarkerLayer(
                markers: _customerMarkers,
              ),
            ],
          ),
          
          // Date Range Overlay
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Center(
              child: InkWell(
                onTap: _selectDateRange,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.grey[900]?.withOpacity(0.9) : Colors.white.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 8, offset: Offset(0,2))],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.calendar_month, size: 16, color: theme.colorScheme.primary),
                      const SizedBox(width: 8),
                      Text(
                        dateStr, 
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(),
            ),
        ],
      ),
    );
  }
}
