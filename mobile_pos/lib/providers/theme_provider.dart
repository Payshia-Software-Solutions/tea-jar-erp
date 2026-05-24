import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeProvider with ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.system;
  final String key = "theme_mode";
  SharedPreferences? _prefs;

  ThemeMode get themeMode => _themeMode;

  ThemeProvider() {
    _loadFromPrefs();
  }

  Future<void> _initialPreferences() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  Future<void> _loadFromPrefs() async {
    await _initialPreferences();
    final int? themeValue = _prefs!.getInt(key);
    if (themeValue != null && themeValue < ThemeMode.values.length) {
      _themeMode = ThemeMode.values[themeValue];
      notifyListeners();
    }
  }

  Future<void> _saveToPrefs() async {
    await _initialPreferences();
    _prefs!.setInt(key, _themeMode.index);
  }

  void setThemeMode(ThemeMode mode) {
    if (_themeMode != mode) {
      _themeMode = mode;
      _saveToPrefs();
      notifyListeners();
    }
  }
}
