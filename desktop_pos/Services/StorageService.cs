using DesktopPOS.Models;
using System;
using System.IO;
using System.Text.Json;

namespace DesktopPOS.Services
{
    public class StorageService
    {
        private static readonly string AppDataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "NexusPOS");
        private static readonly string SessionFilePath = Path.Combine(AppDataFolder, "session.json");

        public static void SaveSession(LoginResponse session)
        {
            try
            {
                if (!Directory.Exists(AppDataFolder))
                {
                    Directory.CreateDirectory(AppDataFolder);
                }

                var json = JsonSerializer.Serialize(session);
                File.WriteAllText(SessionFilePath, json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving session: {ex.Message}");
            }
        }

        public static LoginResponse? LoadSession()
        {
            try
            {
                if (File.Exists(SessionFilePath))
                {
                    var json = File.ReadAllText(SessionFilePath);
                    return JsonSerializer.Deserialize<LoginResponse>(json);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading session: {ex.Message}");
            }
            return null;
        }

        public static void ClearSession()
        {
            try
            {
                if (File.Exists(SessionFilePath))
                {
                    File.Delete(SessionFilePath);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error clearing session: {ex.Message}");
            }
        }
        private static readonly string ConfigFilePath = Path.Combine(AppDataFolder, "config.json");
        private static readonly string DefaultBaseUrl = "https://server-kdu-service.payshia.com/api";

        public class AppConfig
        {
            public string ServerUrl { get; set; } = DefaultBaseUrl;
        }

        public static void SaveServerUrl(string url)
        {
            try
            {
                if (!Directory.Exists(AppDataFolder))
                {
                    Directory.CreateDirectory(AppDataFolder);
                }

                var config = new AppConfig { ServerUrl = url };
                var json = JsonSerializer.Serialize(config);
                File.WriteAllText(ConfigFilePath, json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving config: {ex.Message}");
            }
        }

        public static string LoadServerUrl()
        {
            try
            {
                if (File.Exists(ConfigFilePath))
                {
                    var json = File.ReadAllText(ConfigFilePath);
                    var config = JsonSerializer.Deserialize<AppConfig>(json);
                    if (config != null && !string.IsNullOrEmpty(config.ServerUrl))
                    {
                        return config.ServerUrl;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading config: {ex.Message}");
            }
            return DefaultBaseUrl;
        }
    }
}
