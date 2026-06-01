using System;
using System.Linq;
using System.Windows;
using DesktopPOS.Services;

namespace DesktopPOS.Pages
{
    public partial class TodaySummaryDialog : Window
    {
        private readonly ApiService _api = new ApiService();
        private DayLedgerSummary? _summary;

        public TodaySummaryDialog()
        {
            InitializeComponent();
            Loaded += TodaySummaryDialog_Loaded;
        }

        private async void TodaySummaryDialog_Loaded(object sender, RoutedEventArgs e)
        {
            var res = await _api.FetchDayLedgerAsync();
            if (res != null && res.status == "success" && res.data?.summary != null)
            {
                _summary = res.data.summary;
                SalesText.Text = $"LKR {_summary.sales:N2}";
                ReturnsText.Text = $"LKR {_summary.returns:N2}";
                RefundsText.Text = $"LKR {_summary.refunds:N2}";
                NetText.Text = $"LKR {_summary.net:N2}";

                if (_summary.methods != null)
                {
                    MethodsList.ItemsSource = _summary.methods.ToList();
                }
                
                LoadingText.Visibility = Visibility.Collapsed;
                SummaryPanel.Visibility = Visibility.Visible;
            }
            else
            {
                LoadingText.Text = "Failed to load summary data.";
                LoadingText.Foreground = (System.Windows.Media.Brush)FindResource("AccentDanger");
            }
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            this.Close();
        }

        private void Window_PreviewKeyDown(object sender, System.Windows.Input.KeyEventArgs e)
        {
            if (e.Key == System.Windows.Input.Key.Escape)
            {
                this.Close();
                e.Handled = true;
            }
            else if (e.Key == System.Windows.Input.Key.P || (e.Key == System.Windows.Input.Key.P && (System.Windows.Input.Keyboard.Modifiers & System.Windows.Input.ModifierKeys.Control) == System.Windows.Input.ModifierKeys.Control))
            {
                PrintBtn.RaiseEvent(new RoutedEventArgs(System.Windows.Controls.Primitives.ButtonBase.ClickEvent));
                e.Handled = true;
            }
        }

        private void Print_Click(object sender, RoutedEventArgs e)
        {
            if (_summary == null) return;
            PrintService.PrintZReport(_summary);
        }
    }
}
