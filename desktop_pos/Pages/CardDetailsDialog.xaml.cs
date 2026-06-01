using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;

namespace DesktopPOS.Pages
{
    public partial class CardDetailsDialog : Window
    {
        public string CardType { get; private set; } = "Visa";
        public string CardLast4 { get; private set; } = "";
        public string CardAuthCode { get; private set; } = "";

        public CardDetailsDialog(string initialType = "Visa", string initialLast4 = "", string initialAuth = "")
        {
            InitializeComponent();
            CardType = string.IsNullOrEmpty(initialType) ? "Visa" : initialType;
            CardLast4 = initialLast4;
            CardAuthCode = initialAuth;

            CardLast4Box.Text = CardLast4;
            CardAuthBox.Text = CardAuthCode;

            HighlightActiveCardType();

            Loaded += (s, e) =>
            {
                CardLast4Box.Focus();
                CardLast4Box.SelectAll();
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
                Confirm_Click(this, new RoutedEventArgs());
                e.Handled = true;
            }
        }

        private void CardTypeBtn_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn)
            {
                CardType = btn.Content.ToString() ?? "Visa";
                HighlightActiveCardType();
            }
        }

        private void HighlightActiveCardType()
        {
            var activeBg = (Brush)FindResource("AccentPrimary");
            var activeFg = Brushes.White;
            var inactiveBg = (Brush)FindResource("BgCard");
            var inactiveFg = (Brush)FindResource("TextSecondary");

            foreach (var b in new[] { VisaBtn, MasterBtn, AmexBtn, OtherBtn })
            {
                b.Background = inactiveBg;
                b.Foreground = inactiveFg;
            }

            if (CardType == "Visa") { VisaBtn.Background = activeBg; VisaBtn.Foreground = activeFg; }
            else if (CardType == "Master") { MasterBtn.Background = activeBg; MasterBtn.Foreground = activeFg; }
            else if (CardType == "Amex") { AmexBtn.Background = activeBg; AmexBtn.Foreground = activeFg; }
            else if (CardType == "Other") { OtherBtn.Background = activeBg; OtherBtn.Foreground = activeFg; }
        }

        private void NumberOnly_PreviewTextInput(object sender, TextCompositionEventArgs e)
        {
            e.Handled = !Regex.IsMatch(e.Text, "^[0-9]+$");
        }



        private void Confirm_Click(object sender, RoutedEventArgs e)
        {
            ErrorText.Visibility = Visibility.Collapsed;

            if (string.IsNullOrWhiteSpace(CardLast4Box.Text) || CardLast4Box.Text.Length < 4)
            {
                ErrorText.Text = "Please enter exactly 4 digits of the card number.";
                ErrorText.Visibility = Visibility.Visible;
                return;
            }

            CardLast4 = CardLast4Box.Text;
            CardAuthCode = CardAuthBox.Text;

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
