using System.Configuration;
using System.Data;
using System.Windows;
using System;

namespace DesktopPOS
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : Application
    {
        public App()
        {
            this.DispatcherUnhandledException += App_DispatcherUnhandledException;
        }

        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);
            
            // Apply default theme from settings
            bool isDark = DesktopPOS.Services.SettingsService.Current.IsDarkTheme;
            DesktopPOS.Services.ThemeManager.SetTheme(isDark);
        }

        private void App_DispatcherUnhandledException(object sender, System.Windows.Threading.DispatcherUnhandledExceptionEventArgs e)
        {
            try
            {
                var logMessage = $"=== FATAL ERROR ({DateTime.Now}) ===\r\n{e.Exception}\r\n";
                if (e.Exception.InnerException != null)
                {
                    logMessage += $"INNER EXCEPTION:\r\n{e.Exception.InnerException}\r\n";
                }
                logMessage += "====================================\r\n\r\n";
                System.IO.File.AppendAllText("crash_log.txt", logMessage);

                MessageBox.Show($"A fatal error occurred and the application must close.\r\n\r\nDetails: {e.Exception.Message}\r\n\r\nSee 'crash_log.txt' for full details.", 
                                "Application Crash", MessageBoxButton.OK, MessageBoxImage.Error);
            }
            catch { }

            e.Handled = true;
            Environment.Exit(1);
        }
    }
}
