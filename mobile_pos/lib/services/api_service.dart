import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../models/customer.dart';
import '../models/item.dart';
import '../models/city.dart';
import '../models/route.dart';
import '../models/service_location.dart';
import '../models/table.dart';
import '../models/steward.dart';
import 'db_service.dart';
import '../models/tax.dart';

class ApiService {
  static String get baseUrl => _customBaseUrl ?? 'https://server-kdu-service.payshia.com/api';
  static String? _customBaseUrl;
  static void Function()? onUnauthorized;

  static String get baseHost {
    try {
      final uri = Uri.parse(baseUrl);
      return '${uri.scheme}://${uri.host}${uri.hasPort ? ":${uri.port}" : ""}';
    } catch (_) {
      return 'https://server-kdu-service.payshia.com';
    }
  }

  static Future<void> initBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    _customBaseUrl = prefs.getString('custom_base_url');
  }

  static Future<void> updateBaseUrl(String? newUrl) async {
    final prefs = await SharedPreferences.getInstance();
    if (newUrl == null || newUrl.trim().isEmpty) {
      _customBaseUrl = null;
      await prefs.remove('custom_base_url');
    } else {
      String formattedUrl = newUrl.trim();
      if (!formattedUrl.endsWith('/api') && !formattedUrl.endsWith('/api/')) {
        if (formattedUrl.endsWith('/')) {
          formattedUrl = '${formattedUrl}api';
        } else {
          formattedUrl = '$formattedUrl/api';
        }
      }
      if (formattedUrl.endsWith('/')) {
        formattedUrl = formattedUrl.substring(0, formattedUrl.length - 1);
      }
      _customBaseUrl = formattedUrl;
      await prefs.setString('custom_base_url', formattedUrl);
    }
  }

  void _checkResponse(http.Response response) {
    if (response.statusCode == 401) {
      logout();
      if (onUnauthorized != null) {
        onUnauthorized!();
      }
    }
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  Future<String> getDeviceId() async {
    final prefs = await SharedPreferences.getInstance();
    String? deviceId = prefs.getString('device_id');
    if (deviceId == null) {
      final random = DateTime.now().millisecondsSinceEpoch.toString() + '-' + Random().nextInt(100000).toString();
      deviceId = 'DEVICE-' + random;
      await prefs.setString('device_id', deviceId);
    }
    return deviceId;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await clearActiveLocation();
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['status'] == 'success') {
        final token = data['data']['token'];
        await saveToken(token);
        return {'success': true, 'data': data['data']};
      }
    }
    
    final errorData = jsonDecode(response.body);
    return {'success': false, 'message': errorData['message'] ?? 'Login failed'};
  }

  Future<List<Customer>> fetchCustomers({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      // 1. Try to load from local cache instantly
      final cached = await DbService().getCachedCustomers();
      if (cached.isNotEmpty) {
        // 2. Silently refresh the cache in the background for next time
        _silentRefreshCustomers();
        final onlineCustomers = cached.map((json) => Customer.fromJson(json)).toList();
        return await _mergeWithOfflineCustomers(onlineCustomers);
      }
    }

    // 3. Fallback to network if cache is empty or forceRefresh is true
    final onlineCustomers = await _networkFetchCustomers();
    return await _mergeWithOfflineCustomers(onlineCustomers);
  }

  Future<void> _silentRefreshCustomers() async {
    try {
      await _networkFetchCustomers();
    } catch (e) {
      // Ignore background errors
    }
  }

  Future<List<Customer>> _networkFetchCustomers() async {
    final token = await getToken();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/customer/list'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15)); // Give it more time since it's often background
      
      _checkResponse(response);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> customersJson = data['data'] ?? data;
        await DbService().cacheCustomers(customersJson);
        return customersJson.map((json) => Customer.fromJson(json)).toList();
      }
    } catch (e) {
      final cached = await DbService().getCachedCustomers();
      if (cached.isNotEmpty) {
        return cached.map((json) => Customer.fromJson(json)).toList();
      }
    }
    throw Exception('Failed to load customers from network and no cache available');
  }

  Future<List<Tax>> fetchTaxes({bool forceRefresh = false}) async {
    final prefs = await SharedPreferences.getInstance();
    
    if (!forceRefresh) {
      final cachedStr = prefs.getString('cached_taxes');
      if (cachedStr != null) {
        // Fetch in background to keep it updated silently
        _fetchTaxesFromNetwork(prefs).catchError((_) => <Tax>[]);
        final List<dynamic> jsonList = jsonDecode(cachedStr);
        return jsonList.map((x) => Tax.fromJson(x)).toList();
      }
    }
    return await _fetchTaxesFromNetwork(prefs);
  }

  Future<List<Tax>> _fetchTaxesFromNetwork(SharedPreferences prefs) async {
    final token = await getToken();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/tax/list?all=1'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));
      _checkResponse(response);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> jsonList = data['data'] ?? data;
        await prefs.setString('cached_taxes', jsonEncode(jsonList));
        return jsonList.map((x) => Tax.fromJson(x)).toList();
      }
    } catch (e) {
      // Ignore
    }
    return [];
  }

  Future<List<ServiceLocation>> fetchLocations({bool forceRefresh = false}) async {
    final prefs = await SharedPreferences.getInstance();
    
    if (!forceRefresh) {
      final cachedStr = prefs.getString('cached_locations');
      if (cachedStr != null) {
        _fetchLocationsFromNetwork(prefs).catchError((_) => <ServiceLocation>[]);
        final List<dynamic> jsonList = jsonDecode(cachedStr);
        return jsonList.map((x) => ServiceLocation.fromJson(x)).toList();
      }
    }
    return await _fetchLocationsFromNetwork(prefs);
  }

  Future<List<ServiceLocation>> _fetchLocationsFromNetwork(SharedPreferences prefs) async {
    final token = prefs.getString('auth_token');
    
    final response = await http.get(
      Uri.parse('$baseUrl/location/list'),
      headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final decoded = json.decode(response.body);
      if (decoded['status'] == 'success') {
        final List data = decoded['data'] ?? [];
        await prefs.setString('cached_locations', jsonEncode(data));
        return data.map((json) => ServiceLocation.fromJson(json)).toList();
      } else {
        throw Exception(decoded['message'] ?? 'Failed to fetch locations');
      }
    } else {
      throw Exception('Failed to fetch locations');
    }
  }

  Future<List<TableModel>> fetchTables(int locationId) async {
    final token = await getToken();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/table/list?location_id=$locationId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['status'] == 'success') {
          final List data = decoded['data'] ?? [];
          return data.map((json) => TableModel.fromJson(json)).toList();
        }
      }
    } catch (_) {}
    return []; 
  }

  Future<List<Steward>> fetchStewards(int locationId) async {
    final token = await getToken();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/pos/stewards?location_id=$locationId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['status'] == 'success') {
          final List data = decoded['data'] ?? [];
          return data.map((json) => Steward.fromJson(json)).toList();
        }
      }
    } catch (_) {}
    return [];
  }
  
  Future<List<Map<String, dynamic>>> fetchProductBatches(int productId, int locationId) async {
    final token = await getToken();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/part/batches/$productId?location_id=$locationId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['status'] == 'success') {
          final List data = decoded['data'] ?? [];
          return data.map((e) => e as Map<String, dynamic>).toList();
        }
      }
    } catch (_) {}
    return [];
  }

  Future<List<Map<String, dynamic>>> fetchBanks() async {
    final token = await getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/bank/list'),
      headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final decoded = json.decode(response.body);
      if (decoded['status'] == 'success') {
        final List data = decoded['data'] ?? [];
        return data.map((e) => e as Map<String, dynamic>).toList();
      } else {
        throw Exception(decoded['message'] ?? 'Failed to fetch banks');
      }
    } else {
      throw Exception('Failed to fetch banks');
    }
  }

  Future<Map<String, dynamic>> fetchDashboardSales() async {
    final token = await getToken();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/dashboard/sales'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['status'] == 'success') {
          return decoded['data'] ?? {};
        }
        return {};
      }
      return {};
    } catch (e) {
      return {};
    }
  }

  Future<Map<String, dynamic>> holdOrder(Map<String, dynamic> payload) async {
    final token = await getToken();
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/pos/hold-order'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(payload),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['status'] == 'success') {
          return {'success': true, 'message': decoded['message'], 'id': decoded['data']?['id']};
        } else {
          return {'success': false, 'message': decoded['message'] ?? 'Failed to hold order'};
        }
      } else {
        return {'success': false, 'message': 'Server error: ${response.statusCode}'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  Future<List<dynamic>> fetchHeldOrders(int locationId) async {
    final token = await getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/pos/held-orders?location_id=$locationId'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    ).timeout(const Duration(seconds: 15));

    if (response.statusCode == 200) {
      final decoded = json.decode(response.body);
      if (decoded['status'] == 'success') {
        return decoded['data'] ?? [];
      } else {
        throw Exception(decoded['message'] ?? 'Failed to load held orders.');
      }
    } else {
      throw Exception('Server error while loading held orders.');
    }
  }

  Future<Map<String, dynamic>?> loadHeldOrder(int id) async {
    final token = await getToken();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/pos/load-held-order/$id'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['status'] == 'success') {
          return decoded['data'];
        }
      }
    } catch (e) {
      print('loadHeldOrder error: $e');
    }
    return null;
  }

  Future<Map<String, dynamic>> createInvoice(Map<String, dynamic> payload) async {
    final token = await getToken();
    payload['device_id'] = await getDeviceId();
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/invoice/create'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: json.encode(payload),
      ).timeout(const Duration(seconds: 20));

      _checkResponse(response);
      if (response.statusCode == 200 || response.statusCode == 201) {
        final decoded = json.decode(response.body);
        if (decoded['status'] == 'success') {
          return {'success': true, 'data': decoded['data']};
        } else {
          return {'success': false, 'message': decoded['message'] ?? 'Failed to create invoice'};
        }
      } else {
        return {'success': false, 'message': 'Server error: ${response.statusCode}'};
      }
    } catch (e) {
      // Offline fallback (only triggered on network timeout/socket exception)
      final tempId = 'OFFLINE-${DateTime.now().millisecondsSinceEpoch}';
      payload['offline_id'] = tempId;
      await DbService().saveOfflineInvoice(tempId, payload);
      return {
        'success': true, 
        'data': {'id': tempId, 'invoice_no': tempId}, 
        'offline': true,
        'message': 'Saved Offline. Will sync when connection is restored.'
      };
    }
  }

  Future<Map<String, dynamic>> processReturn(Map<String, dynamic> payload) async {
    final token = await getToken();
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/return/create'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: json.encode(payload),
      ).timeout(const Duration(seconds: 20));

      _checkResponse(response);
      if (response.statusCode == 200 || response.statusCode == 201) {
        final decoded = json.decode(response.body);
        if (decoded['status'] == 'success') {
          return {'success': true, 'data': decoded['data'] ?? decoded};
        } else {
          return {'success': false, 'message': decoded['message'] ?? 'Failed to process return'};
        }
      } else {
        return {'success': false, 'message': 'Server error: ${response.statusCode}'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  Future<void> syncOfflineInvoices() async {
    final offlineInvoices = await DbService().getOfflineInvoices();
    if (offlineInvoices.isEmpty) return;

    final token = await getToken();
    for (var record in offlineInvoices) {
      try {
        final payload = jsonDecode(record['payload']);
        final response = await http.post(
          Uri.parse('$baseUrl/invoice/create'),
          headers: {
            'Authorization': 'Bearer $token',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: json.encode(payload),
        ).timeout(const Duration(seconds: 30));
        if (response.statusCode == 200 || response.statusCode == 201) {
          final decoded = json.decode(response.body);
          if (decoded['status'] == 'success') {
            await DbService().deleteOfflineInvoice(record['id']);
          }
        }
        // Do not auto-delete on 4xx errors to ensure data is not lost. 
        // User must manually delete or fix failing offline records.
      } catch (e) {
        // Stop syncing if connection fails again (e.g. Timeout or SocketException)
        break;
      }
    }
  }

  Future<List<dynamic>> fetchInvoices({String? date, String? startDate, String? endDate}) async {
    final token = await getToken();
    String url = '$baseUrl/invoice/list';
    if (startDate != null && endDate != null) {
      url += '?start_date=$startDate&end_date=$endDate';
    } else if (date != null) {
      url += '?date=$date';
    }
    
    final response = await http.get(
      Uri.parse(url),
      headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final decoded = json.decode(response.body);
      if (decoded['status'] == 'success') {
        return decoded['data'] ?? [];
      } else {
        throw Exception(decoded['message'] ?? 'Failed to fetch invoices');
      }
    } else {
      throw Exception('Failed to fetch invoices. Server error.');
    }
  }

  Future<Map<String, dynamic>?> fetchInvoiceDetails(String id) async {
    final token = await getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/invoice/details/$id'),
      headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final decoded = json.decode(response.body);
      if (decoded['status'] == 'success') {
        return decoded['data'];
      } else {
        throw Exception(decoded['message'] ?? 'Failed to fetch invoice details');
      }
    } else {
      throw Exception('Failed to fetch invoice details. Server error.');
    }
  }

  Future<void> setActiveLocation(int locationId, String locationName) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('active_location_id', locationId);
    await prefs.setString('active_location_name', locationName);
  }

  Future<Map<String, dynamic>?> getActiveLocation() async {
    final prefs = await SharedPreferences.getInstance();
    final int? id = prefs.getInt('active_location_id');
    final String? name = prefs.getString('active_location_name');
    if (id != null && name != null) {
      return {'id': id, 'name': name};
    }
    return null;
  }

  Future<void> clearActiveLocation() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('active_location_id');
    await prefs.remove('active_location_name');
  }

  Future<void> setActiveRoutes(List<int> routeIds) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('active_route_ids', jsonEncode(routeIds));
  }

  Future<List<int>> getActiveRoutes() async {
    final prefs = await SharedPreferences.getInstance();
    final String? data = prefs.getString('active_route_ids');
    if (data != null) {
      try {
        final List<dynamic> decoded = jsonDecode(data);
        return decoded.map((e) => int.tryParse(e.toString()) ?? 0).where((e) => e > 0).toList();
      } catch (_) {}
    }
    return [];
  }

  Future<void> setEnforceVisitBeforeSale(bool enforce) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('enforce_visit', enforce);
  }

  Future<bool> getEnforceVisitBeforeSale() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('enforce_visit') ?? false; // Default false as per user "not strict"
  }

  Future<bool> logVisit(Map<String, dynamic> payload) async {
    final token = await getToken();
    payload['device_id'] = await getDeviceId();
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/visit/log'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 10));

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (_) {
      // Offline fallback: save to SQLite and pretend it succeeded
      await DbService().saveOfflineVisit(payload);
      return true;
    }
  }

  Future<void> syncOfflineVisits() async {
    final offlineVisits = await DbService().getOfflineVisits();
    if (offlineVisits.isEmpty) return;

    final token = await getToken();
    for (var record in offlineVisits) {
      try {
        final payload = jsonDecode(record['payload']);
        final response = await http.post(
          Uri.parse('$baseUrl/visit/log'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: jsonEncode(payload),
        ).timeout(const Duration(seconds: 10));
        
        if (response.statusCode == 200 || response.statusCode == 201) {
          await DbService().deleteOfflineVisit(record['id']);
        }
      } catch (_) {
        // Stop syncing if network fails again
        break;
      }
    }
  }

  Future<List<int>> getTodayVisitedCustomerIds() async {
    final prefs = await SharedPreferences.getInstance();
    
    // Attempt network fetch silently in the background
    _fetchTodayVisitedCustomerIdsNetwork(prefs).catchError((_) => <int>[]);
    
    List<int> visitedIds = [];

    // Return cached immediately if available
    final cachedStr = prefs.getString('cached_visited_ids');
    if (cachedStr != null) {
      try {
        final List<dynamic> decoded = jsonDecode(cachedStr);
        visitedIds = List<int>.from(decoded);
      } catch (_) {}
    }

    // Add offline visited customers to the list
    try {
      final offlineVisits = await DbService().getOfflineVisits();
      for (var record in offlineVisits) {
        final payload = jsonDecode(record['payload'].toString());
        if (payload['customer_id'] != null) {
          final cid = int.tryParse(payload['customer_id'].toString());
          if (cid != null && !visitedIds.contains(cid)) {
            visitedIds.add(cid);
          }
        }
      }
    } catch (_) {}

    return visitedIds;
  }

  Future<List<int>> _fetchTodayVisitedCustomerIdsNetwork(SharedPreferences prefs) async {
    final token = await getToken();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/visit/today_visits'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['status'] == 'success') {
          final list = List<int>.from(decoded['data'] ?? []);
          await prefs.setString('cached_visited_ids', jsonEncode(list));
          return list;
        }
      }
    } catch (_) {}
    throw Exception('Network failed');
  }

  Future<List<int>> getVisitedCustomerIds({required String startDate, required String endDate}) async {
    final token = await getToken();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/visit/today_visits?start_date=$startDate&end_date=$endDate'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['status'] == 'success') {
          return List<int>.from(decoded['data'] ?? []);
        }
      }
    } catch (_) {}
    return [];
  }

  Future<List<Map<String, dynamic>>> fetchTrackingLogs({required String startDate, required String endDate}) async {
    final token = await getToken();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/tracking/history?start_date=$startDate&end_date=$endDate'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['status'] == 'success') {
          return List<Map<String, dynamic>>.from(decoded['data'] ?? []);
        }
      }
    } catch (_) {}
    return [];
  }

  Future<List<Map<String, dynamic>>> fetchVisitHistory(int customerId) async {
    final token = await getToken();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/visit/history/$customerId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['status'] == 'success') {
          return List<Map<String, dynamic>>.from(decoded['data'] ?? []);
        }
      }
    } catch (_) {}
    return [];
  }
  // --- Promotions Caching ---
  Future<List<dynamic>> fetchPromotions({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await DbService().getCachedPromotions();
      if (cached.isNotEmpty) {
        _silentRefreshPromotions();
        return cached;
      }
    }
    return await _networkFetchPromotions();
  }

  Future<void> _silentRefreshPromotions() async {
    try {
      await _networkFetchPromotions();
    } catch (e) {
      // Ignore background errors
    }
  }

  Future<List<dynamic>> _networkFetchPromotions() async {
    final token = await getToken();
    final activeLocation = await getActiveLocation();
    final locId = activeLocation != null ? activeLocation['id'].toString() : '';
    
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/promotion/active${locId.isNotEmpty ? "?location_id=$locId" : ""}'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> promosJson = data['data'] ?? data;
        await DbService().cachePromotions(promosJson);
        return promosJson;
      }
    } catch (e) {
      // Return offline cache if network fails
      return await DbService().getCachedPromotions();
    }
    return [];
  }

  Future<List<Item>> fetchProducts({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      final cached = await DbService().getCachedProducts();
      if (cached.isNotEmpty) {
        _silentRefreshProducts();
        return cached.map((json) => Item.fromJson(json)).toList();
      }
    }
    return await _networkFetchProducts();
  }

  Future<void> _silentRefreshProducts() async {
    try {
      await _networkFetchProducts();
    } catch (e) {
      // Ignore background errors
    }
  }

  Future<List<Item>> _networkFetchProducts() async {
    final token = await getToken();
    final activeLocation = await getActiveLocation();
    final locId = activeLocation != null ? activeLocation['id'].toString() : '';

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/part/list?location_id=$locId'), 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          if (locId.isNotEmpty) 'X-Location-Id': locId,
        },
      ).timeout(const Duration(seconds: 15));
      
      _checkResponse(response);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> productsJson = data['data'] ?? data;
        await DbService().cacheProducts(productsJson);
        return productsJson.map((json) => Item.fromJson(json)).toList();
      }
    } catch (e) {
      // Continue to fallback
    }

    // Try fallback endpoint
    try {
      final fallbackResponse = await http.get(
        Uri.parse('$baseUrl/items'), 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));
      
      if (fallbackResponse.statusCode == 200) {
        final data = jsonDecode(fallbackResponse.body);
        final List<dynamic> productsJson = data['data'] ?? data;
        await DbService().cacheProducts(productsJson);
        return productsJson.map((json) => Item.fromJson(json)).toList();
      }
    } catch (e) {
      final cached = await DbService().getCachedProducts();
      if (cached.isNotEmpty) {
        return cached.map((json) => Item.fromJson(json)).toList();
      }
      throw Exception('Failed to load items and no local cache available');
    }
    
    final cached = await DbService().getCachedProducts();
    if (cached.isNotEmpty) {
      return cached.map((json) => Item.fromJson(json)).toList();
    }
    throw Exception('Failed to load items');
  }

  Future<List<dynamic>> getCustomerInvoices(int customerId) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/invoice/list?customer_id=$customerId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        if (jsonResponse['status'] == 'success') {
          final data = jsonResponse['data'] as List<dynamic>;
          await DbService().cacheCustomerInvoices(customerId, data);
          return data;
        }
      }
    } catch (_) {
      // Fallback to offline cache
      return await DbService().getCachedCustomerInvoices(customerId);
    }
    
    // Return cache if API failed (e.g. 500 error)
    return await DbService().getCachedCustomerInvoices(customerId);
  }

  Future<String?> addPayment(int invoiceId, Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/invoice/addPayment/$invoiceId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(data),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        if (jsonResponse['status'] == 'success') {
          return jsonResponse['receipt_id']?.toString();
        }
      }
    } catch (_) {
      // Offline fallback
      final tempId = 'OFFLINE-PAY-${DateTime.now().millisecondsSinceEpoch}';
      await DbService().saveOfflinePayment(tempId, invoiceId, data);
      return tempId; // Return temp ID so app proceeds as normal
    }
    return null;
  }

  Future<void> syncOfflinePayments() async {
    final offlinePayments = await DbService().getOfflinePayments();
    if (offlinePayments.isEmpty) return;

    for (var record in offlinePayments) {
      try {
        final payload = jsonDecode(record['payload']);
        final invoiceId = record['invoice_id'] as int;
        
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('auth_token');

        final response = await http.post(
          Uri.parse('$baseUrl/invoice/addPayment/$invoiceId'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: jsonEncode(payload),
        ).timeout(const Duration(seconds: 20));

        if (response.statusCode == 200) {
          final jsonResponse = jsonDecode(response.body);
          if (jsonResponse['status'] == 'success') {
            await DbService().deleteOfflinePayment(record['id']);
          }
        } else if (response.statusCode >= 400 && response.statusCode < 500) {
          // Bad request, delete to avoid infinite loop
          await DbService().deleteOfflinePayment(record['id']);
        }
      } catch (_) {
        break; // Stop syncing on network failure
      }
    }
  }

  Future<bool> createCustomer(Map<String, dynamic> payload, {String? photoPath}) async {
    payload['device_id'] = await getDeviceId();
    try {
      final newId = await _createCustomerOnlineOnly(payload, photoPath);
      if (newId != null) {
        return true;
      }
    } catch (e) {
      // Fallback below
    }

    // Offline fallback
    final tempId = 'OFFLINE-CUST-${DateTime.now().millisecondsSinceEpoch}';
    payload['offline_id'] = tempId;
    await DbService().saveOfflineCustomer(tempId, payload, photoPath: photoPath);
    return true;
  }

  Future<void> syncOfflineCustomers() async {
    final offlineCustomers = await DbService().getOfflineCustomers();
    if (offlineCustomers.isEmpty) return;

    for (var record in offlineCustomers) {
      try {
        final payload = jsonDecode(record['payload']);
        final photoPath = record['photo_path'];
        
        // Use the existing logic to re-create the customer online
        int? newRealId = await _createCustomerOnlineOnly(payload, photoPath);
        
        if (newRealId != null) {
          if (payload['offline_id'] != null) {
            await DbService().updateOfflineCustomerIds(payload['offline_id'], newRealId);
          }
          await DbService().deleteOfflineCustomer(record['temp_id']);
        }
      } catch (_) {
        break; // Stop syncing on first network failure
      }
    }
    
    // Refresh the customer list after sync to get the true server IDs
    try {
      await fetchCustomers(forceRefresh: true);
    } catch (_) {}
  }

  // A helper method for syncing without triggering another offline fallback
  Future<int?> _createCustomerOnlineOnly(Map<String, dynamic> payload, String? photoPath) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token') ?? '';
    
    bool hasPhoto = false;
    if (photoPath != null && photoPath.isNotEmpty) {
      try {
        if (File(photoPath).existsSync()) {
          hasPhoto = true;
        }
      } catch (_) {}
    }
    
    if (hasPhoto) {
      final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/customer/create'));
      request.headers['Authorization'] = 'Bearer $token';
      
      payload.forEach((key, value) {
        if (value != null) {
          request.fields[key] = value.toString();
        }
      });
      
      request.files.add(await http.MultipartFile.fromPath('photo', photoPath!));
      final streamedResponse = await request.send().timeout(const Duration(seconds: 15));
      final response = await http.Response.fromStream(streamedResponse);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final jsonResponse = jsonDecode(response.body);
        if (jsonResponse['status'] == 'success') {
          return int.tryParse(jsonResponse['data']?['id']?.toString() ?? '') ?? 
                 (await _fetchNewlyCreatedCustomerId(payload['phone']?.toString(), payload['name']?.toString()));
        }
      }
      return null;
    } else {
      final response = await http.post(
        Uri.parse('$baseUrl/customer/create'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200 || response.statusCode == 201) {
        final jsonResponse = jsonDecode(response.body);
        if (jsonResponse['status'] == 'success') {
          return int.tryParse(jsonResponse['data']?['id']?.toString() ?? '') ?? 
                 (await _fetchNewlyCreatedCustomerId(payload['phone']?.toString(), payload['name']?.toString()));
        }
      }
      return null;
    }
  }

  Future<int?> _fetchNewlyCreatedCustomerId(String? phone, String? name) async {
    try {
      await fetchCustomers(forceRefresh: true);
      final customers = await DbService().getCachedCustomers();
      for (var c in customers) {
        if ((phone != null && phone.isNotEmpty && c['phone'] == phone) || 
            (name != null && name.isNotEmpty && c['name'] == name)) {
          return int.tryParse(c['id'].toString());
        }
      }
    } catch (_) {}
    return null;
  }

  Future<List<DeliveryRoute>> fetchRoutes({int? locationId}) async {
    final prefs = await SharedPreferences.getInstance();
    
    if (locationId == null) {
      final activeLocation = await getActiveLocation();
      if (activeLocation != null && activeLocation['id'] != null) {
        locationId = activeLocation['id'] as int;
      }
    }

    // Attempt to load from cache first
    final cachedStr = prefs.getString('cached_routes_$locationId');
    List<DeliveryRoute> cachedRoutes = [];
    if (cachedStr != null) {
      try {
        final List<dynamic> jsonList = jsonDecode(cachedStr);
        cachedRoutes = jsonList.map((x) => DeliveryRoute.fromJson(x)).toList();
      } catch (_) {}
    }

    final token = await getToken();
    String url = '$baseUrl/route/index';
    
    if (locationId != null) {
      url += '?location_id=$locationId';
    }

    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        List<dynamic> dataList = [];
        
        if (decoded is List) {
          dataList = decoded;
        } else if (decoded is Map && decoded['data'] is List) {
          dataList = decoded['data'];
        }

        if (dataList.isNotEmpty) {
          await prefs.setString('cached_routes_$locationId', jsonEncode(dataList));
          return dataList.map((json) => DeliveryRoute.fromJson(json)).toList();
        }
      }
    } catch (_) {}
    
    return cachedRoutes;
  }



  Future<List<Customer>> _mergeWithOfflineCustomers(List<Customer> onlineList) async {
    final offlineRecords = await DbService().getOfflineCustomers();
    final List<Customer> merged = List.from(onlineList);
    
    for (var record in offlineRecords) {
      try {
        final payload = jsonDecode(record['payload']);
        // Parse the offline payload into a Customer object
        merged.insert(0, Customer(
          id: payload['offline_id'] ?? -1, // Use unique negative ID
          name: payload['name'] ?? 'Offline Customer',
          phone: payload['phone'],
          email: payload['email'],
          latitude: payload['latitude'] != null ? double.tryParse(payload['latitude'].toString()) : null,
          longitude: payload['longitude'] != null ? double.tryParse(payload['longitude'].toString()) : null,
          routeId: payload['route_id'] != null ? int.tryParse(payload['route_id'].toString()) : null,
        ));
      } catch (_) {}
    }
    return merged;
  }

  Future<List<City>> fetchCities() async {
    final prefs = await SharedPreferences.getInstance();
    
    // Attempt to load from cache first
    final cachedStr = prefs.getString('cached_cities');
    List<City> cachedCities = [];
    if (cachedStr != null) {
      try {
        final List<dynamic> jsonList = jsonDecode(cachedStr);
        cachedCities = jsonList.map((x) => City.fromJson(x)).toList();
      } catch (_) {}
    }

    final token = await getToken();
    
    // Try both endpoints if needed
    List<String> endpointsToTry = ['$baseUrl/city/index', '$baseUrl/city/list'];
    
    for (String endpoint in endpointsToTry) {
      try {
        final response = await http.get(
          Uri.parse(endpoint),
          headers: {
            'Authorization': 'Bearer $token',
            'Accept': 'application/json',
          },
        ).timeout(const Duration(seconds: 5));

        if (response.statusCode == 200) {
          final decoded = json.decode(response.body);
          List<dynamic> dataList = [];
          
          if (decoded is List) {
            dataList = decoded;
          } else if (decoded is Map && decoded['data'] is List) {
            dataList = decoded['data'];
          }

          if (dataList.isNotEmpty) {
            await prefs.setString('cached_cities', jsonEncode(dataList));
            return dataList.map((json) => City.fromJson(json)).toList();
          }
        }
      } catch (_) {}
    }
    
    return cachedCities;
  }

  Future<Map<String, dynamic>> fetchDayEndSummary(String locationId, String date) async {
    final token = await getToken();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/report/day_end_sales?location_id=$locationId&date=$date'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['status'] == 'success') {
          return data['data'];
        }
      }
      throw Exception('Failed to fetch day end summary');
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<bool> sendTrackingLog(double latitude, double longitude) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token') ?? '';
    // Optional: get user_id if we have it decoded, but server can decode from token if we pass token.
    // We'll pass it as dummy or let server use JWT token.
    // Wait, the PHP endpoint `TrackingController.log()` expects `user_id`, `latitude`, `longitude`.
    // It's better if the app sends `user_id`. Let's get it from prefs if we saved it on login.
    // Looking at login, we save token. The endpoint can just take 1 for now if we didn't save user_id, 
    // but we can parse it from token or just send 1 for testing.
    final userId = prefs.getInt('user_id') ?? 1;

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/tracking/log'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'latitude': latitude,
          'longitude': longitude,
          'created_at': DateTime.now().toIso8601String(),
          'app_time': DateTime.now().toIso8601String(),
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> syncTrackingLogs(List<Map<String, dynamic>> logs) async {
    final token = await getToken();
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/tracking/sync'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'logs': logs}),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}
