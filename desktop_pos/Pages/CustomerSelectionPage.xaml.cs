using DesktopPOS.Services;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;

namespace DesktopPOS.Pages
{
    public partial class CustomerSelectionPage : Page
    {
        private readonly ApiService _api = new();
        private List<CustomerModel> _allCustomers = new();

        public CustomerSelectionPage()
        {
            InitializeComponent();
            Loaded += async (s, e) => await LoadCustomers();
        }

        private async System.Threading.Tasks.Task LoadCustomers()
        {
            LoadingPanel.Visibility = Visibility.Visible;
            CustomerListView.Visibility = Visibility.Collapsed;
            EmptyPanel.Visibility = Visibility.Collapsed;

            var result = await _api.FetchCustomersAsync();
            _allCustomers = result ?? new List<CustomerModel>();
            
            ShowCustomers(_allCustomers);
        }

        private void ShowCustomers(List<CustomerModel> customers)
        {
            LoadingPanel.Visibility = Visibility.Collapsed;
            if (customers.Count == 0)
            {
                EmptyPanel.Visibility = Visibility.Visible;
                CustomerListView.Visibility = Visibility.Collapsed;
            }
            else
            {
                EmptyPanel.Visibility = Visibility.Collapsed;
                CustomerListView.Visibility = Visibility.Visible;
                CustomerListView.ItemsSource = customers;
            }
        }

        private void SearchBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            var query = SearchBox.Text.ToLower();
            var filtered = _allCustomers.Where(c =>
                (c.name?.ToLower().Contains(query) ?? false) ||
                (c.phone?.Contains(query) ?? false) ||
                (c.email?.ToLower().Contains(query) ?? false)
            ).ToList();
            ShowCustomers(filtered);
        }

        private void CustomerListView_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (CustomerListView.SelectedItem is CustomerModel customer)
            {
                GlobalState.Instance.SelectedCustomer = customer;
                NavigationService.Navigate(new ProductsPage());
            }
        }

        private void WalkIn_Click(object sender, RoutedEventArgs e)
        {
            GlobalState.Instance.SelectedCustomer = new CustomerModel { id = 0, name = "Walk-in Customer", phone = "" };
            NavigationService.Navigate(new ProductsPage());
        }

        private void Cancel_Click(object sender, RoutedEventArgs e) => NavigationService.GoBack();
    }
}


