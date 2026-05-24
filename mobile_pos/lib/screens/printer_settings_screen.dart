import 'package:flutter/material.dart';
import 'package:blue_thermal_printer/blue_thermal_printer.dart';
import '../services/printer_service.dart';

class PrinterSettingsScreen extends StatefulWidget {
  const PrinterSettingsScreen({super.key});

  @override
  State<PrinterSettingsScreen> createState() => _PrinterSettingsScreenState();
}

class _PrinterSettingsScreenState extends State<PrinterSettingsScreen> {
  final PrinterService _printerService = PrinterService();
  final BlueThermalPrinter _bluetooth = BlueThermalPrinter.instance;

  List<BluetoothDevice> _devices = [];
  BluetoothDevice? _selectedDevice;
  bool _connected = false;
  bool _isScanning = false;

  @override
  void initState() {
    super.initState();
    _initPrinter();
  }

  Future<void> _initPrinter() async {
    bool? isConnected = await _bluetooth.isConnected;
    if (mounted) {
      setState(() {
        _connected = isConnected ?? false;
      });
    }
    _getDevices();
  }

  Future<void> _getDevices() async {
    setState(() => _isScanning = true);
    try {
      List<BluetoothDevice> devices = await _printerService.getDevices();
      if (mounted) {
        setState(() {
          _devices = devices;
          _isScanning = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isScanning = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to get bluetooth devices. Ensure Bluetooth is ON.')),
        );
      }
    }
  }

  Future<void> _connect() async {
    if (_selectedDevice == null) return;
    
    _printerService.selectDevice(_selectedDevice!);
    
    try {
      bool connected = await _printerService.connect();
      if (mounted) {
        setState(() => _connected = connected);
        if (connected) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Connected to ${_selectedDevice!.name}'), backgroundColor: Colors.green),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to connect.'), backgroundColor: Colors.red),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _disconnect() async {
    try {
      await _printerService.disconnect();
      if (mounted) setState(() => _connected = false);
    } catch (e) {
      // Ignore
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thermal Printer Setup', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.amber.withOpacity(0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, color: Colors.orange),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Please ensure your Thermal Printer is paired in the Android Bluetooth settings before scanning.',
                      style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Bonded Devices', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                if (_isScanning) const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                if (!_isScanning) IconButton(icon: const Icon(Icons.refresh, color: Colors.blueAccent), onPressed: _getDevices),
              ],
            ),
            const SizedBox(height: 8),
            
            Expanded(
              child: _devices.isEmpty 
              ? const Center(child: Text('No bonded devices found.'))
              : ListView.builder(
                  itemCount: _devices.length,
                  itemBuilder: (context, index) {
                    final device = _devices[index];
                    final isSelected = _selectedDevice?.address == device.address;
                    
                    return Card(
                      color: isSelected ? Colors.blueAccent.withOpacity(0.1) : null,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: isSelected ? Colors.blueAccent : Colors.transparent),
                      ),
                      child: ListTile(
                        leading: const Icon(Icons.print),
                        title: Text(device.name ?? 'Unknown Device'),
                        subtitle: Text(device.address ?? ''),
                        trailing: isSelected && _connected
                            ? const Icon(Icons.bluetooth_connected, color: Colors.green)
                            : null,
                        onTap: () {
                          setState(() {
                            _selectedDevice = device;
                          });
                        },
                      ),
                    );
                  },
                ),
            ),
            
            if (_selectedDevice != null) ...[
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _connected ? _disconnect : _connect,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: _connected ? Colors.redAccent : Colors.green,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: Icon(_connected ? Icons.bluetooth_disabled : Icons.bluetooth, color: Colors.white),
                label: Text(
                  _connected ? 'Disconnect' : 'Connect',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                ),
              ),
            ],
            
            if (_connected) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () async {
                  await _printerService.testPrint();
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: const BorderSide(color: Colors.blueAccent),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.print, color: Colors.blueAccent),
                label: const Text('Print Test Page', style: TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold)),
              ),
            ]
          ],
        ),
      ),
    );
  }
}
