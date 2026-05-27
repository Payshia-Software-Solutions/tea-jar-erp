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
      version: 2,
      onCreate: (Database db, int version) async {
        await db.execute('''
          CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE offline_invoices (
            id TEXT PRIMARY KEY,
            payload TEXT,
            created_at TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE offline_tracking_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL,
            longitude REAL,
            created_at TEXT
          )
        ''');
      },
      onUpgrade: (Database db, int oldVersion, int newVersion) async {
        if (oldVersion < 2) {
          await db.execute('''
            CREATE TABLE offline_tracking_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              latitude REAL,
              longitude REAL,
              created_at TEXT
            )
          ''');
        }
      },
    );
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
}
