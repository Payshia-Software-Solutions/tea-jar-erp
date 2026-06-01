using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Linq;
using DesktopPOS.Models;

namespace DesktopPOS.Services
{
    public class ApiService
    {
        protected static readonly HttpClient _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        public static string BaseUrl { get; set; } = StorageService.LoadServerUrl();
        protected string _baseUrl => BaseUrl;
        public static string? JwtToken { get; set; }

        public ApiService()
        {
            // Do not initialize HttpClient here to prevent socket exhaustion
        }

        private void LogApiCall(string message)
        {
            try
            {
                var entry = $"[{DateTime.Now}] {message}\r\n------------------------------------\r\n";
                System.IO.File.AppendAllText("api_log.txt", entry);
            }
            catch {}
        }

        protected async Task<T?> PostAsync<T>(string endpoint, object data)
        {
            var url = $"{_baseUrl}/{endpoint}";
            var json = JsonConvert.SerializeObject(data);
            try
            {
                SetupHeaders();
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                LogApiCall($"POST {url}\r\nPayload: {json}");

                var response = await _httpClient.PostAsync(url, content).ConfigureAwait(false);
                var responseString = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                LogApiCall($"RESPONSE for POST {url}\r\nStatus: {response.StatusCode}\r\nBody: {responseString}");

                if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                {
                    HandleUnauthorized();
                    return default;
                }

                return JsonConvert.DeserializeObject<T>(responseString);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"API POST Error: {ex.Message}");
                LogApiCall($"ERROR POST {url}\r\nException: {ex.Message}");
                try
                {
                    System.IO.File.AppendAllText("crash_log.txt", $"=== API POST Error ({DateTime.Now}) ===\r\nEndpoint: {endpoint}\r\nException: {ex}\r\n====================================\r\n\r\n");
                }
                catch {}
                return default;
            }
        }

