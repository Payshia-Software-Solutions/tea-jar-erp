using System.Windows;
using System.Windows.Input;
using System.Windows.Media;

namespace DesktopPOS.Pages
{
    public partial class BankTransferDetailsDialog : Window
    {
        public string ReferenceNo { get; private set; } = "";
        public string BankName { get; private set; } = "";

        public BankTransferDetailsDialog(string initialRef = "", string initialBank = "")
        {
            InitializeComponent();
            ReferenceNo = initialRef;
            BankName = initialBank;

            RefNoBox.Text = ReferenceNo;
            
            if (!string.IsNullOrEmpty(BankName))
            {
                BankNameText.Text = BankName;
                BankNameText.Foreground = (Brush)FindResource("TextPrimary");
            }

            Loaded += (s, e) =>
            {
                RefNoBox.Focus();
                RefNoBox.SelectAll();
            };

            this.PreviewKeyDown += Window_PreviewKeyDown;
        }

        private void Window_PreviewKeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Escape)
            {
                Cancel_Click(this, new RoutedEventArgs());
                e.Handled = true;
            }
            else if (e.Key == Key.Enter)
            {
                if (FocusManager.GetFocusedElement(this) == SelectBankButton)
                {
                    return; // Let the button click handler process it natively
                }
                Confirm_Click(this, new RoutedEventArgs());
                e.Handled = true;
            }
        }

        private void SelectBank_Click(object sender, RoutedEventArgs e)
        {
            var dialog = new BankSelectionDialog();
            dialog.Owner = this;
            if (dialog.ShowDialog() == true && dialog.SelectedBank != null)
            {
                BankName = dialog.SelectedBank.name ?? "";
                BankNameText.Text = BankName;
                BankNameText.Foreground = (Brush)FindResource("TextPrimary");
            }
        }

        private void Confirm_Click(object sender, RoutedEventArgs e)
        {
            ErrorText.Visibility = Visibility.Collapsed;

            if (string.IsNullOrWhiteSpace(RefNoBox.Text))
            {
                ErrorText.Text = "Please enter the transaction reference / ID.";
                ErrorText.Visibility = Visibility.Visible;
                return;
            }

            if (string.IsNullOrWhiteSpace(BankName))
            {
                ErrorText.Text = "Please select the bank name.";
                ErrorText.Visibility = Visibility.Visible;
                return;
            }

            ReferenceNo = RefNoBox.Text;

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
