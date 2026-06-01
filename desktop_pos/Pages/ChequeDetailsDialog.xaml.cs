using System;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;

namespace DesktopPOS.Pages
{
    public partial class ChequeDetailsDialog : Window
    {
        public string ChequeNo { get; private set; } = "";
        public string ChequeDate { get; private set; } = "";
        public string ChequeBank { get; private set; } = "";

        public ChequeDetailsDialog(string initialNo = "", string initialDate = "", string initialBank = "")
        {
            InitializeComponent();
            ChequeNo = initialNo;
            ChequeDate = string.IsNullOrEmpty(initialDate) ? DateTime.Now.ToString("yyyy-MM-dd") : initialDate;
            ChequeBank = initialBank;

            ChequeNoBox.Text = ChequeNo;

            if (DateTime.TryParse(ChequeDate, out DateTime initDate))
            {
                ChequeDatePicker.SelectedDate = initDate;
            }
            else
            {
                ChequeDatePicker.SelectedDate = DateTime.Today;
            }
            
            if (!string.IsNullOrEmpty(ChequeBank))
            {
                ChequeBankText.Text = ChequeBank;
                ChequeBankText.Foreground = (Brush)FindResource("TextPrimary");
            }

            Loaded += (s, e) =>
            {
                ChequeNoBox.Focus();
                ChequeNoBox.SelectAll();
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
                ChequeBank = dialog.SelectedBank.name ?? "";
                ChequeBankText.Text = ChequeBank;
                ChequeBankText.Foreground = (Brush)FindResource("TextPrimary");
            }
        }

        private void Confirm_Click(object sender, RoutedEventArgs e)
        {
            ErrorText.Visibility = Visibility.Collapsed;

            if (string.IsNullOrWhiteSpace(ChequeNoBox.Text))
            {
                ErrorText.Text = "Please enter the cheque serial number.";
                ErrorText.Visibility = Visibility.Visible;
                return;
            }

            if (string.IsNullOrWhiteSpace(ChequeBank))
            {
                ErrorText.Text = "Please select the bank name.";
                ErrorText.Visibility = Visibility.Visible;
                return;
            }

            ChequeNo = ChequeNoBox.Text;
            if (ChequeDatePicker.SelectedDate != null)
            {
                ChequeDate = ChequeDatePicker.SelectedDate.Value.ToString("yyyy-MM-dd");
            }
            else
            {
                ChequeDate = DateTime.Now.ToString("yyyy-MM-dd");
            }

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
