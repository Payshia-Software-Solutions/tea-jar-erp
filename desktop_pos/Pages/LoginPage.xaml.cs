using DesktopPOS.Services;
using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Navigation;

namespace DesktopPOS.Pages
{
    public partial class LoginPage : Page
    {
        private readonly AuthService _authService;

        public LoginPage()
        {
            InitializeComponent();
            _authService = new AuthService();
        }

        private void Page_Loaded(object sender, RoutedEventArgs e)
        {
            // Clear navigation history to prevent going back via mouse or keyboard
            if (NavigationService != null)
            {
                while (NavigationService.CanGoBack)
                {
                    NavigationService.RemoveBackEntry();
                }
            }
        }

        private async void LoginButton_Click(object sender, RoutedEventArgs e)
        {
            ErrorTextBlock.Visibility = Visibility.Collapsed;
            LoginButton.IsEnabled = false;
            LoginButton.Content = "AUTHENTICATING...";

            string email = EmailTextBox.Text;
            string password = PasswordBox.Password;

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                ShowError("Please enter email and password.");
                return;
            }

            try
            {
                var response = await _authService.LoginAsync(email, password);
                
                if (response != null && response.user != null)
                {
                    // Ask for location upon login if they have locations assigned
                    if (response.user.allowed_locations != null && response.user.allowed_locations.Count > 0)
                    {
                        MainGrid.Effect = new System.Windows.Media.Effects.BlurEffect { Radius = 20 };
                        
                        var dialog = new LocationSelectionDialog(response.user.allowed_locations);
                        dialog.Owner = Window.GetWindow(this);
                        bool? result = dialog.ShowDialog();
                        
                        MainGrid.Effect = null;

                        if (result == true)
                        {
                            var selected = dialog.SelectedLocation;
                            response.user.location_id = selected!.id;
                            response.user.location_name = selected.name;

                            GlobalState.Instance.CurrentUser = response.user;
                            StorageService.SaveSession(response);
                            NavigationService.Navigate(new DashboardPage());
                        }
                        else
                        {
                            ShowError("Location selection cancelled.");
                        }
                    }
                    else
                    {
                        // Store user info globally
                        GlobalState.Instance.CurrentUser = response.user;
                        
                        // Save session persistently
                        StorageService.SaveSession(response);
                        
                        // Success! Navigate to Dashboard
                        NavigationService.Navigate(new DashboardPage());
                    }
                }
                else
                {
                    ShowError("Invalid credentials.");
                }
            }
            catch (Exception)
            {
                ShowError("Authentication failed. Check server connection.");
            }
        }

        private void ShowError(string message)
        {
            ErrorTextBlock.Text = message;
            ErrorTextBlock.Visibility = Visibility.Visible;
            LoginButton.IsEnabled = true;
            LoginButton.Content = "AUTHENTICATE";
        }

        private void SettingsButton_Click(object sender, RoutedEventArgs e)
        {
            NavigationService.Navigate(new SettingsPage());
        }
    }
}

