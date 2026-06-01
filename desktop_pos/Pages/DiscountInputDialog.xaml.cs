using System.Windows;

namespace DesktopPOS.Pages
{
    public partial class DiscountInputDialog : Window
    {
        public double DiscountAmount { get; private set; } = 0;

        public DiscountInputDialog()
        {
            InitializeComponent();
            Loaded += (s, e) => { AmountBox.SelectAll(); AmountBox.Focus(); };
        }

        private void Apply_Click(object sender, RoutedEventArgs e)
        {
            DiscountAmount = double.TryParse(AmountBox.Text, out double d) ? d : 0;
            DialogResult = true;
            Close();
        }

        private void Cancel_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }
    }
}

