using DesktopPOS.Services;
using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;

namespace DesktopPOS.Controls
{
    public partial class TopNavBar : UserControl
    {
        private DispatcherTimer _timer;

        public TopNavBar()
        {
            InitializeComponent();

            _timer = new DispatcherTimer();
            _timer.Interval = TimeSpan.FromSeconds(1);
            _timer.Tick += Timer_Tick;

            Loaded += TopNavBar_Loaded;
            Unloaded += TopNavBar_Unloaded;
        }

        private void TopNavBar_Loaded(object sender, RoutedEventArgs e)
        {
            // Initial clock tick
            Timer_Tick(null!, null!);
            _timer.Start();

            // User info
            var user = GlobalState.Instance.CurrentUser;
            if (user != null)
            {
                UserNameText.Text = user.name ?? "Cashier";
                UserInitial.Text = (user.name?.Length > 0 ? user.name[0].ToString() : "U").ToUpper();
                LocationText.Text = user.location_name ?? "Main Branch";
            }
        }

        private void TopNavBar_Unloaded(object sender, RoutedEventArgs e)
        {
            _timer.Stop();
        }

        private void Timer_Tick(object? sender, EventArgs e)
        {
            var hour = DateTime.Now.Hour;
            var greeting = hour < 12 ? "Good Morning! ☀️"
                         : hour < 17 ? "Good Afternoon! 👋"
                         : "Good Evening! 🌙";
            GreetingText.Text = greeting;
            DateText.Text = DateTime.Now.ToString("dddd, MMMM d, yyyy  •  hh:mm:ss tt");
        }

        private void ToggleTheme_Click(object sender, RoutedEventArgs e)
        {
            ThemeManager.ToggleTheme();
        }

        private void Home_Click(object sender, RoutedEventArgs e)
        {
            if (Window.GetWindow(this) is MainWindow mw)
            {
                mw.MainFrame.Navigate(new Pages.DashboardPage());
            }
        }

        private void ShortcutsInfo_Click(object sender, RoutedEventArgs e)
        {
            var win = Window.GetWindow(this);
            var dialog = new Pages.ShortcutsInfoDialog();
            dialog.Owner = win;
            dialog.ShowDialog();
        }

        private void Settings_Click(object sender, RoutedEventArgs e)
        {
            if (Window.GetWindow(this) is MainWindow mw)
            {
                mw.MainFrame.Navigate(new Pages.SettingsPage());
            }
        }

        private void ToggleFullscreen_Click(object sender, RoutedEventArgs e)
        {
            var window = Window.GetWindow(this);
            if (window != null)
            {
                if (window.WindowState == WindowState.Maximized && window.WindowStyle == WindowStyle.None)
                {
                    window.WindowStyle = WindowStyle.SingleBorderWindow;
                    window.WindowState = WindowState.Normal;
                }
                else
                {
                    window.WindowStyle = WindowStyle.None;
                    window.WindowState = WindowState.Maximized;
                }
            }
        }

        private void CloseApp_Click(object sender, RoutedEventArgs e)
        {
            var result = MessageBox.Show("Are you sure you want to exit the application?", "Exit App", MessageBoxButton.YesNo, MessageBoxImage.Question);
            if (result == MessageBoxResult.Yes)
            {
                Application.Current.Shutdown();
            }
        }
    }
}
