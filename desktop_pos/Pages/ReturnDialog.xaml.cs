using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using DesktopPOS.Services;

namespace DesktopPOS.Pages
{
    public partial class ReturnDialog : Window
    {
        private readonly ApiService _api = new ApiService();
        private ReturnInvoiceData? _currentInvoice;
        public ObservableCollection<ReturnInvoiceItem> ReturnItems { get; set; } = new ObservableCollection<ReturnInvoiceItem>();

        public ReturnDialog()
        {
            InitializeComponent();
            ItemsGrid.ItemsSource = ReturnItems;
            SearchBox.Focus();
        }

        private async void SearchButton_Click(object sender, RoutedEventArgs e)
        {
            await SearchInvoiceAsync();
        }

        private async void SearchBox_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
            {
                await SearchInvoiceAsync();
            }
        }

        private async System.Threading.Tasks.Task SearchInvoiceAsync()
        {
            var invoiceNo = SearchBox.Text.Trim();
            if (string.IsNullOrEmpty(invoiceNo)) return;

            StatusMessage.Text = "Searching...";
            StatusMessage.Foreground = (System.Windows.Media.Brush)FindResource("TextPrimary");
            StatusMessage.Visibility = Visibility.Visible;
            ItemsGrid.Visibility = Visibility.Collapsed;
            ReturnItems.Clear();
            _currentInvoice = null;
            UpdateTotals();
            ProcessButton.IsEnabled = false;

            var res = await _api.FetchInvoiceForReturnAsync(invoiceNo);

            if (res != null && res.status == "success" && res.data != null && res.data.invoice != null)
            {
                StatusMessage.Visibility = Visibility.Collapsed;
                _currentInvoice = res.data.invoice;
                CustomerNameText.Text = $"Customer: {_currentInvoice.customer_name} | Orig Total: LKR {_currentInvoice.grand_total:N2}";
                
                if (res.data.items != null)
                {
                    foreach (var item in res.data.items)
                    {
                        item.return_qty = 0;
                        item.refund_amount = 0;
                        ReturnItems.Add(item);
                    }
                }
                ItemsGrid.Visibility = Visibility.Visible;
            }
            else
            {
                StatusMessage.Text = res?.message ?? "Invoice not found or network error.";
                StatusMessage.Foreground = (System.Windows.Media.Brush)FindResource("AccentDanger");
            }
        }

        private void ReturnQty_TextChanged(object sender, TextChangedEventArgs e)
        {
            var textBox = sender as TextBox;
            if (textBox != null && textBox.DataContext is ReturnInvoiceItem item)
            {
                if (double.TryParse(textBox.Text, out double newReturnQty))
                {
                    var maxAllowed = item.quantity - item.returned_qty;
                    if (newReturnQty < 0) newReturnQty = 0;
                    if (newReturnQty > maxAllowed) newReturnQty = maxAllowed;

                    item.return_qty = newReturnQty;
                    item.refund_amount = newReturnQty * item.unit_price;
                    
                    // Only update the textbox if the value was constrained, to avoid cursor jumping
                    if (newReturnQty.ToString() != textBox.Text)
                    {
                        textBox.Text = newReturnQty.ToString();
                        textBox.SelectionStart = textBox.Text.Length;
                    }
                    
                    Dispatcher.BeginInvoke(new Action(UpdateTotals), System.Windows.Threading.DispatcherPriority.Background);
                }
            }
        }

        private void UpdateTotals()
        {
            double totalRefund = ReturnItems.Sum(i => i.refund_amount);
            TotalRefundText.Text = $"Total Refund: LKR {totalRefund:N2}";
            ProcessButton.IsEnabled = totalRefund > 0;
        }

        private async void ProcessButton_Click(object sender, RoutedEventArgs e)
        {
            if (_currentInvoice == null) return;

            var itemsToReturn = ReturnItems.Where(i => i.return_qty > 0).ToList();
            if (!itemsToReturn.Any())
            {
                MessageBox.Show("Please specify quantities to return.", "Validation Error", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            var totalRefund = itemsToReturn.Sum(i => i.refund_amount);

            var result = MessageBox.Show($"Are you sure you want to process a return of LKR {totalRefund:N2}?", "Confirm Return", MessageBoxButton.YesNo, MessageBoxImage.Question);
            if (result != MessageBoxResult.Yes) return;

            ProcessButton.IsEnabled = false;
            ProcessButton.Content = "Processing...";

            var payload = new ReturnPayload
            {
                invoice_id = _currentInvoice.id,
                customer_id = _currentInvoice.customer_id,
                location_id = GlobalState.Instance.CurrentUser?.location_id ?? 1,
                reason = "POS Quick Return",
                total_amount = totalRefund,
                items = itemsToReturn.Select(i => new ReturnPayloadItem
                {
                    item_type = i.item_type,
                    item_id = i.item_id.ToString(),
                    description = i.description,
                    quantity = i.return_qty,
                    unit_price = i.unit_price,
                    line_total = i.refund_amount
                }).ToList(),
                refund = null
            };

            var res = await _api.ProcessReturnAsync(payload);

            if (res != null && res.status == "success")
            {
                MessageBox.Show("Return processed successfully!\n\nStock has been restored. Please proceed to the Financial Refund dialog to release the payment.", "Success", MessageBoxButton.OK, MessageBoxImage.Information);
                
                try
                {
                    string returnNo = "SR-TEMP";
                    if (res.data != null)
                    {
                        var dataObj = Newtonsoft.Json.Linq.JObject.FromObject(res.data);
                        returnNo = dataObj["return_no"]?.ToString() ?? "SR-TEMP";
                    }
                    
                    var locName = GlobalState.Instance.CurrentUser?.location_name ?? "Main Branch";
                    var custName = _currentInvoice.customer_name ?? "Walk-in Customer";
                    
                    var panel = PrintService.BuildReturnReceiptPanel(
                        locName,
                        returnNo,
                        _currentInvoice.invoice_no ?? "",
                        custName,
                        itemsToReturn,
                        totalRefund,
                        payload.reason
                    );
                    
                    PrintService.ShowReceiptPreview(
                        $"Return Note - {returnNo}",
                        panel,
                        () => PrintService.PrintReturnReceipt(
                            locName,
                            returnNo,
                            _currentInvoice.invoice_no ?? "",
                            custName,
                            itemsToReturn,
                            totalRefund,
                            payload.reason
                        ),
                        this
                    );
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Failed to print return note: {ex.Message}", "Print Error", MessageBoxButton.OK, MessageBoxImage.Warning);
                }

                this.DialogResult = true;
                this.Close();
            }
            else
            {
                MessageBox.Show(res?.message ?? "An error occurred while processing the return.", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                ProcessButton.IsEnabled = true;
                ProcessButton.Content = "Process Return";
            }
        }

        private void CancelButton_Click(object sender, RoutedEventArgs e)
        {
            this.DialogResult = false;
            this.Close();
        }
    }
}
