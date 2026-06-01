using DesktopPOS.Services;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;

namespace DesktopPOS.Pages
{
    public partial class CartPage : Page
    {
        private List<CartItem> Cart => GlobalState.Instance.CartItems;
        private double _discount = 0;

        public CartPage()
        {
            InitializeComponent();
            Loaded += (s, e) =>
            {
                CustomerNameText.Text = GlobalState.Instance.SelectedCustomer?.name ?? "Walk-in Customer";
                RefreshCart();
                if (Window.GetWindow(this) is Window win)
                {
                    win.PreviewKeyDown += Page_PreviewKeyDown;
                }
            };
            Unloaded += (s, e) =>
            {
                if (Window.GetWindow(this) is Window win)
                {
                    win.PreviewKeyDown -= Page_PreviewKeyDown;
                }
            };
        }

        private void Page_PreviewKeyDown(object sender, System.Windows.Input.KeyEventArgs e)
        {
            if (e.Key == System.Windows.Input.Key.F7)
            {
                HoldOrder_Click(this, new RoutedEventArgs());
                e.Handled = true;
            }
            else if (e.Key == System.Windows.Input.Key.F9)
            {
                Checkout_Click(this, new RoutedEventArgs());
                e.Handled = true;
            }
        }

        private void RefreshCart()
        {
            CartListView.ItemsSource = null;
            CartListView.ItemsSource = Cart.Select(c => new CartItemViewModel(c)).ToList();
            UpdateTotals();
        }

        private void UpdateTotals()
        {
            double subtotal = Cart.Sum(c => c.LineTotal);
            double discounted = System.Math.Max(0, subtotal - _discount);
            double tax = 0; // Tax can be wired from API later

            SubtotalText.Text = $"LKR {subtotal:N2}";
            TaxText.Text = $"LKR {tax:N2}";
            GrandTotalText.Text = $"LKR {(discounted + tax):N2}";
        }

        private void DiscountBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            _discount = double.TryParse(DiscountBox.Text, out double d) ? d : 0;
            UpdateTotals();
        }

        private void IncreaseQty_Click(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if ((sender as FrameworkElement)?.Tag is CartItemViewModel vm)
            {
                double unitDiscount = vm.Source.Quantity > 0 ? vm.Source.Discount / vm.Source.Quantity : 0;
                vm.Source.Quantity++;
                vm.Source.Discount = unitDiscount * vm.Source.Quantity;
                RefreshCart();
            }
        }

        private void DecreaseQty_Click(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if ((sender as FrameworkElement)?.Tag is CartItemViewModel vm)
            {
                if (vm.Source.Quantity > 1)
                {
                    double unitDiscount = vm.Source.Quantity > 0 ? vm.Source.Discount / vm.Source.Quantity : 0;
                    vm.Source.Quantity--;
                    vm.Source.Discount = unitDiscount * vm.Source.Quantity;
                }
                else
                {
                    Cart.Remove(vm.Source);
                }
                RefreshCart();
            }
        }

        private void HoldOrder_Click(object sender, RoutedEventArgs e)
        {
            MessageBox.Show("Hold Order feature will be connected to API.", "Coming Soon",
                MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private void Checkout_Click(object sender, RoutedEventArgs e)
        {
            if (Cart.Count == 0) return;
            double subtotal = Cart.Sum(c => c.LineTotal);
            double grandTotal = System.Math.Max(0, subtotal - _discount);

            var dialog = new CheckoutDialog(grandTotal, _discount);
            var mainWindow = Application.Current.MainWindow;

            if (mainWindow != null)
            {
                dialog.Owner = mainWindow;
                mainWindow.Effect = new System.Windows.Media.Effects.BlurEffect { Radius = 10 };
            }

            if (dialog.ShowDialog() == true)
            {
                NavigationService.Navigate(new DashboardPage());
            }

            if (mainWindow != null)
            {
                mainWindow.Effect = null;
            }
        }

        private void Back_Click(object sender, RoutedEventArgs e) => NavigationService.GoBack();
    }

    // View Model helper for data binding
    public class CartItemViewModel
    {
        public CartItem Source { get; }
        public CartItemViewModel(CartItem source) => Source = source;
        public string? Name => Source.Name;
        public string PriceDisplay => $"LKR {Source.Price:N2} × {Source.Quantity}";
        public string QuantityDisplay => Source.Quantity.ToString("0.##");
        public string LineTotalDisplay => $"LKR {Source.LineTotal:N2}";
    }
}

