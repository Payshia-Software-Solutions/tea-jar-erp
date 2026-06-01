using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace DesktopPOS;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class MainWindow : Window
{
        public MainWindow()
        {
            InitializeComponent();
            this.KeyDown += MainWindow_KeyDown;
        }

    private void MainWindow_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.F11)
        {
            if (this.WindowStyle == WindowStyle.None)
            {
                this.WindowStyle = WindowStyle.SingleBorderWindow;
                this.WindowState = WindowState.Normal;
            }
            else
            {
                this.WindowStyle = WindowStyle.None;
                this.WindowState = WindowState.Maximized;
            }
        }
        else if (e.Key == Key.F5)
        {
            // Hard Reload
            DesktopPOS.Services.ApiService.ClearCache();
            if (DesktopPOS.Services.GlobalState.Instance.CurrentUser != null)
            {
                MainFrame.Navigate(new Pages.DashboardPage());
            }
        }
        else if (e.Key == Key.R && Keyboard.Modifiers == ModifierKeys.Control)
        {
            // Cancel everything and reload app
            DesktopPOS.Services.GlobalState.Instance.ClearCart();
            DesktopPOS.Services.GlobalState.Instance.HeldOrderId = 0;
            DesktopPOS.Services.GlobalState.Instance.SelectedCustomer = null;
            DesktopPOS.Services.ApiService.ClearCache();
            
            if (DesktopPOS.Services.GlobalState.Instance.CurrentUser != null)
            {
                MainFrame.Navigate(new Pages.DashboardPage());
            }
        }
    }

    // Public navigation helper used by pages that may not have a NavigationService
    public void NavigateTo(System.Windows.Controls.Page page)
    {
        MainFrame.Navigate(page);
    }
}