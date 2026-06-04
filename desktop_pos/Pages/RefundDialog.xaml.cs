using System;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using DesktopPOS.Services;

namespace DesktopPOS.Pages
{
    public partial class RefundDialog : Window
    {
        private readonly ApiService _api = new ApiService();
        private ReturnLookupResponse? _loadedReturn;

        public RefundDialog()
        {
            InitializeComponent();
            SearchBox.Focus();
            Loaded += async (s, e) => await LoadPendingRefundsAsync();
        }

        private async System.Threading.Tasks.Task LoadPendingRefundsAsync()
        {
            ListStatusText.Text = "Loading returns...";
            ListStatusText.Visibility = Visibility.Visible;
            PendingRefundsList.ItemsSource = null;

            var res = await _api.FetchUnrefundedReturnsAsync();
            ListStatusText.Visibility = Visibility.Collapsed;

            if (res != null && res.status == "success" && res.data != null)
            {
                if (res.data.Count > 0)
                {
                    PendingRefundsList.ItemsSource = res.data;
                }
                else
                {
                    ListStatusText.Text = "No pending refunds.";
                    ListStatusText.Visibility = Visibility.Visible;
                }
            }
            else
            {
                ListStatusText.Text = "Failed to load.";
                ListStatusText.Visibility = Visibility.Visible;
            }
        }

        private async void PendingRefundsList_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            var selected = PendingRefundsList.SelectedItem as ReturnLookupData;
            if (selected != null && !string.IsNullOrEmpty(selected.return_no))
            {
                SearchBox.Text = selected.return_no;
                await LookupReturnAsync(selected.return_no);
            }
        }

        private async void LookupButton_Click(object sender, RoutedEventArgs e)
        {
            await LookupReturnAsync(SearchBox.Text.Trim());
        }

