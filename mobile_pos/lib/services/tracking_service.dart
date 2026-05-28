import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:workmanager/workmanager.dart';
import 'api_service.dart';
import 'db_service.dart';

const String trackingTaskKey = "com.payshia.trackingTask";

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      
      // Try to sync offline logs first
      final offlineLogs = await DbService().getOfflineTrackingLogs();
      if (offlineLogs.isNotEmpty) {
        final success = await ApiService().syncTrackingLogs(offlineLogs);
        if (success) {
          final syncedIds = offlineLogs.map((e) => e['id'] as int).toList();
          await DbService().deleteOfflineTrackingLogs(syncedIds);
        }
      }

      // Automatically sync customers, visits and invoices in the background
      try {
        await ApiService().syncOfflineCustomers();
        await ApiService().syncOfflineVisits();
        await ApiService().syncOfflineInvoices();
      } catch (_) {}

      // Log current
      final success = await ApiService().sendTrackingLog(position.latitude, position.longitude);
      if (!success) {
        await DbService().saveOfflineTrackingLog(position.latitude, position.longitude);
      }
      return true;
    } catch (e) {
      return false;
    }
  });
}

class TrackingService {
  static final TrackingService _instance = TrackingService._internal();
  factory TrackingService() => _instance;
  TrackingService._internal();

  Timer? _foregroundTimer;

  Future<void> initialize() async {
    // Check permissions
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        return; // Can't track
      }
    }

    // Initialize Workmanager for background execution (min 15 mins)
    Workmanager().initialize(
      callbackDispatcher,
      isInDebugMode: false,
    );

    Workmanager().registerPeriodicTask(
      "tracking_task_1",
      trackingTaskKey,
      frequency: const Duration(minutes: 15),
      constraints: Constraints(
        networkType: NetworkType.connected,
      ),
    );

    // Foreground 5-minute tracking
    _startForegroundTracking();
  }

  void _startForegroundTracking() {
    _foregroundTimer?.cancel();
    
    // Log immediately when starting
    _logCurrentLocation();

    // Then log periodically
    _foregroundTimer = Timer.periodic(const Duration(minutes: 5), (timer) {
      _logCurrentLocation();
    });
  }

  Future<void> _logCurrentLocation() async {
    try {
      // 1. Fetch current location immediately
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      
      // 2. Try to sync any existing offline logs
      final offlineLogs = await DbService().getOfflineTrackingLogs();
      if (offlineLogs.isNotEmpty) {
        final syncSuccess = await ApiService().syncTrackingLogs(offlineLogs);
        if (syncSuccess) {
          final syncedIds = offlineLogs.map((e) => e['id'] as int).toList();
          await DbService().deleteOfflineTrackingLogs(syncedIds);
        }
      }

      // Automatically sync customers, visits and invoices in the foreground
      try {
        await ApiService().syncOfflineCustomers();
        await ApiService().syncOfflineVisits();
        await ApiService().syncOfflineInvoices();
      } catch (_) {}

      // 3. Try to upload current location
      final logSuccess = await ApiService().sendTrackingLog(position.latitude, position.longitude);
      if (!logSuccess) {
        // If it fails (no network or server error), save it to SQLite!
        await DbService().saveOfflineTrackingLog(position.latitude, position.longitude);
      }
    } catch (e) {
      // Log silently
    }
  }

  void stop() {
    _foregroundTimer?.cancel();
  }
}
