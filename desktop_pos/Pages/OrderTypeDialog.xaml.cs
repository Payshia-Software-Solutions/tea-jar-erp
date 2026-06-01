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
        }

        private void OrderTypeDialog_PreviewKeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Escape)
            {
                this.DialogResult = false;
                e.Handled = true;
            }
            else if (e.Key == Key.D1 || e.Key == Key.NumPad1)
            {
                SelectType("Dine In");
                e.Handled = true;
            }
            else if (e.Key == Key.D2 || e.Key == Key.NumPad2)
            {
                SelectType("Take Away");
                e.Handled = true;
            }
            else if (e.Key == Key.D3 || e.Key == Key.NumPad3)
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