        private async void SearchBox_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
            {
                await LookupReturnAsync(SearchBox.Text.Trim());
            }
        }

        private async System.Threading.Tasks.Task LookupReturnAsync(string returnNo)
        {
            if (string.IsNullOrEmpty(returnNo)) return;

            StatusMessage.Text = "Loading return details...";
            StatusMessage.Foreground = (Brush)FindResource("TextPrimary");
            StatusMessage.Visibility = Visibility.Visible;
            DetailsContainer.Visibility = Visibility.Collapsed;
            ProcessButton.IsEnabled = false;
            _loadedReturn = null;

            var res = await _api.LookupReturnForRefundAsync(returnNo);

            if (res != null && res.status == "success" && res.data?.ReturnDoc != null)
            {
                StatusMessage.Visibility = Visibility.Collapsed;
                _loadedReturn = res.data;

                var ret = _loadedReturn.ReturnDoc;
                ReturnNoText.Text = $"Return#: {ret.return_no}";
                CustomerNameText.Text = $"Customer: {ret.customer_name ?? "Walk-in Customer"}";
                InvoiceNoText.Text = $"Orig. Invoice: {ret.invoice_no}";
                ReasonText.Text = string.IsNullOrEmpty(ret.reason) ? "Reason: Not Specified" : $"Reason: {ret.reason}";
                TotalRefundText.Text = $"Refund Amount: LKR {ret.total_amount:N2}";

                ItemsList.ItemsSource = _loadedReturn.items;
                DetailsContainer.Visibility = Visibility.Visible;

                if (_loadedReturn.is_refunded)
                {
                    RefundStatusText.Text = "Status: REFUNDED";
                    RefundStatusText.Foreground = (Brush)FindResource("AccentSuccess");
                    PaymentForm.IsEnabled = false;
                    ProcessButton.IsEnabled = false;
                    MessageBox.Show("This return document has already been refunded.", "Already Paid", MessageBoxButton.OK, MessageBoxImage.Information);
                }
                else
                {
                    RefundStatusText.Text = "Status: UNPAID";
                    RefundStatusText.Foreground = (Brush)FindResource("AccentWarning");
                    PaymentForm.IsEnabled = true;
                    ProcessButton.IsEnabled = true;
                }
            }
            else
            {
                StatusMessage.Text = res?.message ?? "Return document not found or network error.";
                StatusMessage.Foreground = (Brush)FindResource("AccentDanger");
            }
        }

        private void MethodComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (RefLabel == null || RefTextBox == null) return;
            var item = MethodComboBox.SelectedItem as ComboBoxItem;
            if (item != null)
            {
                if (item.Content.ToString() == "Bank Transfer")
                {
                    RefLabel.Text = "Reference No (Required)";
                }
                else
                {
                    RefLabel.Text = "Reference No (Optional)";
                }
            }
        }

        private async void ProcessButton_Click(object sender, RoutedEventArgs e)
        {
            if (_loadedReturn?.ReturnDoc == null) return;

            var retObj = _loadedReturn.ReturnDoc;
            var methodItem = MethodComboBox.SelectedItem as ComboBoxItem;
            var method = methodItem?.Content?.ToString() ?? "Cash";
            var reference = RefTextBox.Text.Trim();

            if (method == "Bank Transfer" && string.IsNullOrEmpty(reference))
            {
                MessageBox.Show("Reference Number is required for Bank Transfers.", "Validation Error", MessageBoxButton.OK, MessageBoxImage.Warning);
                RefTextBox.Focus();
                return;
            }

            var confirm = MessageBox.Show($"Confirm financial refund release of LKR {retObj.total_amount:N2} via {method}?", "Confirm Refund", MessageBoxButton.YesNo, MessageBoxImage.Question);
            if (confirm != MessageBoxResult.Yes) return;

            ProcessButton.IsEnabled = false;
            ProcessButton.Content = "Processing...";

            var payload = new RefundCreatePayload
            {
                return_id = retObj.id,
                invoice_id = retObj.invoice_id,
                location_id = retObj.location_id,
                amount = retObj.total_amount,
                payment_method = method,
                reference_no = reference,
                notes = "POS Return Refund"
            };

            var res = await _api.CreateRefundAsync(payload);

            if (res != null && res.status == "success")
            {
                MessageBox.Show($"Refund processed successfully!\n\nReceipt/Voucher No: {res.data?.refund_no}", "Success", MessageBoxButton.OK, MessageBoxImage.Information);
                
                // Print Preview
                try
                {
                    var locName = retObj.location_name;
                    if (string.IsNullOrEmpty(locName)) locName = GlobalState.Instance.LocationName ?? "KDU Group";

                    var refNo = res.data?.refund_no ?? "";
                    var retNo = retObj.return_no ?? "";
                    var invNo = retObj.invoice_no ?? "";
                    var custName = retObj.customer_name ?? "Walk-in Customer";
                    var amt = retObj.total_amount;

                    var receiptPanel = PrintService.BuildRefundReceiptPanel(locName, refNo, retNo, invNo, custName, amt, method, reference);
                    PrintService.ShowReceiptPreview(
                        "Refund Receipt Preview",
                        receiptPanel,
                        () => PrintService.PrintRefundReceipt(locName, refNo, retNo, invNo, custName, amt, method, reference),
                        this
                    );
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Could not open print preview: {ex.Message}", "Print Preview Error", MessageBoxButton.OK, MessageBoxImage.Warning);
                }

                // Reset right side UI
                DetailsContainer.Visibility = Visibility.Collapsed;
                StatusMessage.Text = "Select a pending return from the left or search manually.";
                StatusMessage.Foreground = (Brush)FindResource("TextMuted");
                SearchBox.Text = "";
                
                // Refresh list on left side
                await LoadPendingRefundsAsync();
            }
            else
            {
                MessageBox.Show(res?.message ?? "Failed to process refund payment.", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                ProcessButton.IsEnabled = true;
                ProcessButton.Content = "Issue Refund";
            }
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            this.DialogResult = false;
            this.Close();
        }
    }
}
