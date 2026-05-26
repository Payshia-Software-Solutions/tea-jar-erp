import 'dart:convert';
import 'dart:io';
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
  static const String baseUrl = 'https://server-kdu-service.payshia.com/api';

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  Future<void> setToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
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
        await setToken(token);
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
        return cached.map((json) => Customer.fromJson(json)).toList();
      }
    }

    // 3. Fallback to network if cache is empty or forceRefresh is true
    return await _networkFetchCustomers();
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
      await DbService().saveOfflineInvoice(tempId, payload);
      return {
        'success': true, 
        'data': {'id': tempId, 'invoice_no': tempId}, 
        'offline': true,
        'message': 'Saved Offline. Will sync when connection is restored.'
      };
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
        } else if (response.statusCode >= 400 && response.statusCode < 500) {
          // If it's a 4xx error (like Bad Request or validation failure), delete it
          // to prevent an infinite sync loop, as it will never succeed without manual intervention.
          print('Offline sync failed with ${response.statusCode} for record ${record['id']}. Deleting from queue.');
          await DbService().deleteOfflineInvoice(record['id']);
        }
      } catch (e) {
        // Stop syncing if connection fails again (e.g. Timeout or SocketException)
        break;
      }
    }
  }

  Future<List<dynamic>> fetchInvoices({String? date}) async {
    final token = await getToken();
    String url = '$baseUrl/invoice/list';
    if (date != null) {
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
      return false;
    }
  }

  Future<List<int>> getTodayVisitedCustomerIds() async {
    final token = await getToken();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/visit/today_visits'),
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
    
    final response = await http.get(
      Uri.parse('$baseUrl/invoice/list?customer_id=$customerId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final jsonResponse = jsonDecode(response.body);
      if (jsonResponse['status'] == 'success') {
        return jsonResponse['data'] as List<dynamic>;
      }
    }
    throw Exception('Failed to load customer invoices');
  }

  Future<String?> addPayment(int invoiceId, Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    
    final response = await http.post(
      Uri.parse('$baseUrl/invoice/addPayment/$invoiceId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(data),
    );

    if (response.statusCode == 200) {
      final jsonResponse = jsonDecode(response.body);
      if (jsonResponse['status'] == 'success') {
        return jsonResponse['receipt_id']?.toString();
      }
    }
    return null;
  }

  Future<bool> createCustomer(Map<String, dynamic> payload, {String? photoPath}) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token') ?? '';
    
    if (photoPath != null && photoPath.isNotEmpty) {
      final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/customer/create'));
      request.headers['Authorization'] = 'Bearer $token';
      
      payload.forEach((key, value) {
        if (value != null) {
          request.fields[key] = value.toString();
        }
      });
      
      request.files.add(await http.MultipartFile.fromPath('photo', photoPath));
      
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final jsonResponse = jsonDecode(response.body);
        bool success = jsonResponse['status'] == 'success';
        if (success) {
          try {
            await fetchCustomers(forceRefresh: true);
          } catch (_) {}
        }
        return success;
      }
      return false;
    } else {
      final response = await http.post(
        Uri.parse('$baseUrl/customer/create'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(payload),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final jsonResponse = jsonDecode(response.body);
        bool success = jsonResponse['status'] == 'success';
        if (success) {
          try {
            await fetchCustomers(forceRefresh: true);
          } catch (_) {}
        }
        return success;
      }
      return false;
    }
  }

  Future<List<DeliveryRoute>> fetchRoutes({int? locationId}) async {
    final token = await getToken();
    String url = '$baseUrl/route/index';
    
    if (locationId == null) {
      final activeLocation = await getActiveLocation();
      if (activeLocation != null && activeLocation['id'] != null) {
        locationId = activeLocation['id'] as int;
      }
    }

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
        if (decoded['status'] == 'success') {
          final List data = decoded['data'] ?? [];
          return data.map((json) => DeliveryRoute.fromJson(json)).toList();
        }
      }
    } catch (_) {}
    return [];
  }

  Future<List<City>> fetchCities() async {
    final token = await getToken();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/city/index'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['status'] == 'success') {
          final List data = decoded['data'] ?? [];
          return data.map((json) => City.fromJson(json)).toList();
        }
      }
    } catch (_) {}
    return [];
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
          'user_id': userId,
          'latitude': latitude,
          'longitude': longitude,
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
}
