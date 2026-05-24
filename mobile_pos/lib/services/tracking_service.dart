import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:workmanager/workmanager.dart';
import 'api_service.dart';

const String trackingTaskKey = "com.payshia.trackingTask";

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      await ApiService().sendTrackingLog(position.latitude, position.longitude);
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
    _foregroundTimer = Timer.periodic(const Duration(minutes: 5), (timer) async {
      try {
        final position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );
        await ApiService().sendTrackingLog(position.latitude, position.longitude);
      } catch (e) {
        // Log silently
      }
    });
  }

  void stop() {
    _foregroundTimer?.cancel();
  }
}
