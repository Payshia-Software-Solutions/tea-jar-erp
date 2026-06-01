using DesktopPOS.Models;
using DesktopPOS.Services;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Navigation;

namespace DesktopPOS.Pages
{
    public partial class LocationSelectionPage : Page
    {
        private LoginResponse _session;

        public LocationSelectionPage(LoginResponse session)
        {
            InitializeComponent();
            _session = session;
            
            if (_session.user!.allowed_locations != null)
            {
                LocationsList.ItemsSource = _session.user.allowed_locations;
            }
        }

        private void Location_Click(object sender, MouseButtonEventArgs e)
        {
            if (sender is Border border && border.Tag is LocationInfo location)
            {
                // Update the session's chosen location
                _session.user!.location_id = location.id;
                _session.user.location_name = location.name;

                // Save to GlobalState
                GlobalState.Instance.CurrentUser = _session.user;

                // Persist the selection so it's remembered next time
                StorageService.SaveSession(_session);

                // Navigate to Dashboard
                NavigationService.Navigate(new DashboardPage());
            }
        }
    }
}

