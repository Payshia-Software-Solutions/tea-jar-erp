using DesktopPOS.Services;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace DesktopPOS.Pages
{
    public partial class CustomerSelectionDialog : Window
    {
        private readonly ApiService _api = new();
        private List<CustomerModel> _allCustomers = new();
        public CustomerModel? SelectedCustomer { get; private set; }

        public CustomerSelectionDialog()
        {
            InitializeComponent();
            Loaded += async (s, e) => await LoadCustomers();
            PreviewKeyDown += CustomerSelectionDialog_PreviewKeyDown;
        }

        private void CustomerSelectionDialog_PreviewKeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Escape)
            {
                DialogResult = false;
                e.Handled = true;
            }
        }

        private async System.Threading.Tasks.Task LoadCustomers()
        {
            LoadingPanel.Visibility = Visibility.Visible;
            CustomerListView.Visibility = Visibility.Collapsed;
            EmptyPanel.Visibility = Visibility.Collapsed;

            try
            {
                var result = await _api.FetchCustomersAsync();
                _allCustomers = result ?? new List<CustomerModel>();
                ShowCustomers(_allCustomers);
            }
            catch
            {
                ShowCustomers(new List<CustomerModel>());
            }
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
                SelectedCustomer = customer;
                DialogResult = true;
            }
        }

        private void WalkIn_Click(object sender, RoutedEventArgs e)
        {
            SelectedCustomer = new CustomerModel { id = 0, name = "Walk-in Customer", phone = "" };
            DialogResult = true;
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
        }
    }
}
