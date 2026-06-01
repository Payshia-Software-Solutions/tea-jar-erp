using System.Windows;
using System.Windows.Input;

namespace DesktopPOS.Pages
{
    public partial class ShortcutsInfoDialog : Window
    {
        public ShortcutsInfoDialog()
        {
            InitializeComponent();
            this.PreviewKeyDown += ShortcutsInfoDialog_PreviewKeyDown;
        }

        private void ShortcutsInfoDialog_PreviewKeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Escape)
            {
                this.DialogResult = false;
                e.Handled = true;
            }
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            this.DialogResult = false;
        }
    }
}
