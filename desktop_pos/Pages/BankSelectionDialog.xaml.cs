using DesktopPOS.Services;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace DesktopPOS.Pages
{
    public partial class BankSelectionDialog : Window
    {
        private readonly ApiService _api = new();
        private List<BankModel> _allBanks = new();
        public BankModel? SelectedBank { get; private set; }

        public BankSelectionDialog()
        {
            InitializeComponent();
            Loaded += async (s, e) => await LoadBanks();
            PreviewKeyDown += BankSelectionDialog_PreviewKeyDown;
            
            Loaded += (s, e) => SearchBox.Focus();
        }

        private void BankSelectionDialog_PreviewKeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Escape)
            {
                DialogResult = false;
                Close();
                e.Handled = true;
            }
        }

        private void SearchBox_PreviewKeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Tab || e.Key == Key.Down)
            {
                if (BankListView.Items.Count > 0)
                {
                    if (BankListView.SelectedIndex < 0)
                    {
                        BankListView.SelectedIndex = 0;
                    }
                    var item = (ListBoxItem)BankListView.ItemContainerGenerator.ContainerFromIndex(BankListView.SelectedIndex);
                    item?.Focus();
                    e.Handled = true;
                }
            }
            else if (e.Key == Key.Enter)
            {
                if (BankListView.Items.Count > 0)
                {
                    if (BankListView.SelectedIndex < 0)
                    {
                        BankListView.SelectedIndex = 0;
                    }
                    SelectedBank = BankListView.SelectedItem as BankModel;
                    DialogResult = true;
                    Close();
                    e.Handled = true;
                }
            }
        }

        private void BankListView_PreviewKeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
            {
                if (BankListView.SelectedItem is BankModel bank)
                {
                    SelectedBank = bank;
                    DialogResult = true;
                    Close();
                    e.Handled = true;
                }
            }
        }

        private async System.Threading.Tasks.Task LoadBanks()
        {
            LoadingPanel.Visibility = Visibility.Visible;
            BankListView.Visibility = Visibility.Collapsed;
            EmptyPanel.Visibility = Visibility.Collapsed;

            try
            {
                var result = await _api.FetchBanksAsync();
                _allBanks = result ?? new List<BankModel>();
                ShowBanks(_allBanks);
            }
            catch
            {
                ShowBanks(new List<BankModel>());
            }
        }

        private void ShowBanks(List<BankModel> banks)
        {
            LoadingPanel.Visibility = Visibility.Collapsed;
            if (banks == null || banks.Count == 0)
            {
                EmptyPanel.Visibility = Visibility.Visible;
                BankListView.Visibility = Visibility.Collapsed;
            }
            else
            {
                EmptyPanel.Visibility = Visibility.Collapsed;
                BankListView.Visibility = Visibility.Visible;
                BankListView.ItemsSource = banks;
            }
        }

        private void SearchBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            var query = SearchBox.Text.ToLower();
            var filtered = _allBanks.Where(b =>
                (b.name?.ToLower().Contains(query) ?? false) ||
                (b.code?.ToLower().Contains(query) ?? false)
            ).ToList();
            ShowBanks(filtered);
        }

        private void BankListView_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (BankListView.SelectedItem is BankModel bank)
            {
                SelectedBank = bank;
                DialogResult = true;
                Close();
            }
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }
    }
}
