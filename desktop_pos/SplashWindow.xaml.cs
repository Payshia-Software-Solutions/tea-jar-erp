using System;
using System.Threading.Tasks;
using System.Windows;
using DesktopPOS.Services;

namespace DesktopPOS
{
    public partial class SplashWindow : Window
    {
        public SplashWindow()
        {
            InitializeComponent();
            this.Loaded += SplashWindow_Loaded;
        }

        private async Task UpdateProgress(int percent, string message)
        {
            LoadingText.Text = message;
            LoadingPercent.Text = $"{percent}%";
            LoadingBar.Value = percent;
            await Task.Delay(200);
        }

        private async void SplashWindow_Loaded(object sender, RoutedEventArgs e)
        {
            await UpdateProgress(10, "Initializing system configuration...");

            // Load session
            var session = StorageService.LoadSession();
            var mainWindow = new MainWindow();
            
            if (session != null && !string.IsNullOrEmpty(session.token))
            {
                await UpdateProgress(25, "Authenticating secure session...");
                GlobalState.Instance.CurrentUser = session.user;
                ApiService.JwtToken = session.token;
                
                var api = new ApiService();
                
                await UpdateProgress(50, "Synchronizing products and inventory...");
                await api.FetchProductsAsync(forceRefresh: true);
                
                await UpdateProgress(70, "Synchronizing customer profiles...");
                await api.FetchCustomersAsync(forceRefresh: true);
                
                await UpdateProgress(85, "Fetching dashboard analytics...");
                await api.FetchDashboardSalesAsync();
                await api.FetchDashboardOverviewAsync();
                
                await UpdateProgress(100, "Starting main interface...");
                
                mainWindow.Loaded += (s, ev) => 
                {
                    mainWindow.MainFrame.Navigate(new Pages.DashboardPage());
                };
            }
            else
            {
                await UpdateProgress(100, "Ready for login...");
                await Task.Delay(500); // Give user time to see 100%
                mainWindow.Loaded += (s, ev) => 
                {
                    mainWindow.MainFrame.Navigate(new Pages.LoginPage());
                };
            }

            // Show main window and close splash
            Application.Current.MainWindow = mainWindow;
            mainWindow.Show();
            this.Close();
        }
    }
}
