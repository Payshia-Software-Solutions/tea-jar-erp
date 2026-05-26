import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import 'printer_settings_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String _receiptMode = 'standard';
  bool _enforceVisit = false;

  @override
  void initState() {
    super.initState();
    _loadReceiptMode();
  }

  Future<void> _loadReceiptMode() async {
    final prefs = await SharedPreferences.getInstance();
    final enforceVisit = await ApiService().getEnforceVisitBeforeSale();
    setState(() {
      _receiptMode = prefs.getString('receipt_mode') ?? 'standard';
      _enforceVisit = enforceVisit;
    });
  }

  Future<void> _saveReceiptMode(String mode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('receipt_mode', mode);
    setState(() {
      _receiptMode = mode;
    });
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        children: [
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text('Appearance', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.blueAccent)),
          ),
          RadioListTile<ThemeMode>(
            title: const Text('System Default'),
            value: ThemeMode.system,
            groupValue: themeProvider.themeMode,
            onChanged: (ThemeMode? value) {
              if (value != null) {
                themeProvider.setThemeMode(value);
              }
            },
          ),
          RadioListTile<ThemeMode>(
            title: const Text('Light'),
            value: ThemeMode.light,
            groupValue: themeProvider.themeMode,
            onChanged: (ThemeMode? value) {
              if (value != null) {
                themeProvider.setThemeMode(value);
              }
            },
          ),
          RadioListTile<ThemeMode>(
            title: const Text('Dark'),
            value: ThemeMode.dark,
            groupValue: themeProvider.themeMode,
            onChanged: (ThemeMode? value) {
              if (value != null) {
                themeProvider.setThemeMode(value);
              }
            },
          ),
          const Divider(),
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text('Hardware', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.blueAccent)),
          ),
          ListTile(
            leading: const Icon(Icons.print, color: Colors.grey),
            title: const Text('Thermal Printer Setup', style: TextStyle(fontWeight: FontWeight.bold)),
            subtitle: const Text('Connect a Bluetooth printer'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const PrinterSettingsScreen()),
              );
            },
          ),
          const Divider(),
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text('Receipt Printing', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.blueAccent)),
          ),
          ListTile(
            title: const Text('Receipt Print Mode'),
            subtitle: const Text('Select how taxes are displayed on the printed receipt.'),
            trailing: DropdownButton<String>(
              value: _receiptMode,
              onChanged: (String? newValue) {
                if (newValue != null) {
                  _saveReceiptMode(newValue);
                }
              },
              items: const [
                DropdownMenuItem(value: 'standard', child: Text('Standard (Tax Breakdown)')),
                DropdownMenuItem(value: 'inclusive', child: Text('Inclusive (Tax in Price)')),
              ],
            ),
          ),
          const Divider(),
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text('Operations', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.blueAccent)),
          ),
          SwitchListTile(
            title: const Text('Enforce Shop Visit (Check-In)'),
            subtitle: const Text('Require sales reps to log a physical visit before creating an order.'),
            value: _enforceVisit,
            onChanged: (bool value) async {
              await ApiService().setEnforceVisitBeforeSale(value);
              setState(() {
                _enforceVisit = value;
              });
            },
          ),
        ],
      ),
    );
  }
}
