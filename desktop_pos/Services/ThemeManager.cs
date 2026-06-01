using System;
using System.Windows;

namespace DesktopPOS.Services
{
    public static class ThemeManager
    {
        public static bool IsDarkMode { get; private set; } = true;

        public static void SetTheme(bool isDark)
        {
            IsDarkMode = isDark;
            
            // Save to settings
            SettingsService.Current.IsDarkTheme = isDark;
            SettingsService.SaveSettings();

            var app = Application.Current;

            var newThemeDict = new ResourceDictionary
            {
                Source = new Uri(isDark ? "Themes/DarkTheme.xaml" : "Themes/LightTheme.xaml", UriKind.Relative)
            };

            // Assuming the first merged dictionary is our theme
            if (app.Resources.MergedDictionaries.Count > 0)
            {
                app.Resources.MergedDictionaries.Clear();
            }
            
            app.Resources.MergedDictionaries.Add(newThemeDict);
        }

        public static void ToggleTheme()
        {
            SetTheme(!IsDarkMode);
        }
    }
}
