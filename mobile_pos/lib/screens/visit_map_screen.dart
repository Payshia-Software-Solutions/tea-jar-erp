import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:intl/intl.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';
import '../services/db_service.dart';
import '../models/customer.dart';

class VisitMapScreen extends StatefulWidget {
  const VisitMapScreen({Key? key}) : super(key: key);

  @override
  State<VisitMapScreen> createState() => _VisitMapScreenState();
}

class TimelineEvent {
  final DateTime time;
  final String title;
  final String? subtitle;
  final IconData icon;
  final Color iconColor;

  TimelineEvent({
    required this.time,
    required this.title,
    this.subtitle,
    required this.icon,
    required this.iconColor,
  });
}

class _VisitMapScreenState extends State<VisitMapScreen> {
  final ApiService _apiService = ApiService();
  final DbService _dbService = DbService();
  
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now();
  
  bool _isLoading = false;
  List<LatLng> _rawTrackingPoints = [];
  List<LatLng> _trackingRoute = [];
  List<List<LatLng>> _trackingRouteSegments = [];
  List<Marker> _customerMarkers = [];
  List<TimelineEvent> _timelineEvents = [];
  
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

  Future<List<LatLng>> _getRoadSnappedRoute(List<LatLng> rawPoints) async {
    if (rawPoints.length < 2) return rawPoints;
    
    List<LatLng> snappedPoints = [];
    const int chunkSize = 50; // OSRM handles up to 100 well, 50 is safe
    
    for (int i = 0; i < rawPoints.length - 1; i += (chunkSize - 1)) {
      int end = i + chunkSize;
      if (end > rawPoints.length) end = rawPoints.length;
      
      final chunk = rawPoints.sublist(i, end);
      final coordsStr = chunk.map((p) => '${p.longitude},${p.latitude}').join(';');
      
      final url = Uri.parse('http://router.project-osrm.org/route/v1/driving/$coordsStr?overview=full&geometries=geojson');
      try {
        final response = await http.get(url).timeout(const Duration(seconds: 15));
        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          if (data['code'] == 'Ok' && data['routes'] != null && data['routes'].isNotEmpty) {
            final coords = data['routes'][0]['geometry']['coordinates'] as List;
            for (var c in coords) {
              snappedPoints.add(LatLng((c[1] as num).toDouble(), (c[0] as num).toDouble()));
            }
          } else {
            snappedPoints.addAll(chunk);
          }
        } else {
          snappedPoints.addAll(chunk);
        }
      } catch (e) {
        snappedPoints.addAll(chunk);
      }
    }
    
