using DesktopPOS.Services;
using DesktopPOS.Models;
using System;
using System.Linq;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace DesktopPOS.Pages
{
    public partial class DashboardPage : Page
    {
        private readonly ApiService _apiService = new ApiService();
        
        public DashboardPage()
        {
            InitializeComponent();
            this.Loaded += DashboardPage_Loaded;
        }

        private async void DashboardPage_Loaded(object sender, RoutedEventArgs e)
        {
            var user = GlobalState.Instance.CurrentUser;
            if (user != null)
            {
                PanelLocationNameText.Text = string.IsNullOrEmpty(user.location_name) ? "Main Branch" : user.location_name;
                PanelManagerNameText.Text = string.IsNullOrEmpty(user.name) ? "Admin" : user.name;
                
                try
                {
                    var locationDetails = await _apiService.FetchLocationDetailsAsync(user.location_id);
                    var allTaxes = await _apiService.FetchTaxesAsync();

                    if (locationDetails != null)
                    {
                        PanelAddressText.Text = string.IsNullOrEmpty(locationDetails.address) ? "Address not available" : locationDetails.address;
                        PanelContactText.Text = string.IsNullOrEmpty(locationDetails.phone) ? "Contact not available" : locationDetails.phone;

                        GlobalState.Instance.LocationName = user.location_name;
                        GlobalState.Instance.LocationAddress = locationDetails.address;
                        GlobalState.Instance.LocationPhone = locationDetails.phone;

                        if (int.TryParse(locationDetails.default_customer_id, out int defCustId))
                        {
                            GlobalState.Instance.DefaultCustomerId = defCustId;
                        }

                        if (!string.IsNullOrEmpty(locationDetails.allowed_taxes_json) && allTaxes != null)
                        {
                            try
                            {
                                var allowedTaxIds = Newtonsoft.Json.JsonConvert.DeserializeObject<List<string>>(locationDetails.allowed_taxes_json);
                                if (allowedTaxIds != null)
                                {
                                    PanelActiveTaxesList.ItemsSource = allTaxes.Where(t => t.is_active == 1 && allowedTaxIds.Contains(t.id.ToString()))
                                                                               .OrderBy(t => t.sort_order).ToList();
                                }
                            }
                            catch { }
                        }
                    }
                }
                catch
                {
                    PanelAddressText.Text = "Address not available";
                    PanelContactText.Text = "Contact not available";
                }
            }
            
            PanelOsInfoText.Text = System.Runtime.InteropServices.RuntimeInformation.OSDescription;

            await LoadDashboardStats();
        }

        private async System.Threading.Tasks.Task LoadDashboardStats()
        {
            try
            {
#pragma warning disable CS8602
                var salesRes = await _apiService.FetchDashboardSalesAsync();
                if (salesRes?.success == true && salesRes.data?.kpis?.today != null)
                {
                    double revenue = salesRes.data!.kpis!.today!.revenue;
                    TotalSalesText.Text = $"LKR {revenue:N2}";
                }

                var overviewRes = await _apiService.FetchDashboardOverviewAsync();
                if (overviewRes?.success == true && overviewRes.data?.completedToday != null)
                {
                    OrderCountText.Text = overviewRes.data!.completedToday.ToString();
                }
#pragma warning restore CS8602

                // Fetch POS Held Orders for the dashboard
                int locationId = GlobalState.Instance.CurrentUser?.location_id ?? 1;
                var heldOrdersRes = await _apiService.FetchHeldOrdersAsync(locationId);
                if (heldOrdersRes != null && heldOrdersRes.success && heldOrdersRes.data != null)
                {
                    HeldOrdersText.Text = heldOrdersRes.data.Count.ToString();
                }

                // Calculate session time
                if (GlobalState.Instance.SessionStartTime != default)
                {
                    var duration = DateTime.Now - GlobalState.Instance.SessionStartTime;
                    SessionTimeText.Text = $"{(int)duration.TotalHours}h {duration.Minutes}m";
                }
            }
            catch (Exception)
            {
                // Optionally handle or ignore errors for dashboard stats
            }
        }

        private void ShowOrderTypeDialog()
        {
            var dialog = new OrderTypeDialog();
            var mainWindow = Application.Current.MainWindow;
            
            if (mainWindow != null)
            {
                dialog.Owner = mainWindow;
                mainWindow.Effect = new System.Windows.Media.Effects.BlurEffect { Radius = 10 };
            }
            
            if (dialog.ShowDialog() == true)
            {
                if (GlobalState.Instance.OrderType == "Dine In")
                {
                    var tableDialog = new TableSelectionDialog { Owner = mainWindow };
                    if (tableDialog.ShowDialog() == true)
                    {
                        var stewardDialog = new StewardSelectionDialog { Owner = mainWindow };
                        if (stewardDialog.ShowDialog() == true)
                        {
                            if (mainWindow != null) mainWindow.Effect = null;
                            NavigationService.Navigate(new PosPage());
                            return;
                        }
                    }
                }
                else
                {
                    if (mainWindow != null) mainWindow.Effect = null;
                    NavigationService.Navigate(new PosPage());
                    return;
                }
            }
            
            if (mainWindow != null) mainWindow.Effect = null;
        }

        private void NewTransaction_Click(object sender, RoutedEventArgs e) => ShowOrderTypeDialog();
        private void QuickSale_Click(object sender, MouseButtonEventArgs e) => ShowOrderTypeDialog();
        private void NewOrder_Click(object sender, MouseButtonEventArgs e) => ShowOrderTypeDialog();

        private void NewTransaction_Keyboard(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter || e.Key == Key.Space) ShowOrderTypeDialog();
        }

        private void Action_Keyboard(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter || e.Key == Key.Space) ShowOrderTypeDialog();
        }

        private void ResumeBill_Click(object sender, MouseButtonEventArgs e)
        {
            OpenHeldOrders();
        }

        private void ProcessReturn_Click(object sender, MouseButtonEventArgs e)
        {
            OpenProcessReturn();
        }

        private void OpenHeldOrders()
        {
            var dialog = new HeldOrdersDialog();
            var mainWindow = Application.Current.MainWindow;
            if (mainWindow != null)
            {
                dialog.Owner = mainWindow;
                mainWindow.Effect = new System.Windows.Media.Effects.BlurEffect { Radius = 10 };
            }

            if (dialog.ShowDialog() == true)
            {
                if (mainWindow != null) mainWindow.Effect = null;
                NavigationService.Navigate(new PosPage());
                return;
            }
            if (mainWindow != null) mainWindow.Effect = null;
        }

        private void OpenProcessReturn()
        {
            var dialog = new ReturnDialog();
            dialog.Owner = Window.GetWindow(this);
            dialog.ShowDialog();
        }

        private void Refund_Click(object sender, MouseButtonEventArgs e)
        {
            OpenRefund();
        }

        private void OpenRefund()
        {
            var dialog = new RefundDialog();
            dialog.Owner = Window.GetWindow(this);
            dialog.ShowDialog();
        }

        private void Page_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.F1)
            {
                GlobalState.Instance.ClearCart();
                ShowOrderTypeDialog();
                e.Handled = true;
            }
            else if (e.Key == Key.F2)
            {
                OpenHeldOrders();
                e.Handled = true;
            }
            else if (e.Key == Key.F3)
            {
                OpenProcessReturn();
                e.Handled = true;
            }
            else if (e.Key == Key.F6)
            {
                OpenRefund();
                e.Handled = true;
            }
            else if (e.Key == Key.F4)
            {
                OpenTodaySummary();
                e.Handled = true;
            }
            else if (e.Key == Key.F5)
            {
                OpenReprintInvoice();
                e.Handled = true;
            }
        }

        private void OpenTodaySummary()
        {
            var dialog = new TodaySummaryDialog();
            var mainWindow = Application.Current.MainWindow;
            if (mainWindow != null)
            {
                dialog.Owner = mainWindow;
                mainWindow.Effect = new System.Windows.Media.Effects.BlurEffect { Radius = 10 };
            }
            
            dialog.ShowDialog();
            
            if (mainWindow != null) mainWindow.Effect = null;
        }

        private void OpenReprintInvoice()
        {
            var dialog = new InvoiceReprintDialog();
            var mainWindow = Application.Current.MainWindow;
            if (mainWindow != null)
            {
                dialog.Owner = mainWindow;
                mainWindow.Effect = new System.Windows.Media.Effects.BlurEffect { Radius = 10 };
            }
            
            dialog.ShowDialog();
            
            if (mainWindow != null) mainWindow.Effect = null;
        }

        private void TodaySummary_Click(object sender, MouseButtonEventArgs e)
        {
            OpenTodaySummary();
        }

        private void ReprintInvoice_Click(object sender, MouseButtonEventArgs e)
        {
            OpenReprintInvoice();
        }

        private void Logout_Click(object sender, MouseButtonEventArgs e)
        {
            var result = MessageBox.Show("Are you sure you want to log out?", "Logout", MessageBoxButton.YesNo, MessageBoxImage.Question);
            if (result == MessageBoxResult.Yes)
            {
                GlobalState.Instance.ClearCart();
                GlobalState.Instance.CurrentUser = null;
                ApiService.ClearCache();
                StorageService.ClearSession();
                NavigationService.Navigate(new LoginPage());
            }
        }
    }
}
