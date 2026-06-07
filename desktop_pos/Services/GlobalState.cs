using DesktopPOS.Services;
using System.Collections.Generic;

namespace DesktopPOS.Services
{
    public class GlobalState
    {
        private static GlobalState? _instance;
        public static GlobalState Instance => _instance ??= new GlobalState();

        public CustomerModel? SelectedCustomer { get; set; }
        public int DefaultCustomerId { get; set; } = 1;
        public string OrderType { get; set; } = "Retail";
        public int? SelectedTableId { get; set; }
        public string? SelectedTableName { get; set; }
        public int? SelectedStewardId { get; set; }
        public string? SelectedStewardName { get; set; }
        public bool ShowItemImages { get; set; } = false;
        public List<CartItem> CartItems { get; set; } = new List<CartItem>();
        public string? LocationName { get; set; }
        public string? LocationAddress { get; set; }
        public string? LocationPhone { get; set; }
        public DesktopPOS.Models.UserDetails? CurrentUser { get; set; }
        public LocationDetailsModel? LocationDetails { get; set; }
        public int? HeldOrderId { get; set; }

        public DateTime SessionStartTime { get; set; } = DateTime.Now;

        private GlobalState() 
        { 
            ClearCart();
        }

        public void ClearCart()
        {
            var defId = SettingsService.Current.DefaultCustomerId;
            if (defId > 0)
            {
                SelectedCustomer = new CustomerModel { id = defId, name = SettingsService.Current.DefaultCustomerName };
            }
            else
            {
                SelectedCustomer = null;
            }
            CartItems.Clear();
            OrderType = "Retail";
            SelectedTableId = null;
            SelectedTableName = null;
            SelectedStewardId = null;
            SelectedStewardName = null;
            HeldOrderId = null;
        }

        public void Logout()
        {
            CurrentUser = null;
            ClearCart();
            DesktopPOS.Services.ApiService.JwtToken = "";
            DesktopPOS.Services.StorageService.ClearSession();
        }
    }

    public class CartItem
    {
        public int ProductId { get; set; }
        public string? Name { get; set; }
        public double Price { get; set; }
        public double Quantity { get; set; }
        public double Discount { get; set; }
        public string? ItemType { get; set; }
        public double LineTotal => (Price * Quantity) - Discount;
        public double UnitPrice => Price;
    }
}

