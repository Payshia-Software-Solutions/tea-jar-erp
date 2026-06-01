using DesktopPOS.Services;
using DesktopPOS.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Documents;
using System.Windows.Media;


namespace DesktopPOS.Pages
{
    public partial class CheckoutDialog : Window
    {
        private double _grandTotal;
        private readonly double _discount;
        private readonly ApiService _api = new();
        private string _paymentMethod = "Cash";

        // Card Details state
        private string _cardType = "Visa";
        private string _cardLast4 = "";
        private string _cardAuthCode = "";

        // Cheque Details state
        private string _chequeNo = "";
        private string _chequeDate = "";
        private string _chequeBank = "";

        // Bank Transfer details state
        private string _bankTransferRef = "";
        private string _bankTransferBank = "";

        private List<TaxModel> _activeTaxes = new();
        private List<object> _appliedTaxesList = new();
        private double _taxTotal = 0;

        public CheckoutDialog(double grandTotal, double discount)
        {
            InitializeComponent();
            _grandTotal = grandTotal;
            _discount = discount;
            
            // Set owner to center correctly
            Owner = Application.Current.MainWindow;

            // Set grand total display
            GrandTotalDisplay.Text = $"LKR {_grandTotal:N2}";
            TenderedBox.Text = _grandTotal.ToString("F2");
            TenderedBox.Focus();
            TenderedBox.SelectAll();

            // Set Billing Customer Details
            var customer = GlobalState.Instance.SelectedCustomer;
            if (customer != null)
            {
                CustomerNameText.Text = customer.name ?? "Walk-in Customer";
                CustomerPhoneText.Text = customer.phone ?? "No Phone Attached";
            }

            // Set Default Active Buttons
            HighlightActivePaymentMethod();

            // Close dialog on Escape key
            this.PreviewKeyDown += Window_PreviewKeyDown;

            Loaded += async (s, e) => {
                await LoadAndCalculateTaxes();
            };
        }

