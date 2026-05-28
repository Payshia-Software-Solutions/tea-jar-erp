import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'dart:convert';

class DbService {
  static final DbService _instance = DbService._internal();
  factory DbService() => _instance;
  DbService._internal();

  Database? _db;

  Future<Database> get database async {
    if (_db != null) return _db!;
    _db = await _initDb();
    return _db!;
  }

  Future<Database> _initDb() async {
    final databasesPath = await getDatabasesPath();
    final path = join(databasesPath, 'pos_offline.db');

    return await openDatabase(
      path,
      version: 6,
      onCreate: (Database db, int version) async {
        await db.execute('''
          CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE IF NOT EXISTS offline_invoices (
            id TEXT PRIMARY KEY,
            payload TEXT,
            created_at TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE IF NOT EXISTS offline_tracking_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL,
            longitude REAL,
            created_at TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE IF NOT EXISTS offline_visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payload TEXT,
            created_at TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE IF NOT EXISTS offline_customers (
            temp_id TEXT PRIMARY KEY,
            payload TEXT,
            photo_path TEXT,
            created_at TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE IF NOT EXISTS cached_invoices (
            customer_id INTEGER PRIMARY KEY,
            data TEXT,
            updated_at TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE IF NOT EXISTS offline_payments (
            id TEXT PRIMARY KEY,
            invoice_id INTEGER,
            payload TEXT,
            created_at TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE IF NOT EXISTS cached_promotions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT
          )
        ''');
      },
      onUpgrade: (Database db, int oldVersion, int newVersion) async {
        if (oldVersion < 2) {
          await db.execute('''
            CREATE TABLE IF NOT EXISTS offline_tracking_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              latitude REAL,
              longitude REAL,
              created_at TEXT
            )
          ''');
        }
        if (oldVersion < 3) {
          await db.execute('''
            CREATE TABLE IF NOT EXISTS offline_visits (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              payload TEXT,
              created_at TEXT
            )
          ''');
        }
        if (oldVersion < 4) {
          await db.execute('''
            CREATE TABLE IF NOT EXISTS offline_customers (
              temp_id TEXT PRIMARY KEY,
              payload TEXT,
              photo_path TEXT,
              created_at TEXT
            )
          ''');
        }
        if (oldVersion < 5) {
          await db.execute('''
            CREATE TABLE IF NOT EXISTS cached_invoices (
              customer_id INTEGER PRIMARY KEY,
              data TEXT,
              updated_at TEXT
            )
          ''');
          await db.execute('''
            CREATE TABLE IF NOT EXISTS offline_payments (
              id TEXT PRIMARY KEY,
              invoice_id INTEGER,
              payload TEXT,
              created_at TEXT
            )
          ''');
        }
        if (oldVersion < 6) {
          await db.execute('''
            CREATE TABLE IF NOT EXISTS cached_promotions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              data TEXT
            )
          ''');
        }
      },
    );
  }

  // --- Promotions Caching ---
  Future<void> cachePromotions(List<dynamic> promotions) async {
    final db = await database;
    await db.delete('cached_promotions'); // Clear old cache
    for (var p in promotions) {
      await db.insert('cached_promotions', {'data': jsonEncode(p)});
    }
  }

  Future<List<dynamic>> getCachedPromotions() async {
    final db = await database;
    final maps = await db.query('cached_promotions');
    return maps.map((e) => jsonDecode(e['data'] as String)).toList();
  }

  // --- Products Caching ---
  Future<void> cacheProducts(List<dynamic> products) async {
    final db = await database;
    await db.delete('products'); // Clear old cache
    for (var p in products) {
      await db.insert('products', {'data': jsonEncode(p)});
    }
  }

  Future<List<dynamic>> getCachedProducts() async {
    final db = await database;
    final maps = await db.query('products');
    return maps.map((e) => jsonDecode(e['data'] as String)).toList();
  }

  // --- Customers Caching ---
  Future<void> cacheCustomers(List<dynamic> customers) async {
    final db = await database;
    await db.delete('customers'); // Clear old cache
    for (var c in customers) {
      await db.insert('customers', {'data': jsonEncode(c)});
    }
  }

  Future<List<dynamic>> getCachedCustomers() async {
    final db = await database;
    final maps = await db.query('customers');
    return maps.map((e) => jsonDecode(e['data'] as String)).toList();
  }

