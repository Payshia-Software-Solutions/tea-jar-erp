using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using DesktopPOS.Services;

namespace DesktopPOS.Pages
{
    public partial class InvoiceReprintDialog : Window
    {
        private readonly ApiService _api = new ApiService();

        public InvoiceReprintDialog()
        {
            InitializeComponent();
            DatePickerField.SelectedDate = DateTime.Today;
            Loaded += async (s, e) => await LoadInvoices();
        }

        private async Task LoadInvoices()
        {
            LoadingText.Visibility = Visibility.Visible;
            InvoicesGrid.Visibility = Visibility.Collapsed;
            PrintBtn.IsEnabled = false;

            string? dateStr = DatePickerField.SelectedDate?.ToString("yyyy-MM-dd");
            var res = await _api.FetchInvoicesAsync(dateStr);

            if (res != null && res.status == "success" && res.data != null)
            {
                InvoicesGrid.ItemsSource = res.data;
                LoadingText.Visibility = Visibility.Collapsed;
                InvoicesGrid.Visibility = Visibility.Visible;
            }
            else
            {
                LoadingText.Text = "Failed to load invoices or no invoices found.";
                LoadingText.Foreground = (System.Windows.Media.Brush)FindResource("AccentDanger");
            }
        }

        private async void Refresh_Click(object sender, RoutedEventArgs e)
        {
            await LoadInvoices();
        }

        private async void DatePickerField_SelectedDateChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
        {
            await LoadInvoices();
        }

        private async void ClearDate_Click(object sender, RoutedEventArgs e)
        {
            DatePickerField.SelectedDate = null;
            await LoadInvoices();
        }

        private void InvoicesGrid_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
        {
            var item = InvoicesGrid.SelectedItem as InvoiceListItem;
            PrintBtn.IsEnabled = item != null && !string.IsNullOrEmpty(item.invoice_no);
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            this.Close();
        }

        private void Window_PreviewKeyDown(object sender, System.Windows.Input.KeyEventArgs e)
        {
            if (e.Key == System.Windows.Input.Key.Escape)
            {
                this.Close();
                e.Handled = true;
            }
            else if (e.Key == System.Windows.Input.Key.P || (e.Key == System.Windows.Input.Key.P && (System.Windows.Input.Keyboard.Modifiers & System.Windows.Input.ModifierKeys.Control) == System.Windows.Input.ModifierKeys.Control))
            {
                if (PrintBtn.IsEnabled)
                {
                    PrintBtn.RaiseEvent(new RoutedEventArgs(System.Windows.Controls.Primitives.ButtonBase.ClickEvent));
                }
                e.Handled = true;
            }
        }

        private async void Print_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                if (InvoicesGrid.SelectedItem is InvoiceListItem item && !string.IsNullOrEmpty(item.invoice_no))
                {
                    PrintBtn.IsEnabled = false;
                    PrintBtn.Content = "Printing...";

                    var res = await _api.FetchInvoiceForReturnAsync(item.invoice_no);

                    if (res != null && res.status == "success" && res.data != null && res.data.invoice != null)
                    {
                        var invoiceData = res.data.invoice;

                        var printItems = res.data.items?.Select(i => new DesktopPOS.Services.CartItem
                        {
                            ProductId = i.item_id,
                            Name = i.description,
                            Price = i.unit_price,
                            Quantity = i.quantity,
                            Discount = i.discount,
                            ItemType = i.item_type
                        }).ToList() ?? new System.Collections.Generic.List<DesktopPOS.Services.CartItem>();

                        var receiptPanel = DesktopPOS.Services.PrintService.BuildReceiptPanel(
                            DesktopPOS.Services.GlobalState.Instance.CurrentUser?.location_name ?? "Store",
                            invoiceData,
                            printItems,
                            res.data.invoice.grand_total,
                            res.data.invoice.paid_amount,
                            0, // Balance
                            300, // width for preview window
                            true // isReprint
                        );

                        DesktopPOS.Services.PrintService.ShowReceiptPreview(
                            $"Receipt Preview \u2014 Invoice {invoiceData.invoice_no} (Reprint)",
                            receiptPanel,
                            () => DesktopPOS.Services.PrintService.PrintReceipt(
                                DesktopPOS.Services.GlobalState.Instance.CurrentUser?.location_name ?? "Store",
                                invoiceData,
                                printItems,
                                res.data.invoice.grand_total,
                                res.data.invoice.paid_amount,
                                0,
                                true
                            ),
                            this
                        );
                    }
                    else
                    {
                        MessageBox.Show("Failed to load invoice details for printing.", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                    }

                    PrintBtn.IsEnabled = true;
                    PrintBtn.Content = "Reprint Selected";
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error during print: {ex.Message}", "Print Error", MessageBoxButton.OK, MessageBoxImage.Error);
                PrintBtn.IsEnabled = true;
                PrintBtn.Content = "Reprint Selected";
            }
        }
    }
}
