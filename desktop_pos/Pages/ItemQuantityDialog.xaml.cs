using DesktopPOS.Services;
using System.Windows;
using System.Windows.Input;

namespace DesktopPOS.Pages
{
    public partial class ItemQuantityDialog : Window
    {
        private string _qtyStr = "1";
        public double SelectedQuantity { get; private set; } = 1;
        public double LineDiscount { get; private set; } = 0;

        public ItemQuantityDialog(ProductModel product)
        {
            InitializeComponent();

            ProductName.Text = product.name ?? "Product";
            ProductSku.Text = product.sku ?? "";
            TypeBadgeText.Text = (product.item_type ?? "A LA CARTE").ToUpper();

            bool isService = product.item_type?.ToLower() == "service";
            ServiceBadge.Visibility = isService ? Visibility.Visible : Visibility.Collapsed;

            this.PreviewKeyDown += Window_PreviewKeyDown;
        }

        private void UpdateDisplay()
        {
            QtyDisplay.Text = _qtyStr;
        }

        private void AppendChar(string tag)
        {
            if (tag == ".")
            {
                if (!_qtyStr.Contains("."))
                    _qtyStr += ".";
            }
            else
            {
                if (_qtyStr == "0" || _qtyStr == "1")
                    _qtyStr = tag;
                else
                    _qtyStr += tag;
            }
            UpdateDisplay();
        }

        private void DeleteChar()
        {
            if (_qtyStr.Length > 1)
                _qtyStr = _qtyStr.Substring(0, _qtyStr.Length - 1);
            else
                _qtyStr = "1";
            UpdateDisplay();
        }

        private void Num_Click(object sender, MouseButtonEventArgs e)
        {
            var tag = (sender as FrameworkElement)?.Tag?.ToString() ?? "";
            AppendChar(tag);
        }

        private void Del_Click(object sender, MouseButtonEventArgs e)
        {
            DeleteChar();
        }

        private void Window_PreviewKeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key >= Key.D0 && e.Key <= Key.D9)
            {
                AppendChar((e.Key - Key.D0).ToString());
                e.Handled = true;
            }
            else if (e.Key >= Key.NumPad0 && e.Key <= Key.NumPad9)
            {
                AppendChar((e.Key - Key.NumPad0).ToString());
                e.Handled = true;
            }
            else if (e.Key == Key.Decimal || e.Key == Key.OemPeriod)
            {
                AppendChar(".");
                e.Handled = true;
            }
            else if (e.Key == Key.Back || e.Key == Key.Delete)
            {
                DeleteChar();
                e.Handled = true;
            }
            else if (e.Key == Key.D || e.Key == Key.F4)
            {
                AddDiscount_Click(this, null);
                e.Handled = true;
            }
            else if (e.Key == Key.Enter)
            {
                AddToCart_Click(this, new RoutedEventArgs());
                e.Handled = true;
            }
            else if (e.Key == Key.Escape)
            {
                Close_Click(this, new RoutedEventArgs());
                e.Handled = true;
            }
        }

        private void AddToCart_Click(object sender, RoutedEventArgs e)
        {
            SelectedQuantity = double.TryParse(_qtyStr, out double q) ? (q > 0 ? q : 1) : 1;
            DialogResult = true;
            Close();
        }

        private void AddDiscount_Click(object sender, MouseButtonEventArgs? e)
        {
            // Simple input for now - could be a sub-numpad
            var dlg = new DiscountInputDialog();
            dlg.Owner = this;
            if (dlg.ShowDialog() == true)
            {
                LineDiscount = dlg.DiscountAmount;
                DiscountStatus.Text = $"LKR {LineDiscount:N2}";
            }
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }
    }
}