        public async Task<T?> GetAsync<T>(string endpoint)
        {
            var url = $"{_baseUrl}/{endpoint}";
            try
            {
                SetupHeaders();
                LogApiCall($"GET {url}");

                var response = await _httpClient.GetAsync(url).ConfigureAwait(false);
                var responseString = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                LogApiCall($"RESPONSE for GET {url}\r\nStatus: {response.StatusCode}\r\nBody: {responseString}");

                if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                {
                    HandleUnauthorized();
                    return default;
                }

                return JsonConvert.DeserializeObject<T>(responseString);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"API GET Error: {ex.Message}");
                LogApiCall($"ERROR GET {url}\r\nException: {ex.Message}");
                try
                {
                    System.IO.File.AppendAllText("crash_log.txt", $"=== API GET Error ({DateTime.Now}) ===\r\nEndpoint: {endpoint}\r\nException: {ex}\r\n====================================\r\n\r\n");
                }
                catch {}
                return default;
            }
        }

        private void SetupHeaders()
        {
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
            if (!string.IsNullOrEmpty(JwtToken))
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {JwtToken}");
        }

        private void HandleUnauthorized()
        {
            Application.Current.Dispatcher.Invoke(() =>
            {
                DesktopPOS.Services.GlobalState.Instance.Logout();
                var mainWindow = Application.Current.MainWindow as DesktopPOS.MainWindow;
                if (mainWindow != null)
                {
                    mainWindow.MainFrame.Navigate(new DesktopPOS.Pages.LoginPage());
                }
                
                var windows = Application.Current.Windows.Cast<Window>().ToList();
                foreach (var window in windows)
                {
                    if (window != mainWindow)
                    {
                        window.Close();
                    }
                }
            });
        }

        // ── Customer ──────────────────────────────────────────────────────────────
        private static List<CustomerModel>? _cachedCustomers;
        public async Task<List<CustomerModel>?> FetchCustomersAsync(bool forceRefresh = false)
        {
            if (!forceRefresh && _cachedCustomers != null) return _cachedCustomers;
            var result = await GetAsync<ApiResponse<List<CustomerModel>>>("customer/list");
            _cachedCustomers = result?.data;
            return _cachedCustomers;
        }

        // ── Products ──────────────────────────────────────────────────────────────
        public async Task<List<ProductModel>?> FetchProductsAsync(bool forceRefresh = false)
        {
            if (!forceRefresh && _cachedProducts != null && _cachedProducts.Count > 0)
                return _cachedProducts;

            var result = await GetAsync<ApiResponse<List<ProductModel>>>("part/list");
            _cachedProducts = result?.data ?? new List<ProductModel>();
            return _cachedProducts;
        }

        // ── Invoice / Order ───────────────────────────────────────────────────────
        public async Task<ApiResponse<InvoiceData>?> CreateInvoiceAsync(object payload)
        {
            return await PostAsync<ApiResponse<InvoiceData>>("invoice/create", payload);
        }

        // ── Cache ─────────────────────────────────────────────────────────────────
        private static List<TableModel>? _cachedTables;
        private static List<StewardModel>? _cachedStewards;
        private static List<ProductModel>? _cachedProducts;
        private static LocationDetailsModel? _cachedLocation;
        private static List<TaxModel>? _cachedTaxes;

        public static void ClearCache()
        {
            _cachedTables = null;
            _cachedStewards = null;
            _cachedProducts = null;
            _cachedLocation = null;
            _cachedTaxes = null;
            _cachedBanks = null;
            _cachedCustomers = null;
        }

        // ── Tables ────────────────────────────────────────────────────────────────
        public async Task<List<TableModel>> FetchTablesAsync(int locationId = 1)
        {
            if (_cachedTables != null && _cachedTables.Count > 0)
                return _cachedTables;

            var res = await GetAsync<ApiResponse<List<TableModel>>>($"table/list?location_id={locationId}");
            _cachedTables = res?.data ?? new List<TableModel>();
            return _cachedTables;
        }

        public async Task<List<StewardModel>> FetchStewardsAsync()
        {
            if (_cachedStewards != null && _cachedStewards.Count > 0)
                return _cachedStewards;

            var res = await GetAsync<ApiResponse<List<StewardModel>>>("pos/stewards");
            _cachedStewards = res?.data ?? new List<StewardModel>();
            return _cachedStewards;
        }

        // ── Hold Order ────────────────────────────────────────────────────────────
        public async Task<ApiResponse<HoldOrderData>?> HoldOrderAsync(object payload)
        {
            return await PostAsync<ApiResponse<HoldOrderData>>("pos/hold-order", payload);
        }

        // ── Held Orders ───────────────────────────────────────────────────────────
        public async Task<ApiResponse<List<object>>?> FetchHeldOrdersAsync(int locationId)
        {
            return await GetAsync<ApiResponse<List<object>>>($"pos/held-orders?location_id={locationId}");
        }

        // ── KOT ───────────────────────────────────────────────────────────────────
        public async Task<ApiResponse<HoldOrderData>?> FetchKotDetailsAsync(int orderId, bool full = false)
        {
            string url = $"pos/kot_details/{orderId}";
            if (full) url += "?full=1";
            return await GetAsync<ApiResponse<HoldOrderData>>(url);
        }

        public async Task<ApiResponse<object>?> MarkKotPrintedAsync(int orderId)
        {
            return await PostAsync<ApiResponse<object>>($"pos/mark_kot_printed/{orderId}", new { });
        }

        // ── Dashboard ─────────────────────────────────────────────────────────────
        public async Task<ApiResponse<ReturnInvoiceLookupResponse>?> FetchInvoiceForReturnAsync(string invoiceNo)
        {
            try
            {
                var url = $"{_baseUrl}/return/invoice_lookup?invoice_no={Uri.EscapeDataString(invoiceNo)}";
                SetupHeaders();
                var response = await _httpClient.GetAsync(url).ConfigureAwait(false);
                var responseString = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                return JsonConvert.DeserializeObject<ApiResponse<ReturnInvoiceLookupResponse>>(responseString);
            }
            catch { return null; }
        }

        public async Task<ApiResponse<object>?> ProcessReturnAsync(ReturnPayload payload)
        {
            return await PostAsync<ApiResponse<object>>("return/create", payload);
        }

        public async Task<ApiResponse<ReturnLookupResponse>?> LookupReturnForRefundAsync(string returnNo)
        {
            try
            {
                var url = $"{_baseUrl}/refund/return_lookup/{Uri.EscapeDataString(returnNo)}";
                SetupHeaders();
                var response = await _httpClient.GetAsync(url).ConfigureAwait(false);
                var responseString = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                return JsonConvert.DeserializeObject<ApiResponse<ReturnLookupResponse>>(responseString);
            }
            catch { return null; }
        }

        public async Task<ApiResponse<RefundCreateResult>?> CreateRefundAsync(RefundCreatePayload payload)
        {
            return await PostAsync<ApiResponse<RefundCreateResult>>("refund/create", payload);
        }

        public async Task<ApiResponse<List<ReturnLookupData>>?> FetchUnrefundedReturnsAsync()
        {
            try
            {
                int locationId = GlobalState.Instance.CurrentUser?.location_id ?? 1;
                var url = $"{_baseUrl}/refund/unrefunded?location_id={locationId}";
                SetupHeaders();
                var response = await _httpClient.GetAsync(url).ConfigureAwait(false);
                var responseString = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                return JsonConvert.DeserializeObject<ApiResponse<List<ReturnLookupData>>>(responseString);
            }
            catch { return null; }
        }

        public async Task<ApiResponse<DayLedgerResponse>?> FetchDayLedgerAsync()
        {
            try
            {
                var url = $"{_baseUrl}/pos/day_ledger?location_id={GlobalState.Instance.CurrentUser?.location_id ?? 1}";
                SetupHeaders();
                var response = await _httpClient.GetAsync(url).ConfigureAwait(false);
                var responseString = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                return JsonConvert.DeserializeObject<ApiResponse<DayLedgerResponse>>(responseString);
            }
            catch { return null; }
        }

        public async Task<ApiResponse<List<InvoiceListItem>>?> FetchInvoicesAsync(string? date = null)
        {
            try
            {
                var url = $"{_baseUrl}/invoice/list{(string.IsNullOrEmpty(date) ? "" : $"?date={Uri.EscapeDataString(date)}")}";
                SetupHeaders();
                var response = await _httpClient.GetAsync(url).ConfigureAwait(false);
                var responseString = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                return JsonConvert.DeserializeObject<ApiResponse<List<InvoiceListItem>>>(responseString);
            }
            catch { return null; }
        }

        public async Task<ApiResponse<dynamic>?> FetchDashboardSalesAsync()
        {
            return await GetAsync<ApiResponse<dynamic>>("dashboard/sales");
        }

        public async Task<ApiResponse<dynamic>?> FetchDashboardOverviewAsync()
        {
            return await GetAsync<ApiResponse<dynamic>>("dashboard/overview");
        }

        // ── Location Details ──────────────────────────────────────────────────────
        public async Task<LocationDetailsModel?> FetchLocationDetailsAsync(int locationId, bool forceRefresh = false)
        {
            if (!forceRefresh && _cachedLocation != null && _cachedLocation.id == locationId)
                return _cachedLocation;

            var res = await GetAsync<ApiResponse<LocationDetailsModel>>($"location/get/{locationId}");
            _cachedLocation = res?.data;
            return _cachedLocation;
        }

        // ── Taxes ─────────────────────────────────────────────────────────────────
        public async Task<List<TaxModel>?> FetchTaxesAsync(bool forceRefresh = false)
        {
            if (!forceRefresh && _cachedTaxes != null) return _cachedTaxes;

            var res = await GetAsync<ApiResponse<List<TaxModel>>>("tax/list");
            if (res != null && res.success)
            {
                _cachedTaxes = res.data;
                return _cachedTaxes;
            }
            return null;
        }

        // ── Banks ─────────────────────────────────────────────────────────────────
        private static List<BankModel>? _cachedBanks;
        public async Task<List<BankModel>?> FetchBanksAsync(bool forceRefresh = false)
        {
            if (!forceRefresh && _cachedBanks != null) return _cachedBanks;
            var res = await GetAsync<ApiResponse<List<BankModel>>>("bank/list");
            _cachedBanks = res?.data;
            return _cachedBanks;
        }
    }

    // ── Response Wrappers ─────────────────────────────────────────────────────────
    public class ApiResponse<T>
    {
        public string? status { get; set; }
        
        private bool _success;
        public bool success 
        { 
            get => _success || status == "success"; 
            set => _success = value; 
        }
        
        public string? message { get; set; }
        public T? data { get; set; }
    }

    public class CustomerModel
    {
        public int id { get; set; }
        public string? name { get; set; }
        public string? phone { get; set; }
        public string? email { get; set; }
    }

    public class ProductModel
    {
        public int id { get; set; }
        
        [Newtonsoft.Json.JsonProperty("part_name")]
        public string? name { get; set; }
        
        public string? sku { get; set; }
        public double price { get; set; }
        public double stock_level { get; set; }
        public string? item_type { get; set; }
        
        [Newtonsoft.Json.JsonProperty("image_filename")]
        public string? image_url { get; set; }
    }

    public class InvoiceData
    {
        public string? id { get; set; }
        public string? invoice_no { get; set; }
    }

    public class HoldOrderData
    {
        public int id { get; set; }
        public int location_id { get; set; }
        public int customer_id { get; set; }
        public string? customer_name { get; set; }
        public double grand_total { get; set; }
        public string? created_at { get; set; }
        public string? order_type { get; set; }
        public int? table_id { get; set; }
        public int? steward_id { get; set; }
        public List<HoldOrderItem>? items { get; set; }
    }

    public class HoldOrderItem
    {
        public string? item_id { get; set; }
        public string? description { get; set; }
        public string? item_type { get; set; }
        public double unit_price { get; set; }
        public double quantity { get; set; }
        public double discount { get; set; }
        public double line_total { get; set; }
    }

    public class LocationDetailsModel
    {
        public int id { get; set; }
        public string? address { get; set; }
        public string? phone { get; set; }
        public string? allowed_taxes_json { get; set; }
        public string? default_customer_id { get; set; }
    }

    public class TableModel
    {
        public int id { get; set; }
        public string? name { get; set; }
        public string? status { get; set; }
    }

    public class StewardModel
    {
        public int id { get; set; }
        public string? name { get; set; }
        public string? email { get; set; }
        public string? role_name { get; set; }
    }

    public class BankModel
    {
        public int id { get; set; }
        public string? name { get; set; }
        public string? code { get; set; }
        public int is_active { get; set; }
    }

    public class ReturnInvoiceData
    {
        public int id { get; set; }
        public string? invoice_no { get; set; }
        public int customer_id { get; set; }
        public string? customer_name { get; set; }
        public double grand_total { get; set; }
        public double paid_amount { get; set; }
    }

    public class ReturnInvoiceLookupResponse
    {
        public ReturnInvoiceData? invoice { get; set; }
        public List<ReturnInvoiceItem>? items { get; set; }
    }

    public class ReturnInvoiceItem
    {
        public int id { get; set; }
        public int invoice_id { get; set; }
        public int item_id { get; set; }
        public string? item_type { get; set; }
        public string? description { get; set; }
        public double quantity { get; set; }
        public double unit_price { get; set; }
        public double discount { get; set; }
        public double tax_amount { get; set; }
        public double line_total { get; set; }
        public double returned_qty { get; set; }
        
        // For UI binding
        public double return_qty { get; set; }
        public double refund_amount { get; set; }
    }

    public class ReturnPayload
    {
        public int invoice_id { get; set; }
        public int customer_id { get; set; }
        public int location_id { get; set; }
        public string reason { get; set; } = "Customer Request";
        public double total_amount { get; set; }
        public List<ReturnPayloadItem> items { get; set; } = new List<ReturnPayloadItem>();
        public RefundPayload? refund { get; set; }
    }

    public class ReturnPayloadItem
    {
        public string? item_type { get; set; }
        public string? item_id { get; set; }
        public string? description { get; set; }
        public double quantity { get; set; }
        public double unit_price { get; set; }
        public double line_total { get; set; }
    }

    public class RefundPayload
    {
        public string payment_method { get; set; } = "Cash";
        public double amount { get; set; }
        public string reference_no { get; set; } = "";
        public string notes { get; set; } = "POS Return Refund";
    }

    public class DayLedgerResponse
    {
        public DayLedgerSummary? summary { get; set; }
    }

    public class DayLedgerSummary
    {
        public double sales { get; set; }
        public double returns { get; set; }
        public double refunds { get; set; }
        public double net { get; set; }
        public Dictionary<string, double>? methods { get; set; }
    }

    public class InvoiceListItem
    {
        public int id { get; set; }
        public string? invoice_no { get; set; }
        public string? customer_name { get; set; }
        public double grand_total { get; set; }
        public string? created_at { get; set; }
    }

    public class ReturnLookupResponse
    {
        [JsonProperty("return")]
        public ReturnLookupData? ReturnDoc { get; set; }
        public List<ReturnInvoiceItem>? items { get; set; }
        public bool is_refunded { get; set; }
    }

    public class ReturnLookupData
    {
        public int id { get; set; }
        public string? return_no { get; set; }
        public string? return_date { get; set; }
        public int invoice_id { get; set; }
        public string? invoice_no { get; set; }
        public int customer_id { get; set; }
        public string? customer_name { get; set; }
        public double total_amount { get; set; }
        public string? reason { get; set; }
        public int location_id { get; set; }
        public string? location_name { get; set; }
    }

    public class RefundCreatePayload
    {
        public int return_id { get; set; }
        public int invoice_id { get; set; }
        public int location_id { get; set; }
        public double amount { get; set; }
        public string payment_method { get; set; } = "Cash";
        public string reference_no { get; set; } = "";
        public string notes { get; set; } = "POS Return Refund";
    }

    public class RefundCreateResult
    {
        public int id { get; set; }
        public string? refund_no { get; set; }
    }
}
