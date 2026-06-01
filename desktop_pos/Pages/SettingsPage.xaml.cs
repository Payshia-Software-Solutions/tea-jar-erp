using System;
using System.Linq;
using System.Printing;
using System.Windows;
using System.Windows.Controls;
using System.Collections.Generic;
using DesktopPOS.Services;
using DesktopPOS.Models;

namespace DesktopPOS.Pages
{
    public partial class SettingsPage : Page
    {
        private readonly ApiService _api = new();
        private int _selectedDefaultCustomerId;
        private string _selectedDefaultCustomerName = "";

        public SettingsPage()
        {
            InitializeComponent();
            LoadPrinters();
            LoadDefaultCustomer();
            LoadThemeSetting();
            Loaded += async (s, e) => await LoadLocationInfo();
        }

        private void LoadDefaultCustomer()
        {
            _selectedDefaultCustomerId = SettingsService.Current.DefaultCustomerId;
            _selectedDefaultCustomerName = SettingsService.Current.DefaultCustomerName;
            DefaultCustomerText.Text = string.IsNullOrEmpty(_selectedDefaultCustomerName) ? "Select Customer..." : _selectedDefaultCustomerName;
        }

        private void LoadThemeSetting()
        {
            ThemeComboBox.SelectedIndex = SettingsService.Current.IsDarkTheme ? 0 : 1;
        }

        private async System.Threading.Tasks.Task LoadLocationInfo()
        {
            var user = GlobalState.Instance.CurrentUser;
            if (user != null)
            {
                BranchNameText.Text = user.location_name ?? "Main Branch";
                
                // Show Server URL configuration only if user is Admin
                if (user.role?.ToLower() == "admin" || user.role?.ToLower().Contains("admin") == true)
                {
                    ServerUrlCard.Visibility = Visibility.Visible;
                    ServerUrlTextBox.Text = StorageService.LoadServerUrl();
                }
                else
                {
                    ServerUrlCard.Visibility = Visibility.Collapsed;
                }
                
                var locationDetails = await _api.FetchLocationDetailsAsync(user.location_id);
                var allTaxes = await _api.FetchTaxesAsync();
                
                if (locationDetails != null && !string.IsNullOrEmpty(locationDetails.allowed_taxes_json) && allTaxes != null)
                {
                    try
                    {
                        var allowedTaxIds = Newtonsoft.Json.JsonConvert.DeserializeObject<List<string>>(locationDetails.allowed_taxes_json);
                        if (allowedTaxIds != null)
                        {
                            var activeTaxes = allTaxes.Where(t => t.is_active == 1 && allowedTaxIds.Contains(t.id.ToString()))
                                                      .OrderBy(t => t.sort_order).ToList();
                            ActiveTaxesList.ItemsSource = activeTaxes;
                        }
                    }
                    catch { }
                }
            }
            else
            {
                ServerUrlCard.Visibility = Visibility.Visible;
                ServerUrlTextBox.Text = StorageService.LoadServerUrl();
                BranchNameText.Text = "Not Logged In";
            }
        }