  // --- Offline Invoices Queue ---
  Future<void> saveOfflineInvoice(String tempId, Map<String, dynamic> payload) async {
    final db = await database;
    await db.insert('offline_invoices', {
      'id': tempId,
      'payload': jsonEncode(payload),
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<List<Map<String, dynamic>>> getOfflineInvoices() async {
    final db = await database;
    final maps = await db.query('offline_invoices');
    return maps;
  }

  Future<void> deleteOfflineInvoice(String tempId) async {
    final db = await database;
    await db.delete(
      'offline_invoices',
      where: 'id = ?',
      whereArgs: [tempId],
    );
  }

  // --- Offline Tracking Logs ---
  Future<void> saveOfflineTrackingLog(double latitude, double longitude) async {
    final db = await database;
    await db.insert('offline_tracking_logs', {
      'latitude': latitude,
      'longitude': longitude,
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<List<Map<String, dynamic>>> getOfflineTrackingLogs() async {
    final db = await database;
    return await db.query('offline_tracking_logs', orderBy: 'id ASC');
  }

  Future<void> deleteOfflineTrackingLogs(List<int> ids) async {
    if (ids.isEmpty) return;
    final db = await database;
    // SQLite limits parameters, but for small batches this is fine.
    await db.delete(
      'offline_tracking_logs',
      where: 'id IN (${ids.map((_) => '?').join(', ')})',
      whereArgs: ids,
    );
  }

  // --- Offline Visits ---
  Future<void> saveOfflineVisit(Map<String, dynamic> payload) async {
    final db = await database;
    await db.insert('offline_visits', {
      'payload': jsonEncode(payload),
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<List<Map<String, dynamic>>> getOfflineVisits() async {
    final db = await database;
    return await db.query('offline_visits', orderBy: 'created_at ASC');
  }

  Future<void> deleteOfflineVisit(int id) async {
    final db = await database;
    await db.delete('offline_visits', where: 'id = ?', whereArgs: [id]);
  }

  // --- Offline Customers ---
  Future<void> saveOfflineCustomer(String tempId, Map<String, dynamic> payload, {String? photoPath}) async {
    final db = await database;
    await db.insert('offline_customers', {
      'temp_id': tempId,
      'payload': jsonEncode(payload),
      'photo_path': photoPath,
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<List<Map<String, dynamic>>> getOfflineCustomers() async {
    final db = await database;
    return await db.query('offline_customers', orderBy: 'created_at ASC');
  }

  Future<void> deleteOfflineCustomer(String tempId) async {
    final db = await database;
    await db.delete('offline_customers', where: 'temp_id = ?', whereArgs: [tempId]);
  }

  Future<void> updateOfflineCustomerIds(int oldId, int newId) async {
    final db = await database;
    
    // Update invoices
    final invoices = await db.query('offline_invoices');
    for (var invoice in invoices) {
      try {
        final payload = jsonDecode(invoice['payload'] as String);
        if (payload['customer_id'] == oldId) {
          payload['customer_id'] = newId;
          await db.update('offline_invoices', {'payload': jsonEncode(payload)}, where: 'id = ?', whereArgs: [invoice['id']]);
        }
      } catch (_) {}
    }
    
    // Update visits
    final visits = await db.query('offline_visits');
    for (var visit in visits) {
      try {
        final payload = jsonDecode(visit['payload'] as String);
        if (payload['customer_id'] == oldId) {
          payload['customer_id'] = newId;
          await db.update('offline_visits', {'payload': jsonEncode(payload)}, where: 'id = ?', whereArgs: [visit['id']]);
        }
      } catch (_) {}
    }
  }

  // --- Cached Invoices ---
  Future<void> cacheCustomerInvoices(int customerId, List<dynamic> invoices) async {
    final db = await database;
    await db.insert('cached_invoices', {
      'customer_id': customerId,
      'data': jsonEncode(invoices),
      'updated_at': DateTime.now().toIso8601String(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<dynamic>> getCachedCustomerInvoices(int customerId) async {
    final db = await database;
    final maps = await db.query('cached_invoices', where: 'customer_id = ?', whereArgs: [customerId]);
    if (maps.isNotEmpty) {
      return jsonDecode(maps.first['data'] as String);
    }
    return [];
  }

  // --- Offline Payments ---
  Future<void> saveOfflinePayment(String tempId, int invoiceId, Map<String, dynamic> payload) async {
    final db = await database;
    await db.insert('offline_payments', {
      'id': tempId,
      'invoice_id': invoiceId,
      'payload': jsonEncode(payload),
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<List<Map<String, dynamic>>> getOfflinePayments() async {
    final db = await database;
    return await db.query('offline_payments', orderBy: 'created_at ASC');
  }

  Future<void> deleteOfflinePayment(String tempId) async {
    final db = await database;
    await db.delete('offline_payments', where: 'id = ?', whereArgs: [tempId]);
  }
}
