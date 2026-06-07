using DesktopPOS.Services;
using System.Windows;
using System.Windows.Input;

namespace DesktopPOS.Pages
{
    public partial class OrderTypeDialog : Window
    {
        public OrderTypeDialog()
        {
            InitializeComponent();
            this.PreviewKeyDown += OrderTypeDialog_PreviewKeyDown;

            var loc = GlobalState.Instance.LocationDetails;
            if (loc != null)
            {
                if (loc.allow_dine_in == 0) DineInOption.Visibility = Visibility.Collapsed;
                if (loc.allow_take_away == 0) TakeAwayOption.Visibility = Visibility.Collapsed;
                if (loc.allow_retail == 0) RetailOption.Visibility = Visibility.Collapsed;
            }
        }

        private void OrderTypeDialog_PreviewKeyDown(object sender, KeyEventArgs e)
        {
            var loc = GlobalState.Instance.LocationDetails;
            if (e.Key == Key.Escape)
            {
                this.DialogResult = false;
                e.Handled = true;
            }
            else if ((e.Key == Key.D1 || e.Key == Key.NumPad1) && (loc == null || loc.allow_dine_in == 1))
            {
                SelectType("Dine In");
                e.Handled = true;
            }
            else if ((e.Key == Key.D2 || e.Key == Key.NumPad2) && (loc == null || loc.allow_take_away == 1))
            {
                SelectType("Take Away");
                e.Handled = true;
            }
            else if ((e.Key == Key.D3 || e.Key == Key.NumPad3) && (loc == null || loc.allow_retail == 1))
            {
                SelectType("Retail");
                e.Handled = true;
            }
        }

        private void SelectType(string type)
        {
            GlobalState.Instance.OrderType = type;
            this.DialogResult = true;
        }

        private void DineIn_Click(object sender, MouseButtonEventArgs e)
        {
            SelectType("Dine In");
        }

        private void TakeAway_Click(object sender, MouseButtonEventArgs e)
        {
            SelectType("Take Away");
        }

        private void Retail_Click(object sender, MouseButtonEventArgs e)
        {
            SelectType("Retail");
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            this.DialogResult = false;
        }
    }
}
