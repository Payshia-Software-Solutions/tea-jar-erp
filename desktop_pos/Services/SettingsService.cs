using System;
using System.IO;
using System.Text.Json;

namespace DesktopPOS.Services
{
    public class AppSettings
    {
        public string ReceiptPrinterName { get; set; } = "";
        public string KotPrinterName { get; set; } = "";
        public int DefaultCustomerId { get; set; } = 0;
        public string DefaultCustomerName { get; set; } = "Walk-in Customer";
        public bool IsDarkTheme { get; set; } = true;
    }

    public static class SettingsService
    {
        private static readonly string SettingsFile = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "settings.json");
        private static AppSettings? _currentSettings;

        public static AppSettings Current
        {
            get
            {
                if (_currentSettings == null)
                {
                    LoadSettings();
                }
                return _currentSettings ?? new AppSettings();
            }
        }

        public static void LoadSettings()
        {
            try
            {
                if (File.Exists(SettingsFile))
                {
                    var json = File.ReadAllText(SettingsFile);
                    _currentSettings = JsonSerializer.Deserialize<AppSettings>(json) ?? new AppSettings();
                }
                else
                {
                    _currentSettings = new AppSettings();
                }
            }
            catch
            {
                _currentSettings = new AppSettings();
            }
        }

        public static void SaveSettings()
        {
            try
            {
                if (_currentSettings != null)
                {
                    var json = JsonSerializer.Serialize(_currentSettings, new JsonSerializerOptions { WriteIndented = true });
                    File.WriteAllText(SettingsFile, json);
                }
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show($"Failed to save settings: {ex.Message}");
            }
        }
    }
}