    return snappedPoints;
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    try {
      final startStr = DateFormat('yyyy-MM-dd').format(_startDate);
      final endStr = DateFormat('yyyy-MM-dd').format(_endDate);

      // 1. Fetch Tracking Logs
      final trackingData = await _apiService.fetchTrackingLogs(startDate: startStr, endDate: endStr);
      final rawRoute = trackingData
          .map((e) => LatLng(double.parse(e['latitude'].toString()), double.parse(e['longitude'].toString())))
          .toList();
          
      _rawTrackingPoints = rawRoute;
          
      // Split into segments to avoid connecting distant jumps
      final Distance distance = const Distance();
      List<List<LatLng>> segments = [];
      List<LatLng> currentSegment = [];
      for (var point in rawRoute) {
        if (currentSegment.isEmpty) {
          currentSegment.add(point);
        } else {
          final lastPoint = currentSegment.last;
          final dist = distance.as(LengthUnit.Meter, lastPoint, point);
          if (dist > 1000) { // Break if > 1km gap
            segments.add(currentSegment);
            currentSegment = [point];
          } else {
            currentSegment.add(point);
          }
        }
      }
      if (currentSegment.isNotEmpty) {
        segments.add(currentSegment);
      }

      _trackingRouteSegments = [];
      _trackingRoute = [];
      for (var seg in segments) {
         final snapped = await _getRoadSnappedRoute(seg);
         _trackingRouteSegments.add(snapped);
         _trackingRoute.addAll(snapped); // Flat list for bounds fitting
      }

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
      List<Customer> localCustomers = (await _dbService.getCachedCustomers()).map((c) => Customer.fromJson(c as Map<String, dynamic>)).toList();
      _customerMarkers = [];
      
      for (var cid in visitedIds) {
        try {
          final cust = localCustomers.firstWhere((c) => c.id == cid);
          if (cust.latitude != null && cust.longitude != null) {
            double lat = cust.latitude!;
            double lng = cust.longitude!;
            
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

      // 5. Build Timeline Events
      List<TimelineEvent> events = [];
      for (var log in trackingData) {
         if (log['app_time'] != null || log['created_at'] != null) {
           events.add(TimelineEvent(
             time: DateTime.parse((log['app_time'] ?? log['created_at']).toString()),
             title: 'Location Logged',
             subtitle: 'Lat: ${log['latitude']}, Lng: ${log['longitude']}',
             icon: Icons.my_location,
             iconColor: Colors.blueAccent,
           ));
         }
      }
      for (var inv in invoices) {
         if (inv['app_time'] != null || inv['created_at'] != null) {
           final double total = double.tryParse(inv['grand_total'].toString()) ?? 0.0;
           events.add(TimelineEvent(
             time: DateTime.parse((inv['app_time'] ?? inv['created_at']).toString()),
             title: 'Sale: ${inv['customer_name'] ?? 'Unknown'}',
             subtitle: 'Amount: Rs.${total.toStringAsFixed(2)}',
             icon: Icons.receipt_long,
             iconColor: Colors.green,
           ));
         }
      }
      events.sort((a, b) => b.time.compareTo(a.time)); // Newest first
      _timelineEvents = events;

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

    return DefaultTabController(
      length: 2,
      child: Scaffold(
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
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.map), text: "Map View"),
              Tab(icon: Icon(Icons.format_list_bulleted), text: "Timeline"),
            ],
          ),
        ),
        body: TabBarView(
          physics: const NeverScrollableScrollPhysics(), // Map can conflict with swipes
          children: [
            // MAP TAB
            Stack(
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
                polylines: _trackingRouteSegments.map((segment) => Polyline(
                  points: segment,
                  strokeWidth: 4.0,
                  color: Colors.blueAccent.withOpacity(0.8),
                )).toList(),
              ),
              CircleLayer(
                circles: _rawTrackingPoints.map((point) => CircleMarker(
                  point: point,
                  radius: 4,
                  color: Colors.redAccent,
                  borderColor: Colors.white,
                  borderStrokeWidth: 1.5,
                )).toList(),
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
          
          // TIMELINE TAB
          _isLoading 
            ? const Center(child: CircularProgressIndicator())
            : _timelineEvents.isEmpty 
              ? const Center(child: Text("No tracking or sale data for this period."))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _timelineEvents.length,
                  itemBuilder: (context, index) {
                    final event = _timelineEvents[index];
                    return IntrinsicHeight(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Left Time
                          Container(
                            width: 65,
                            alignment: Alignment.topLeft,
                            padding: const EdgeInsets.only(top: 14),
                            child: Text(
                              DateFormat('hh:mm a\nMMM dd').format(event.time),
                              style: const TextStyle(fontSize: 10, color: Colors.grey),
                              textAlign: TextAlign.right,
                            ),
                          ),
                          const SizedBox(width: 12),
                          // Middle Line & Dot
                          Column(
                            children: [
                              Container(
                                margin: const EdgeInsets.only(top: 16),
                                width: 12,
                                height: 12,
                                decoration: BoxDecoration(
                                  color: event.iconColor,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 2),
                                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 2)],
                                ),
                              ),
                              if (index != _timelineEvents.length - 1)
                                Expanded(
                                  child: Container(
                                    width: 2,
                                    color: Colors.grey[300],
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(width: 12),
                          // Right Content
                          Expanded(
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 16, top: 4),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isDark ? Colors.grey[900] : Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(event.icon, size: 16, color: event.iconColor),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          event.title, 
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (event.subtitle != null) ...[
                                    const SizedBox(height: 6),
                                    Text(
                                      event.subtitle!, 
                                      style: TextStyle(fontSize: 11, color: isDark ? Colors.grey[400] : Colors.grey[700]),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ],
      ),
    ),
  );
  }
}
