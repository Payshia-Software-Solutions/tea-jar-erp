using DesktopPOS.Services;
using DesktopPOS.Models;
using System.Windows;
using System.Windows.Controls;
using System;
using System.Collections.Generic;

namespace DesktopPOS.Pages
{
    public partial class HeldOrdersDialog : Window
    {
        private readonly ApiService _api = new();

        public HeldOrdersDialog()
        {
            InitializeComponent();
            Loaded += async (s, e) => await LoadOrders();
        }

        private async System.Threading.Tasks.Task LoadOrders()
        {
            try
            {
                LoadingOverlay.Visibility = Visibility.Visible;
                int locationId = GlobalState.Instance.CurrentUser?.location_id ?? 1;
                var res = await _api.GetAsync<ApiResponse<List<HoldOrderData>>>($"pos/held-orders?location_id={locationId}");
                if (res != null && res.success && res.data != null)
                {
                    OrdersList.ItemsSource = res.data;
                }
                else
                {
                    string dbg = $"res is null? {res == null}\n";
                    if (res != null) {
                        dbg += $"res.success: {res.success}\n";
                        dbg += $"res.status: {res.status}\n";
                        dbg += $"res.data is null? {res.data == null}\n";
                    }
                    MessageBox.Show($"Could not load held orders.\n\n{dbg}", "Load Failed", MessageBoxButton.OK, MessageBoxImage.Warning);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error loading held orders: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
            finally
            {
                LoadingOverlay.Visibility = Visibility.Collapsed;
            }
        }

        private void Cancel_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }

        private async void Resume_Click(object sender, RoutedEventArgs e)
        {
            if (OrdersList.SelectedItem is HoldOrderData selected)
            {
                try
                {
                    LoadingOverlay.Visibility = Visibility.Visible;
                    var res = await _api.GetAsync<ApiResponse<HoldOrderData>>($"pos/load_held_order/{selected.id}");
                    if (res != null && res.success && res.data != null)
                    {
                        var order = res.data;
                        
                        GlobalState.Instance.ClearCart();
                        GlobalState.Instance.HeldOrderId = order.id;
                        GlobalState.Instance.OrderType = order.order_type ?? "Retail";
                        GlobalState.Instance.SelectedTableId = order.table_id;
                        GlobalState.Instance.SelectedStewardId = order.steward_id;
                        
                        if (order.customer_id > 0)
                        {
                            GlobalState.Instance.SelectedCustomer = new CustomerModel 
                            { 
                                id = order.customer_id, 
                                name = order.customer_name ?? "Walk-in Customer" 
                            };
                        }

                        if (order.items != null)
                        {
                            foreach (var item in order.items)
                            {
                                GlobalState.Instance.CartItems.Add(new CartItem
                                {
                                    ProductId = int.TryParse(item.item_id, out int pid) ? pid : 0,
                                    Name = item.description,
                                    ItemType = item.item_type,
                                    Price = item.unit_price,
                                    Quantity = item.quantity,
                                    // item.discount is unit discount in the payload, so total discount = unit_discount * quantity
                                    Discount = item.discount * item.quantity 
                                });
                            }
                        }

                        DialogResult = true;
                        Close();
                    }
                    else
                    {
                        MessageBox.Show($"Failed to load held order details: {res?.message ?? "Unknown error"}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                    }
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Error loading held order: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                }
                finally
                {
                    LoadingOverlay.Visibility = Visibility.Collapsed;
                }
            }
            else
            {
                MessageBox.Show("Please select an order from the list to resume.", "Select Order", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }

        private async void PrintKot_Click(object sender, RoutedEventArgs e)
        {
            if (OrdersList.SelectedItem is HoldOrderData selected)
            {
                try
                {
                    LoadingOverlay.Visibility = Visibility.Visible;
                    await PosPage.PrintKotAsync(selected.id, full: true);
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Error printing full KOT: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                }
                finally
                {
                    LoadingOverlay.Visibility = Visibility.Collapsed;
                }
            }
            else
            {
                MessageBox.Show("Please select an order from the list to print the full KOT.", "Select Order", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }
    }
}
