using System;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;

namespace DesktopPOS.Pages
{
    public partial class BillDiscountDialog : Window
    {
        private string _valStr = "0";
        public bool IsPercentage { get; private set; } = true;
        public double DiscountValue { get; private set; } = 0;

        public BillDiscountDialog(double initialValue = 0, bool initialIsPercentage = true)
        {
            InitializeComponent();
            IsPercentage = initialIsPercentage;
            _valStr = initialValue.ToString("0.##");
            
            UpdateDisplay();
            UpdateModeUI();

            this.PreviewKeyDown += Window_PreviewKeyDown;
        }

        private void UpdateDisplay()
        {
            AmountDisplay.Text = _valStr;
            SuffixLabel.Text = IsPercentage ? "%" : "LKR";
        }

        private void UpdateModeUI()
        {
            var activeBg = (Brush)FindResource("BgInput");
            var inactiveBg = (Brush)FindResource("BgCard");
            var activeFg = (Brush)FindResource("TextPrimary");
            var inactiveFg = (Brush)FindResource("TextSecondary");

            if (IsPercentage)
            {
                PercentModeBtn.Background = activeBg;
                PercentModeText.Foreground = activeFg;
                ValueModeBtn.Background = inactiveBg;
                ValueModeText.Foreground = inactiveFg;
            }
            else
            {
                PercentModeBtn.Background = inactiveBg;
                PercentModeText.Foreground = inactiveFg;
                ValueModeBtn.Background = activeBg;
                ValueModeText.Foreground = activeFg;
            }
            UpdateDisplay();
        }

        private void PercentMode_Click(object sender, MouseButtonEventArgs e)
        {
            IsPercentage = true;
            UpdateModeUI();
        }

        private void ValueMode_Click(object sender, MouseButtonEventArgs e)
        {
            IsPercentage = false;
            UpdateModeUI();
        }

        private void AppendChar(string tag)
        {
            if (tag == ".")
            {
                if (!_valStr.Contains("."))
                    _valStr += ".";
            }
            else
            {
                if (_valStr == "0")
                    _valStr = tag;
                else
                    _valStr += tag;
            }
            UpdateDisplay();
        }

        private void DeleteChar()
        {
            if (_valStr.Length > 1)
                _valStr = _valStr.Substring(0, _valStr.Length - 1);
            else
                _valStr = "0";
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
            else if (e.Key == Key.P)
            {
                IsPercentage = true;
                UpdateModeUI();
                e.Handled = true;
            }
            else if (e.Key == Key.V || e.Key == Key.L)
            {
                IsPercentage = false;
                UpdateModeUI();
                e.Handled = true;
            }
            else if (e.Key == Key.Enter)
            {
                Apply_Click(this, new RoutedEventArgs());
                e.Handled = true;
            }
            else if (e.Key == Key.Escape)
            {
                Cancel_Click(this, new RoutedEventArgs());
                e.Handled = true;
            }
        }

        private void Apply_Click(object sender, RoutedEventArgs e)
        {
            DiscountValue = double.TryParse(_valStr, out double v) ? (v > 0 ? v : 0) : 0;
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
