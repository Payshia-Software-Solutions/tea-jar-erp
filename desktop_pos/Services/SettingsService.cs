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
        public bool IsTaxInclusive { get; set; } = false;
    }

    public static class SettingsService
    {
        private static readonly string SettingsFile = GetSettingsPath();
        private static AppSettings? _currentSettings;

        private static string GetSettingsPath()
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            var folder = Path.Combine(appData, "DesktopPOS");
            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }
            return Path.Combine(folder, "settings.json");
        }

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
                    var localDefault = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "settings.json");
                    if (File.Exists(localDefault))
                    {
                        var json = File.ReadAllText(localDefault);
                        _currentSettings = JsonSerializer.Deserialize<AppSettings>(json) ?? new AppSettings();
                        SaveSettings();
                    }
                    else
                    {
                        _currentSettings = new AppSettings();
                    }
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