        private void Window_PreviewKeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Escape)
            {
                if (!ConfirmButton.IsEnabled) 
                {
                    e.Handled = true;
                    return; // Prevent closing while processing
                }
                Cancel_Click(this, new RoutedEventArgs());
                e.Handled = true;
            }
            else if (e.Key == Key.Delete || e.Key == Key.C)
            {
                TenderedBox.Text = "0";
                TenderedBox.Focus();
                TenderedBox.SelectAll();
                e.Handled = true;
            }
            else if (e.Key == Key.Enter || e.Key == Key.F9)
            {
                if (FocusManager.GetFocusedElement(this) is Button btn && btn != ConfirmButton)
                {
                    return;
                }
                ConfirmPayment_Click(this, new RoutedEventArgs());
                e.Handled = true;
            }
        }

        private void PaymentMethodBtn_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn)
            {
                string previousMethod = _paymentMethod;

                if (btn == CashBtn)
                {
                    _paymentMethod = "Cash";
                }
                else if (btn == CardBtn)
                {
                    var detailsDlg = new CardDetailsDialog(_cardType, _cardLast4, _cardAuthCode);
                    detailsDlg.Owner = this;
                    if (detailsDlg.ShowDialog() == true)
                    {
                        _paymentMethod = "Card";
                        _cardType = detailsDlg.CardType;
                        _cardLast4 = detailsDlg.CardLast4;
                        _cardAuthCode = detailsDlg.CardAuthCode;
                    }
                    else
                    {
                        // If user cancels and card details are empty, don't switch to card
                        if (string.IsNullOrEmpty(_cardLast4)) return;
                    }
                }
                else if (btn == ChequeBtn)
                {
                    var detailsDlg = new ChequeDetailsDialog(_chequeNo, _chequeDate, _chequeBank);
                    detailsDlg.Owner = this;
                    if (detailsDlg.ShowDialog() == true)
                    {
                        _paymentMethod = "Cheque";
                        _chequeNo = detailsDlg.ChequeNo;
                        _chequeDate = detailsDlg.ChequeDate;
                        _chequeBank = detailsDlg.ChequeBank;
                    }
                    else
                    {
                        if (string.IsNullOrEmpty(_chequeNo)) return;
                    }
                }
                else if (btn == TransferBtn)
                {
                    var detailsDlg = new BankTransferDetailsDialog(_bankTransferRef, _bankTransferBank);
                    detailsDlg.Owner = this;
                    if (detailsDlg.ShowDialog() == true)
                    {
                        _paymentMethod = "Bank Transfer";
                        _bankTransferRef = detailsDlg.ReferenceNo;
                        _bankTransferBank = detailsDlg.BankName;
                    }
                    else
                    {
                        if (string.IsNullOrEmpty(_bankTransferRef)) return;
                    }
                }
                else if (btn == CreditBtn)
                {
                    _paymentMethod = "Credit";
                }

                HighlightActivePaymentMethod();
            }
        }

        private void HighlightActivePaymentMethod()
        {
            var activeBg = (Brush)FindResource("AccentPrimary");
            var activeFg = Brushes.White;
            var inactiveBg = (Brush)FindResource("BgCard");
            var inactiveFg = (Brush)FindResource("TextSecondary");
            var activeBorder = (Brush)FindResource("AccentPrimary");
            var inactiveBorder = (Brush)FindResource("BorderPrimary");

            // Reset buttons
            foreach (var b in new[] { CashBtn, CardBtn, ChequeBtn, TransferBtn })
            {
                b.Background = inactiveBg;
                b.Foreground = inactiveFg;
                b.BorderBrush = inactiveBorder;
            }

            // Reset Credit button to standard danger outlines
            CreditBtn.Background = Brushes.Transparent;
            CreditBtn.BorderBrush = (Brush)FindResource("AccentDanger");
            CreditBtn.Foreground = (Brush)FindResource("AccentDanger");

            // Set Active
            if (_paymentMethod == "Cash")
            {
                CashBtn.Background = activeBg;
                CashBtn.Foreground = activeFg;
                CashBtn.BorderBrush = activeBorder;
            }
            else if (_paymentMethod == "Card")
            {
                CardBtn.Background = activeBg;
                CardBtn.Foreground = activeFg;
                CardBtn.BorderBrush = activeBorder;
            }
            else if (_paymentMethod == "Cheque")
            {
                ChequeBtn.Background = activeBg;
                ChequeBtn.Foreground = activeFg;
                ChequeBtn.BorderBrush = activeBorder;
            }
            else if (_paymentMethod == "Bank Transfer")
            {
                TransferBtn.Background = activeBg;
                TransferBtn.Foreground = activeFg;
                TransferBtn.BorderBrush = activeBorder;
            }
            else if (_paymentMethod == "Credit")
            {
                CreditBtn.Background = (Brush)FindResource("IconBgRed");
                CreditBtn.Foreground = (Brush)FindResource("IconFgRed");
                CreditBtn.BorderBrush = (Brush)FindResource("IconFgRed");
            }

            // Toggle tendered panel visibility
            TenderedPanel.Visibility = (_paymentMethod == "Cash" || _paymentMethod == "Bank Transfer") ? Visibility.Visible : Visibility.Collapsed;

            if (_paymentMethod == "Credit")
            {
                TenderedBox.Text = "0.00";
            }
            else if (string.IsNullOrEmpty(TenderedBox.Text) || TenderedBox.Text == "0.00" || TenderedBox.Text == "0")
            {
                TenderedBox.Text = _grandTotal.ToString("F2");
            }

            UpdateChangeDisplay();
        }

        private void TenderedBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            UpdateChangeDisplay();
        }

        private void UpdateChangeDisplay()
        {
            if (ChangeText == null || ChangeBorder == null) return;

            if (_paymentMethod == "Credit")
            {
                ChangeBorder.Visibility = Visibility.Collapsed;
                return;
            }

            if (double.TryParse(TenderedBox.Text, out double tendered))
            {
                double change = tendered - _grandTotal;
                if (change >= 0)
                {
                    ChangeBorder.Visibility = Visibility.Visible;
                    ChangeText.Text = $"LKR {change:N2}";
                }
                else
                {
                    ChangeBorder.Visibility = Visibility.Collapsed;
                }
            }
            else
            {
                ChangeBorder.Visibility = Visibility.Collapsed;
            }
        }

        private void NumPad_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn)
            {
                string key = btn.Content.ToString() ?? "";
                if (key == "C")
                {
                    TenderedBox.Text = "0";
                }
                else
                {
                    string current = TenderedBox.Text;
                    if (current == "0" && key != ".") current = "";

                    if (key == "." && current.Contains(".")) return;

                    TenderedBox.Text = current + key;
                }
            }
        }

        private void ExactAmount_Click(object sender, RoutedEventArgs e)
        {
            TenderedBox.Text = _grandTotal.ToString("F2");
        }

        private void BumpAmount_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn)
            {
                string text = btn.Content.ToString() ?? "";
                if (text == "Exact")
                {
                    TenderedBox.Text = _grandTotal.ToString("F2");
                }
                else if (text.StartsWith("+"))
                {
                    double.TryParse(text.Substring(1), out double bumpValue);
                    double.TryParse(TenderedBox.Text, out double current);
                    TenderedBox.Text = (current + bumpValue).ToString("F2");
                }
            }
        }

        private async void ConfirmPayment_Click(object sender, RoutedEventArgs e)
        {
            ErrorText.Visibility = Visibility.Collapsed;

            double.TryParse(TenderedBox.Text, out double tendered);

            if (_paymentMethod != "Credit" && tendered < _grandTotal)
            {
                ErrorText.Text = "Amount tendered must be at least the grand total.";
                ErrorText.Visibility = Visibility.Visible;
                return;
            }

            if (_paymentMethod == "Card" && string.IsNullOrEmpty(_cardLast4))
            {
                ErrorText.Text = "Please click 'Card' button to enter card details.";
                ErrorText.Visibility = Visibility.Visible;
                return;
            }

            if (_paymentMethod == "Cheque" && string.IsNullOrEmpty(_chequeNo))
            {
                ErrorText.Text = "Please click 'Cheque' button to enter cheque details.";
                ErrorText.Visibility = Visibility.Visible;
                return;
            }

            if (_paymentMethod == "Bank Transfer" && string.IsNullOrEmpty(_bankTransferRef))
            {
                ErrorText.Text = "Please click 'Bank Transfer' button to enter transfer reference details.";
                ErrorText.Visibility = Visibility.Visible;
                return;
            }

            ConfirmButton.IsEnabled = false;
            ConfirmButton.Content = "Processing invoice...";

            var customer = GlobalState.Instance.SelectedCustomer;
            var cart = GlobalState.Instance.CartItems;
            double subtotal = cart.Sum(c => c.LineTotal);

            var payload = new
            {
                held_order_id = GlobalState.Instance.HeldOrderId,
                location_id = GlobalState.Instance.CurrentUser?.location_id ?? 1,
                customer_id = customer?.id ?? GlobalState.Instance.DefaultCustomerId,
                billing_address = GlobalState.Instance.LocationAddress ?? "",
                shipping_address = GlobalState.Instance.LocationAddress ?? "",
                issue_date = DateTime.Now.ToString("yyyy-MM-dd"),
                due_date = DateTime.Now.ToString("yyyy-MM-dd"),
                subtotal = subtotal,
                tax_total = _taxTotal,
                discount_total = _discount,
                grand_total = _grandTotal,
                order_type = GlobalState.Instance.OrderType?.ToLower() ?? "retail",
                table_id = GlobalState.Instance.SelectedTableId,
                steward_id = GlobalState.Instance.SelectedStewardId,
                applied_taxes = _appliedTaxesList,
                notes = "POS Retail Sale",
                applied_promotion_id = (object?)null,
                applied_promotion_name = (object?)null,
                bank_id = (object?)null,
                card_category = _paymentMethod == "Card" ? "Credit" : null,
                items = cart.Select(c => new
                {
                    description = c.Name,
                    item_type = c.ItemType ?? "Part",
                    item_id = c.ProductId.ToString(),
                    quantity = c.Quantity,
                    unit_price = c.UnitPrice.ToString("F2"),
                    discount = c.Discount / (c.Quantity > 0 ? c.Quantity : 1),
                    tax_amount = 0.0,
                    line_total = c.LineTotal
                }).ToList(),
                payments = new[]
                {
                    new {
                        method = _paymentMethod,
                        amount = _paymentMethod == "Credit" ? 0.0 : tendered,
                        cardLast4 = _cardLast4,
                        cardType = _cardType,
                        cardAuthCode = _cardAuthCode,
                        bankId = (object?)null,
                        cardCategory = _paymentMethod == "Card" ? "Credit" : null,
                        chequeNo = _paymentMethod == "Cheque" ? _chequeNo : (_paymentMethod == "Bank Transfer" ? _bankTransferRef : ""),
                        chequeBankName = _paymentMethod == "Cheque" ? _chequeBank : (_paymentMethod == "Bank Transfer" ? _bankTransferBank : ""),
                        chequeBranchName = "",
                        chequeDate = _paymentMethod == "Cheque" ? _chequeDate : DateTime.Now.ToString("yyyy-MM-dd"),
                        chequePayee = ""
                    }
                }
            };

            try
            {
                var result = await _api.CreateInvoiceAsync(payload);

                if (result?.status == "success" || result?.success == true)
                {
                    var invoiceNo = result.data?.invoice_no ?? "N/A";
                    var custName = customer?.name ?? "Walk-in Customer";
                    var changeAmt = _paymentMethod == "Credit" ? 0.0 : Math.Max(0, tendered - _grandTotal);

                    // Print 3-inch thermal receipt silently
                    PrintReceiptDirectly(invoiceNo, custName, tendered, changeAmt, DateTime.Now);

                    GlobalState.Instance.ClearCart();
                    MessageBox.Show(this, $"✅ Payment Successful!\n\nInvoice No: {invoiceNo}\nChange Due: LKR {changeAmt:N2}",
                        "Order Complete", MessageBoxButton.OK, MessageBoxImage.Information);

                    // Clear Location selections as well
                    GlobalState.Instance.SelectedTableId = null;
                    GlobalState.Instance.SelectedTableName = null;
                    GlobalState.Instance.SelectedStewardId = null;
                    GlobalState.Instance.SelectedStewardName = null;

                    DialogResult = true;
                    Close();
                }
                else
                {
                    ErrorText.Text = result?.message ?? "Failed to create invoice. Please try again.";
                    ErrorText.Visibility = Visibility.Visible;
                    ConfirmButton.IsEnabled = true;
                    ConfirmButton.Content = "Process & Print Invoice (Enter / F9)";
                }
            }
            catch (Exception ex)
            {
                ErrorText.Text = $"Network error: {ex.Message}";
                ErrorText.Visibility = Visibility.Visible;
                ConfirmButton.IsEnabled = true;
                ConfirmButton.Content = "Process & Print Invoice (Enter / F9)";
            }
        }

        private async System.Threading.Tasks.Task LoadAndCalculateTaxes()
        {
            try
            {
                var locationId = GlobalState.Instance.CurrentUser?.location_id ?? 1;
                var locationDetails = await _api.FetchLocationDetailsAsync(locationId);
                var allTaxes = await _api.FetchTaxesAsync() ?? new List<TaxModel>();

                _activeTaxes.Clear();
                if (locationDetails != null && !string.IsNullOrEmpty(locationDetails.allowed_taxes_json))
                {
                    var allowedTaxIds = JsonConvert.DeserializeObject<List<string>>(locationDetails.allowed_taxes_json);
                    if (allowedTaxIds != null)
                    {
                        _activeTaxes = allTaxes.Where(t => t.is_active == 1 && allowedTaxIds.Contains(t.id.ToString()))
                                               .OrderBy(t => t.sort_order).ToList();
                    }
                }

                var cart = GlobalState.Instance.CartItems;
                double subtotal = cart.Sum(c => c.LineTotal);
                double currentBase = Math.Max(0, subtotal - _discount);
                double totalTax = 0;

                _appliedTaxesList.Clear();
                foreach (var tax in _activeTaxes)
                {
                    double amount = 0;
                    if (tax.apply_on == "base")
                    {
                        amount = currentBase * (tax.rate_percent / 100);
                    }
                    else if (tax.apply_on == "base_plus_previous")
                    {
                        amount = (currentBase + totalTax) * (tax.rate_percent / 100);
                    }
                    totalTax += amount;

                    _appliedTaxesList.Add(new
                    {
                        name = tax.name,
                        code = tax.code,
                        rate_percent = tax.rate_percent.ToString("F4"),
                        amount = amount
                    });
                }
                _taxTotal = totalTax;
                _grandTotal = currentBase + _taxTotal;
                GrandTotalDisplay.Text = $"LKR {_grandTotal:N2}";
                TenderedBox.Text = _grandTotal.ToString("F2");
                UpdateChangeDisplay();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error calculating taxes in Checkout: {ex.Message}");
            }
        }

        // â”€â”€â”€ Receipt Builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        private StackPanel BuildReceiptPanel(
            string invoiceNo, string customerName,
            double tendered, double change, DateTime date,
            double previewWidth = 300)
        {
            var cart  = GlobalState.Instance.CartItems;
            var cName = GlobalState.Instance.LocationName  ?? "Main Branch";
            var phone = GlobalState.Instance.LocationPhone ?? "";
            var addr  = GlobalState.Instance.LocationAddress ?? "";

            double w = previewWidth - 24; // usable width (padding 12 each side)

            var root = new StackPanel
            {
                Background = Brushes.White,
                Width      = previewWidth,
                Orientation = Orientation.Vertical
            };

            var inner = new StackPanel { Margin = new Thickness(12, 10, 12, 10) };
            root.Children.Add(inner);

            // â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            inner.Children.Add(MakeTB("KDU Group", 15, FontWeights.Bold, TextAlignment.Center,
                new Thickness(0,0,0,2)));
            inner.Children.Add(MakeTB(cName, 10, FontWeights.Normal, TextAlignment.Center,
                new Thickness(0,0,0,1), new SolidColorBrush(Color.FromRgb(220, 120, 0))));
            if (!string.IsNullOrEmpty(phone))
                inner.Children.Add(MakeTB($"Tel: {phone}", 10, FontWeights.Normal,
                    TextAlignment.Center, new Thickness(0,0,0,1),
                    new SolidColorBrush(Color.FromRgb(220, 120, 0))));
            if (!string.IsNullOrEmpty(addr))
                inner.Children.Add(MakeTB(addr, 10, FontWeights.Normal, TextAlignment.Center,
                    new Thickness(0,0,0,4),
                    new SolidColorBrush(Color.FromRgb(220, 120, 0))));

            // â”€â”€ Solid line â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            inner.Children.Add(SolidLine(w));

            // â”€â”€ Meta rows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            inner.Children.Add(LRRow("Invoice#", invoiceNo,  w, rightBold:true));
            inner.Children.Add(LRRow("Date",     date.ToString("dd/MM/yyyy, hh:mm tt"), w));
            inner.Children.Add(LRRow("Customer", customerName, w));
            inner.Children.Add(LRRow("Order Type", GlobalState.Instance.OrderType ?? "Retail", w));

            if (GlobalState.Instance.OrderType?.ToLower().Contains("dine") == true)
            {
                inner.Children.Add(LRRow("Table",   GlobalState.Instance.SelectedTableName  ?? "", w, rightBold:true));
                inner.Children.Add(LRRow("Steward", GlobalState.Instance.SelectedStewardName ?? "", w));
            }

            // â”€â”€ Dashed line â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            inner.Children.Add(DashedLine(w));

            // â”€â”€ Items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            inner.Children.Add(MakeTB("ITEMS", 10, FontWeights.Bold, TextAlignment.Left,
                new Thickness(0,4,0,4)));

            foreach (var item in cart)
            {
                bool isFree    = item.Discount >= item.Price && item.Price > 0;
                double lineTot = isFree ? 0.0 : item.LineTotal;

                // Item name (bold)
                inner.Children.Add(MakeTB(item.Name ?? "Item", 11, FontWeights.Bold,
                    TextAlignment.Left, new Thickness(0,3,0,1)));

                // Qty Ã— @ price  |  lineTotal
                string qtyLabel = $"{item.Quantity:0.##} \u00d7 @ LKR {item.Price:N2}";
                string totLabel = isFree ? "LKR 0.00" : $"LKR {lineTot:N2}";
                inner.Children.Add(LRRow(qtyLabel, totLabel, w, leftSize:10, rightSize:10, rightBold:false));
            }

            // â”€â”€ Dashed line â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            inner.Children.Add(DashedLine(w));

            // â”€â”€ Subtotal / Discount / Taxes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            double subtotal = cart.Sum(c => c.LineTotal);
            inner.Children.Add(LRRow("Subtotal", $"LKR {subtotal:N2}", w));
            if (_discount > 0)
                inner.Children.Add(LRRow("Discount", $"-LKR {_discount:N2}", w));

            foreach (dynamic tax in _appliedTaxesList)
            {
                string code   = tax.code;
                double rate   = double.Parse(tax.rate_percent);
                double amount = tax.amount;
                inner.Children.Add(LRRow($"{code} ({rate:F2}%)", $"LKR {amount:N2}", w));
            }

            // â”€â”€ Solid line â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            inner.Children.Add(SolidLine(w));

            // â”€â”€ TOTAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            inner.Children.Add(LRRow("TOTAL", $"LKR {_grandTotal:N2}", w,
                leftBold:true, rightBold:true, leftSize:15, rightSize:15));

            // â”€â”€ Payment Details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            inner.Children.Add(MakeTB("PAYMENT DETAILS", 9, FontWeights.Bold,
                TextAlignment.Left, new Thickness(0,6,0,3)));

            inner.Children.Add(LRRow(_paymentMethod, $"LKR {tendered:N2}", w));

            // Payment sub-detail
            if (_paymentMethod == "Card" && !string.IsNullOrEmpty(_cardLast4))
                inner.Children.Add(MakeTB($"{_cardType} **** {_cardLast4}  Auth: {_cardAuthCode}",
                    9, FontWeights.Normal, TextAlignment.Right, new Thickness(0,1,0,1),
                    Brushes.Gray));
            else if (_paymentMethod == "Cheque" && !string.IsNullOrEmpty(_chequeNo))
                inner.Children.Add(MakeTB($"{_chequeBank}   No: #{_chequeNo}  Date: {_chequeDate}",
                    9, FontWeights.Normal, TextAlignment.Right, new Thickness(0,1,0,1),
                    Brushes.Gray));
            else if (_paymentMethod == "Bank Transfer" && !string.IsNullOrEmpty(_bankTransferRef))
                inner.Children.Add(MakeTB($"{_bankTransferBank}   Ref: {_bankTransferRef}",
                    9, FontWeights.Normal, TextAlignment.Right, new Thickness(0,1,0,1),
                    Brushes.Gray));

            // â”€â”€ Dashed line â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            inner.Children.Add(DashedLine(w));

            // â”€â”€ Total Paid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            inner.Children.Add(LRRow("Total Paid", $"LKR {tendered:N2}", w, rightBold:true));

            // â”€â”€ Change / PAID badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            if (change >= 0.01)
            {
                inner.Children.Add(LRRow("Balance Due", $"LKR {change:N2}", w,
                    leftBold:true, rightBold:true));
            }
            else
            {
                var badge = new Border
                {
                    BorderBrush     = Brushes.Black,
                    BorderThickness = new Thickness(1.5),
                    HorizontalAlignment = HorizontalAlignment.Center,
                    Padding = new Thickness(16, 3, 16, 3),
                    Margin  = new Thickness(0, 6, 0, 4)
                };
                badge.Child = MakeTB("\u2713 PAID", 13, FontWeights.Bold, TextAlignment.Center,
                    new Thickness(0));
                inner.Children.Add(badge);
            }

            // â”€â”€ Dashed line â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            inner.Children.Add(DashedLine(w));

            // â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            inner.Children.Add(MakeTB("Thank you for your purchase!", 10, FontWeights.Normal,
                TextAlignment.Center, new Thickness(0, 8, 0, 2),
                new SolidColorBrush(Color.FromRgb(220, 120, 0))));
            inner.Children.Add(MakeTB("BizFlow ERP System", 11, FontWeights.Bold,
                TextAlignment.Center, new Thickness(0, 1, 0, 1)));
            inner.Children.Add(MakeTB("Developed by Nebulync.com", 8, FontWeights.Normal,
                TextAlignment.Center, new Thickness(0, 1, 0, 6), Brushes.Gray));
            inner.Children.Add(MakeTB("· · · · · · · · · ·", 9, FontWeights.Normal,
                TextAlignment.Center, new Thickness(0, 2, 0, 6), Brushes.Gray));

            return root;
        }

        // â”€â”€â”€ UI Primitive Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        private static TextBlock MakeTB(
            string text, double size, FontWeight weight,
            TextAlignment align, Thickness margin,
            Brush? fg = null)
        {
            return new TextBlock
            {
                Text            = text,
                FontFamily      = new FontFamily("Courier New"),
                FontSize        = size,
                FontWeight      = weight,
                TextAlignment   = align,
                TextWrapping    = TextWrapping.Wrap,
                Foreground      = fg ?? Brushes.Black,
                Margin          = margin
            };
        }

        private static FrameworkElement LRRow(
            string left, string right, double width,
            bool leftBold = false, bool rightBold = false,
            double leftSize = 11, double rightSize = 11)
        {
            var grid = new Grid { Width = width, Margin = new Thickness(0, 1, 0, 1) };
            grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

            var lTB = new TextBlock
            {
                Text        = left,
                FontFamily  = new FontFamily("Courier New"),
                FontSize    = leftSize,
                FontWeight  = leftBold ? FontWeights.Bold : FontWeights.Normal,
                TextWrapping = TextWrapping.Wrap,
                Foreground  = Brushes.Black
            };
            var rTB = new TextBlock
            {
                Text        = right,
                FontFamily  = new FontFamily("Courier New"),
                FontSize    = rightSize,
                FontWeight  = rightBold ? FontWeights.Bold : FontWeights.Normal,
                TextAlignment = TextAlignment.Right,
                Foreground  = Brushes.Black
            };

            Grid.SetColumn(lTB, 0);
            Grid.SetColumn(rTB, 1);
            grid.Children.Add(lTB);
            grid.Children.Add(rTB);
            return grid;
        }

        private static FrameworkElement SolidLine(double width)
        {
            return new Border
            {
                Width           = width,
                BorderBrush     = Brushes.Black,
                BorderThickness = new Thickness(0, 1, 0, 0),
                Margin          = new Thickness(0, 4, 0, 4),
                HorizontalAlignment = HorizontalAlignment.Left
            };
        }

        private static FrameworkElement DashedLine(double width)
        {
            return new System.Windows.Shapes.Line
            {
                X1 = 0,
                X2 = width,
                Y1 = 0,
                Y2 = 0,
                Stroke = Brushes.Black,
                StrokeThickness = 1,
                StrokeDashArray = new DoubleCollection { 4, 4 },
                Margin = new Thickness(0, 4, 0, 4),
                HorizontalAlignment = HorizontalAlignment.Left
            };
        }

        // â”€â”€â”€ Print â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        private void PrintReceiptDirectly(string invoiceNo, string customerName,
            double tendered, double change, DateTime date)
        {
            try
            {
                // Build at the 80 mm (300 px @ 96 dpi) receipt width
                var receiptPanel = BuildReceiptPanel(invoiceNo, customerName,
                    tendered, change, date, previewWidth: 300);

                // Force measure/arrange so PrintVisual works correctly
                receiptPanel.Measure(new Size(300, double.PositiveInfinity));
                receiptPanel.Arrange(new Rect(new Size(300, receiptPanel.DesiredSize.Height)));
                receiptPanel.UpdateLayout();

                // Show preview dialog (auto-prints on load)
                var previewWnd = new ReceiptPreviewWindow(
                    receiptPanel, invoiceNo, this,
                    tendered, change, date,
                    _paymentMethod, _cardType, _cardLast4, _cardAuthCode,
                    _chequeNo, _chequeDate, _chequeBank,
                    _bankTransferRef, _bankTransferBank,
                    _discount, _grandTotal, _appliedTaxesList);

                previewWnd.ShowDialog();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Receipt error: {ex.Message}");
                MessageBox.Show($"Receipt error: {ex.Message}", "Print Error",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        private void Cancel_Click(object sender, RoutedEventArgs e)
        {
            if (!ConfirmButton.IsEnabled) return;
            DialogResult = false;
            Close();
        }

        // Public wrapper so ReceiptPreviewWindow can rebuild at native print resolution
        public StackPanel BuildReceiptPanelPublic(
            string invoiceNo, string customerName,
            double tendered, double change, DateTime date,
            double previewWidth = 300)
            => BuildReceiptPanel(invoiceNo, customerName, tendered, change, date, previewWidth);
    }


    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    //  Receipt Preview Window
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    public class ReceiptPreviewWindow : Window
    {
        private readonly StackPanel _receiptPanel;
        private readonly string     _invoiceNo;

        // State captured for re-build at print time (native printer resolution)
        private readonly double _tendered, _change, _grandTotal, _discount;
        private readonly DateTime _date;
        private readonly string _payMethod, _cardType, _cardLast4, _cardAuth;
        private readonly string _chequeNo, _chequeDate, _chequeBank;
        private readonly string _bankRef, _bankName;
        private readonly List<object> _taxes;

        // Reference to parent CheckoutDialog so we can call BuildReceiptPanel
        private readonly CheckoutDialog _parent;

        public ReceiptPreviewWindow(
            StackPanel receiptPanel, string invoiceNo, CheckoutDialog owner,
            double tendered, double change, DateTime date,
            string payMethod, string cardType, string cardLast4, string cardAuth,
            string chequeNo, string chequeDate, string chequeBank,
            string bankRef, string bankName,
            double discount, double grandTotal, List<object> taxes)
        {
            _receiptPanel = receiptPanel;
            _invoiceNo    = invoiceNo;
            _parent       = owner;
            _tendered     = tendered;
            _change       = change;
            _date         = date;
            _payMethod    = payMethod;
            _cardType     = cardType;
            _cardLast4    = cardLast4;
            _cardAuth     = cardAuth;
            _chequeNo     = chequeNo;
            _chequeDate   = chequeDate;
            _chequeBank   = chequeBank;
            _bankRef      = bankRef;
            _bankName     = bankName;
            _discount     = discount;
            _grandTotal   = grandTotal;
            _taxes        = taxes;

            Owner = owner;
            Title = $"Receipt Preview \u2014 Invoice {invoiceNo}";
            Width  = 380;
            Height = 680;
            MinWidth  = 380;
            MinHeight = 400;
            WindowStartupLocation = WindowStartupLocation.CenterOwner;
            WindowStyle = WindowStyle.ThreeDBorderWindow;
            ResizeMode  = ResizeMode.CanResize;
            Background  = new SolidColorBrush(Color.FromRgb(240, 240, 245));

            BuildUI();

            PreviewKeyDown += (s, e) =>
            {
                if (e.Key == System.Windows.Input.Key.Escape) { Close(); e.Handled = true; }
                else if (e.Key == System.Windows.Input.Key.F9 ||
                         e.Key == System.Windows.Input.Key.Enter)
                { ExecutePrint(); e.Handled = true; }
            };

            Loaded += (s, e) => ExecutePrint();
        }

        private void BuildUI()
        {
            var root = new Grid();
            root.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
            root.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });

            // â”€â”€ Scroll area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            var scroll = new ScrollViewer
            {
                VerticalScrollBarVisibility   = ScrollBarVisibility.Auto,
                HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
                Background = new SolidColorBrush(Color.FromRgb(200, 200, 210)),
                Padding    = new Thickness(10)
            };

            // Shadow / card border around the receipt
            var card = new Border
            {
                Background      = Brushes.White,
                BorderBrush     = new SolidColorBrush(Color.FromRgb(200, 200, 200)),
                BorderThickness = new Thickness(1),
                HorizontalAlignment = HorizontalAlignment.Center,
                Effect = new System.Windows.Media.Effects.DropShadowEffect
                {
                    Color     = Colors.Black,
                    Opacity   = 0.18,
                    BlurRadius = 8,
                    ShadowDepth = 2
                },
                Child = _receiptPanel
            };

            scroll.Content = card;
            Grid.SetRow(scroll, 0);
            root.Children.Add(scroll);

            // â”€â”€ Button bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            var btnBar = new Border
            {
                Background      = Brushes.White,
                BorderBrush     = new SolidColorBrush(Color.FromRgb(220, 220, 220)),
                BorderThickness = new Thickness(0, 1, 0, 0),
                Padding         = new Thickness(12, 8, 12, 8)
            };

            var btnStack = new StackPanel
            {
                Orientation         = Orientation.Horizontal,
                HorizontalAlignment = HorizontalAlignment.Right
            };

            var printBtn = new Button
            {
                Content    = "  \uD83D\uDDB6  Print  (F9)",
                Width      = 120,
                Height     = 36,
                Margin     = new Thickness(0, 0, 10, 0),
                FontSize   = 13,
                FontWeight = FontWeights.Bold,
                Foreground = Brushes.White,
                Background = new SolidColorBrush(Color.FromRgb(0, 122, 255)),
                BorderThickness = new Thickness(0),
                Cursor     = System.Windows.Input.Cursors.Hand
            };
            printBtn.Click += (s, e) => ExecutePrint();

            var closeBtn = new Button
            {
                Content  = "Close  (Esc)",
                Width    = 100,
                Height   = 36,
                FontSize = 13,
                Background = new SolidColorBrush(Color.FromRgb(245, 245, 245)),
                BorderBrush = new SolidColorBrush(Color.FromRgb(200, 200, 200)),
                Cursor   = System.Windows.Input.Cursors.Hand
            };
            closeBtn.Click += (s, e) => Close();

            btnStack.Children.Add(printBtn);
            btnStack.Children.Add(closeBtn);
            btnBar.Child = btnStack;

            Grid.SetRow(btnBar, 1);
            root.Children.Add(btnBar);

            Content = root;
        }

        private void ExecutePrint()
        {
            try
            {
                var dlg = new PrintDialog();

                // Get the actual printable width in WPF units (96 dpi)
                // Default to 226 WPF units (~60mm) if no printer configured yet
                dlg.PrintQueue = System.Printing.LocalPrintServer.GetDefaultPrintQueue();
                double printWidth = dlg.PrintableAreaWidth > 10
                    ? dlg.PrintableAreaWidth
                    : 226;

                // Re-build the panel at the actual print width for correct proportions
                var printPanel = _parent.BuildReceiptPanelPublic(
                    _invoiceNo,
                    GlobalState.Instance.SelectedCustomer?.name ?? "Walk-in Customer",
                    _tendered, _change, _date, printWidth);

                printPanel.Measure(new Size(printWidth, double.PositiveInfinity));
                printPanel.Arrange(new Rect(new Size(printWidth,
                    printPanel.DesiredSize.Height)));
                printPanel.UpdateLayout();

                dlg.PrintVisual(printPanel, $"Invoice {_invoiceNo}");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Print failed: {ex.Message}", "Print Error",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }
    }
}