        private void LoadPrinters()
        {
            try
            {
                using var printServer = new LocalPrintServer();
                var printQueues = printServer.GetPrintQueues(new[] { EnumeratedPrintQueueTypes.Local, EnumeratedPrintQueueTypes.Connections });
                
                var printers = printQueues.Select(q => q.FullName).ToList();
                printers.Insert(0, "None"); // Option to disable printing
                
                ReceiptPrinterComboBox.ItemsSource = printers;
                KotPrinterComboBox.ItemsSource = printers;

                // Select the saved printer or "None"
                string savedReceiptPrinter = SettingsService.Current.ReceiptPrinterName;
                if (!string.IsNullOrEmpty(savedReceiptPrinter) && printers.Contains(savedReceiptPrinter))
                {
                    ReceiptPrinterComboBox.SelectedItem = savedReceiptPrinter;
                }
                else
                {
                    ReceiptPrinterComboBox.SelectedIndex = 0;
                }

                string savedKotPrinter = SettingsService.Current.KotPrinterName;
                if (!string.IsNullOrEmpty(savedKotPrinter) && printers.Contains(savedKotPrinter))
                {
                    KotPrinterComboBox.SelectedItem = savedKotPrinter;
                }
                else
                {
                    KotPrinterComboBox.SelectedIndex = 0;
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to load printers: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                ReceiptPrinterComboBox.ItemsSource = new[] { "None" };
                ReceiptPrinterComboBox.SelectedIndex = 0;
                KotPrinterComboBox.ItemsSource = new[] { "None" };
                KotPrinterComboBox.SelectedIndex = 0;
            }
        }

        private void SaveSettings_Click(object sender, RoutedEventArgs e)
        {
            // Save Server URL if visible
            if (ServerUrlCard.Visibility == Visibility.Visible)
            {
                var newUrl = ServerUrlTextBox.Text.Trim();
                if (!string.IsNullOrEmpty(newUrl))
                {
                    StorageService.SaveServerUrl(newUrl);
                    ApiService.BaseUrl = newUrl; // Update in-memory BaseUrl immediately
                }
            }

            var selectedReceipt = ReceiptPrinterComboBox.SelectedItem?.ToString();
            var selectedKot = KotPrinterComboBox.SelectedItem?.ToString();
            
            SettingsService.Current.ReceiptPrinterName = (selectedReceipt == "None") ? "" : selectedReceipt ?? "";
            SettingsService.Current.KotPrinterName = (selectedKot == "None") ? "" : selectedKot ?? "";
            SettingsService.Current.DefaultCustomerId = _selectedDefaultCustomerId;
            SettingsService.Current.DefaultCustomerName = _selectedDefaultCustomerName;
            
            bool isDark = ThemeComboBox.SelectedIndex == 0;
            SettingsService.Current.IsDarkTheme = isDark;
            
            SettingsService.SaveSettings();
            
            // Apply theme immediately
            ThemeManager.SetTheme(isDark);

            MessageBox.Show("Settings saved successfully!", "Success", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private void SelectDefaultCustomer_Click(object sender, RoutedEventArgs e)
        {
            var dialog = new CustomerSelectionDialog();
            dialog.Owner = Window.GetWindow(this);
            if (dialog.ShowDialog() == true && dialog.SelectedCustomer != null)
            {
                _selectedDefaultCustomerId = dialog.SelectedCustomer.id;
                _selectedDefaultCustomerName = dialog.SelectedCustomer.name ?? "Walk-in Customer";
                DefaultCustomerText.Text = _selectedDefaultCustomerName;
            }
        }

        private void Back_Click(object sender, RoutedEventArgs e)
        {
            if (Window.GetWindow(this) is MainWindow mw)
            {
                if (GlobalState.Instance.CurrentUser == null)
                {
                    mw.MainFrame.Navigate(new LoginPage());
                }
                else
                {
                    mw.MainFrame.Navigate(new DashboardPage());
                }
            }
        }

        private void TestReceiptPrinter_Click(object sender, RoutedEventArgs e)
        {
            var printerName = ReceiptPrinterComboBox.SelectedItem?.ToString();
            if (string.IsNullOrEmpty(printerName) || printerName == "None") return;
            PrintTest(printerName, "Receipt Printer Test");
        }

        private void TestKotPrinter_Click(object sender, RoutedEventArgs e)
        {
            var printerName = KotPrinterComboBox.SelectedItem?.ToString();
            if (string.IsNullOrEmpty(printerName) || printerName == "None") return;
            PrintTest(printerName, "KOT Printer Test");
        }

        private void PrintTest(string printerName, string testType)
        {
            if (string.IsNullOrEmpty(printerName))
            {
                MessageBox.Show($"Please select a {testType} printer first.", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                return;
            }

            try
            {
                var pd = new System.Windows.Controls.PrintDialog();
                pd.PrintQueue = new System.Printing.LocalPrintServer().GetPrintQueue(printerName);

                var doc = new System.Windows.Documents.FlowDocument();
                doc.PagePadding = new Thickness(0);
                doc.Blocks.Add(new System.Windows.Documents.Paragraph(new System.Windows.Documents.Run($"--- {testType} TEST PRINT ---")));
                doc.Blocks.Add(new System.Windows.Documents.Paragraph(new System.Windows.Documents.Run("Connection successful!")));
                doc.Blocks.Add(new System.Windows.Documents.Paragraph(new System.Windows.Documents.Run("-------------------------")));

                pd.PrintDocument(((System.Windows.Documents.IDocumentPaginatorSource)doc).DocumentPaginator, $"{testType} Test Page");
                MessageBox.Show($"Test page sent to {printerName} successfully.", "Success", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to print to {printerName}:\n{ex.Message}", "Print Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void ClearCache_Click(object sender, RoutedEventArgs e)
        {
            ApiService.ClearCache();
            MessageBox.Show("Application caches cleared successfully. Products, tables, and steward data will be refreshed from the server.", "Cache Cleared", MessageBoxButton.OK, MessageBoxImage.Information);
        }
    }
}
