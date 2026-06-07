using DesktopPOS.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using DesktopPOS.Models;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Effects;

namespace DesktopPOS.Pages
{
    public partial class PosPage : Page
    {
        private readonly ApiService _api = new();
        private List<ProductModel> _allProducts = new();
        private List<TaxModel> _activeTaxes = new();
        private List<CartItem> Cart => GlobalState.Instance.CartItems;
        private double _discount = 0;
        private double _discountValue = 0;
        private bool _isDiscountPercentage = true;

        public PosPage()
        {
            InitializeComponent();
            Loaded += async (s, e) =>
            {
                ApplySessionInfo();
                await LoadProducts();
                await LoadTaxes();
                RefreshCart();

                var win = Window.GetWindow(this);
                if (win != null)
                {
                    win.PreviewKeyDown += Page_PreviewKeyDown;
                }
            };
            Unloaded += (s, e) =>
            {
                var win = Window.GetWindow(this);
                if (win != null)
                {
                    win.PreviewKeyDown -= Page_PreviewKeyDown;
                }
            };
        }

        private void ApplySessionInfo()
        {
            var customer = GlobalState.Instance.SelectedCustomer;
            CustomerDisplay.Text = customer?.name ?? "Walk-in Customer";

            var orderType = GlobalState.Instance.OrderType ?? "Retail";
            OrderTypeBadge.Text = orderType.ToUpper();
            OrderModeHint.Text = $"Mode: {orderType.ToUpper()}";

            var tableName = GlobalState.Instance.SelectedTableName;
            TableBadge.Text = tableName != null ? $"📋 {tableName}" : "";
        }

        private async System.Threading.Tasks.Task LoadTaxes()
        {
            var locationId = GlobalState.Instance.CurrentUser?.location_id ?? 1;
            var locationDetails = await _api.FetchLocationDetailsAsync(locationId);

            if (locationDetails != null)
            {
                GlobalState.Instance.LocationName = GlobalState.Instance.CurrentUser?.location_name;
                GlobalState.Instance.LocationAddress = locationDetails.address;
                GlobalState.Instance.LocationPhone = locationDetails.phone;

                if (int.TryParse(locationDetails.default_customer_id, out int defCustId))
                {
                    GlobalState.Instance.DefaultCustomerId = defCustId;
                }
            }
            
            var allTaxes = await _api.FetchTaxesAsync() ?? new List<TaxModel>();
            
            _activeTaxes.Clear();
            if (locationDetails != null && !string.IsNullOrEmpty(locationDetails.allowed_taxes_json))
            {
                try
                {
                    var allowedTaxIds = Newtonsoft.Json.JsonConvert.DeserializeObject<List<string>>(locationDetails.allowed_taxes_json);
                    if (allowedTaxIds != null)
                    {
                        _activeTaxes = allTaxes.Where(t => t.is_active == 1 && allowedTaxIds.Contains(t.id.ToString()))
                                               .OrderBy(t => t.sort_order).ToList();
                    }
                }
                catch { }
            }
        }

        // ─── Product Loading ────────────────────────────────────────────────────────

        private async System.Threading.Tasks.Task LoadProducts(bool forceRefresh = false)
        {
            LoadingPanel.Visibility = Visibility.Visible;
            ProductScroller.Visibility = Visibility.Collapsed;
            EmptyPanel.Visibility = Visibility.Collapsed;

            try
            {
                var result = await _api.FetchProductsAsync(forceRefresh);
                var fetchedProducts = result ?? new List<ProductModel>();

                int locId = GlobalState.Instance.CurrentUser?.location_id ?? 0;
                if (locId > 0)
                {
                    _allProducts = fetchedProducts.Where(p => 
                        string.IsNullOrEmpty(p.allowed_locations) || 
                        p.allowed_locations.Split(',').Select(x => x.Trim()).Contains(locId.ToString())
                    ).ToList();
                }
                else
                {
                    _allProducts = fetchedProducts;
                }

                RenderProducts(_allProducts);
            }
            catch (Exception ex)
            {
                LoadingPanel.Visibility = Visibility.Collapsed;
                EmptyPanel.Visibility = Visibility.Visible;
                MessageBox.Show($"Failed to load products: {ex.Message}", "Connection Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void RenderProducts(List<ProductModel> products)
        {
            LoadingPanel.Visibility = Visibility.Collapsed;
            if (products.Count == 0)
            {
                EmptyPanel.Visibility = Visibility.Visible;
                ProductScroller.Visibility = Visibility.Collapsed;
                return;
            }
            EmptyPanel.Visibility = Visibility.Collapsed;
            ProductScroller.Visibility = Visibility.Visible;
            ProductsPanel.Children.Clear();
            foreach (var p in products)
                ProductsPanel.Children.Add(BuildProductCard(p));
        }

        private Border BuildProductCard(ProductModel product)
        {
            bool isService = product.item_type?.ToLower() == "service" || 
                             product.recipe_type?.ToLower() == "a la carte" || 
                             product.recipe_type?.ToLower() == "buffet";
            bool outOfStock = !isService && product.stock_level <= 0;

            // Type badge
            var categoryBadge = new Border
            {
                CornerRadius = new CornerRadius(4),
                Padding = new Thickness(5, 2, 5, 2)
            };
            categoryBadge.SetResourceReference(Border.BackgroundProperty, "IconBgPurple");
            var categoryBadgeText = new TextBlock
            {
                Text = "SERVICE",
                FontSize = 8,
                FontWeight = FontWeights.Bold
            };
            categoryBadgeText.SetResourceReference(TextBlock.ForegroundProperty, "IconFgPurple");
            categoryBadge.Child = categoryBadgeText;

            var typeBadge = new Border
            {
                CornerRadius = new CornerRadius(4),
                Padding = new Thickness(5, 2, 5, 2)
            };
            typeBadge.SetResourceReference(Border.BackgroundProperty, "IconBgAmber");
            var typeBadgeText = new TextBlock
            {
                Text = "A LA CARTE",
                FontSize = 8,
                FontWeight = FontWeights.Bold
            };
            typeBadgeText.SetResourceReference(TextBlock.ForegroundProperty, "AccentWarning");
            typeBadge.Child = typeBadgeText;

            var badges = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 6) };
            
            if (product.recipe_type?.ToLower() == "a la carte" || product.recipe_type?.ToLower() == "buffet") {
                typeBadgeText.Text = product.recipe_type.ToUpper();
                badges.Children.Add(typeBadge);
            }
            if (product.item_type?.ToLower() == "service") {
                badges.Children.Add(categoryBadge);
            }

            var skuText = new TextBlock
            {
                Text = product.sku ?? "",
                FontSize = 9,
                Margin = new Thickness(0, 0, 0, 4),
                TextTrimming = TextTrimming.CharacterEllipsis
            };
            skuText.SetResourceReference(TextBlock.ForegroundProperty, "TextSecondary");

            var nameText = new TextBlock
            {
                Text = product.name,
                FontSize = 13,
                FontWeight = FontWeights.SemiBold,
                TextWrapping = TextWrapping.Wrap,
                MaxHeight = 38,
                Margin = new Thickness(0, 0, 0, 8)
            };
            nameText.SetResourceReference(TextBlock.ForegroundProperty, outOfStock ? "TextMuted" : "TextPrimary");

            var priceRow = new DockPanel { Margin = new Thickness(0, 0, 0, 0) };
            var priceText = new TextBlock
            {
                Text = $"LKR {product.price:N2}",
                FontSize = 15,
                FontWeight = FontWeights.Bold,
                VerticalAlignment = VerticalAlignment.Center
            };
            priceText.SetResourceReference(TextBlock.ForegroundProperty, outOfStock ? "TextMuted" : "AccentSuccess");

            var addBtn = new Border
            {
                Width = 28,
                Height = 28,
                CornerRadius = new CornerRadius(8),
                Cursor = outOfStock ? Cursors.No : Cursors.Hand
            };
            addBtn.SetResourceReference(Border.BackgroundProperty, outOfStock ? "BgCard" : "AccentPrimary");

            var addBtnText = new TextBlock
            {
                Text = "+",
                FontSize = 18,
                FontWeight = FontWeights.Bold,
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center
            };
            addBtnText.SetResourceReference(TextBlock.ForegroundProperty, outOfStock ? "TextMuted" : "TextInverted");
            addBtn.Child = addBtnText;

            if (!outOfStock)
                addBtn.MouseLeftButtonUp += (s, e) => { e.Handled = true; ShowItemDialog(product); };

            DockPanel.SetDock(addBtn, Dock.Right);
            priceRow.Children.Add(addBtn);
            priceRow.Children.Add(priceText);

            var content = new StackPanel { Margin = new Thickness(12, 10, 12, 10) };

            if (GlobalState.Instance.ShowItemImages && !string.IsNullOrEmpty(product.image_url))
            {
                try
                {
                    var imgUrl = $"https://content-provider.payshia.com/service-center-system/items/{product.image_url}";
                    var img = new Image
                    {
                        Source = new System.Windows.Media.Imaging.BitmapImage(new Uri(imgUrl)),
                        Height = 100,
                        Stretch = Stretch.UniformToFill,
                        Margin = new Thickness(0, 0, 0, 10)
                    };
                    
                    var imgBorder = new Border
                    {
                        CornerRadius = new CornerRadius(8),
                        ClipToBounds = true,
                        Child = img
                    };
                    content.Children.Add(imgBorder);
                }
                catch { } // Ignore image load errors
            }

            content.Children.Add(badges);
            content.Children.Add(skuText);
            content.Children.Add(nameText);
            content.Children.Add(priceRow);

            var card = new Border
            {
                Width = 180,
                Margin = new Thickness(6),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(10),
                Child = content,
                Cursor = outOfStock ? Cursors.Arrow : Cursors.Hand,
                Effect = new DropShadowEffect { Color = Colors.Black, Opacity = 0.2, BlurRadius = 8, ShadowDepth = 2 }
            };
            card.SetResourceReference(Border.BackgroundProperty, "BgCardElevated");
            card.SetResourceReference(Border.BorderBrushProperty, "BorderPrimary");

            if (!outOfStock)
                card.MouseLeftButtonUp += (s, e) => ShowItemDialog(product);

            return card;
        }

        // ─── Item Dialog (Numpad) ────────────────────────────────────────────────────

        private void ShowItemDialog(ProductModel product)
        {
            var dialog = new ItemQuantityDialog(product);
            var mainWindow = Application.Current.MainWindow;
            
            if (mainWindow != null)
            {
                dialog.Owner = mainWindow;
                mainWindow.Effect = new System.Windows.Media.Effects.BlurEffect { Radius = 10 };
            }

            if (dialog.ShowDialog() == true)
            {
                AddToCart(product, dialog.SelectedQuantity, dialog.LineDiscount);
            }

            if (mainWindow != null)
            {
                mainWindow.Effect = null;
            }
        }

        // ─── Search & Filter ────────────────────────────────────────────────────────

        private void SearchBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            var q = SearchBox.Text.ToLower();
            var filtered = string.IsNullOrWhiteSpace(q)
                ? _allProducts
                : _allProducts.Where(p => (p.name?.ToLower().Contains(q) ?? false) || (p.sku?.ToLower().Contains(q) ?? false)).ToList();
            RenderProducts(filtered);
        }

        private void AllItems_Click(object sender, MouseButtonEventArgs e) => RenderProducts(_allProducts);
        private void CatStandard_Click(object sender, MouseButtonEventArgs e) =>
            RenderProducts(_allProducts.Where(p => p.item_type?.ToLower() != "service").ToList());
        private void CatAlaCarte_Click(object sender, MouseButtonEventArgs e) =>
            RenderProducts(_allProducts.Where(p => p.item_type?.ToLower() == "service").ToList());
        private void CatRecipe_Click(object sender, MouseButtonEventArgs e) =>
            RenderProducts(_allProducts.Where(p => p.item_type?.ToLower() == "recipe").ToList());

        private async void RefreshCache_Click(object sender, RoutedEventArgs e)
        {
            var btn = sender as Button;
            if (btn != null) btn.IsEnabled = false;
            
            try
            {
                await LoadProducts(forceRefresh: true);
            }
            finally
            {
                if (btn != null) btn.IsEnabled = true;
            }
        }

        private void ToggleImages_Click(object sender, RoutedEventArgs e)
        {
            GlobalState.Instance.ShowItemImages = !GlobalState.Instance.ShowItemImages;
            UpdateToggleImagesUI();
            RenderProducts(_allProducts);
        }

        private void UpdateToggleImagesUI()
        {
            if (ToggleImagesText != null)
            {
                if (GlobalState.Instance.ShowItemImages)
                {
                    ToggleImagesText.Text = "Hide Images";
                }
                else
                {
                    ToggleImagesText.Text = "Show Images";
                }
            }
        }

        // ─── Search ───────────────────────────────────────────────────────────────────

        private void AddToCart(ProductModel product, double qty, double discount)
        {
            Cart.Add(new CartItem
            {
                ProductId = product.id,
                Name = product.name,
                Price = product.price,
                Quantity = qty,
                Discount = discount,
                ItemType = product.item_type
            });
            RefreshCart();
        }

        private void RefreshCart()
        {
            bool hasItems = Cart.Count > 0;
            EmptyCartPanel.Visibility = hasItems ? Visibility.Collapsed : Visibility.Visible;
            CartItemsControl.Visibility = hasItems ? Visibility.Visible : Visibility.Collapsed;

            CartItemsControl.ItemsSource = null;
            CartItemsControl.ItemsSource = Cart.Select(c => new PosCartItemViewModel(c)).ToList();

            UpdateTotals();
        }

        private void UpdateTotals()
        {
            // Guard against calls during XAML initialization before elements exist
            if (SubtotalText == null || GrandTotalText == null) return;

            double subtotal = Cart.Sum(c => c.LineTotal);

            if (_isDiscountPercentage)
            {
                _discount = subtotal * (_discountValue / 100.0);
            }
            else
            {
                _discount = _discountValue;
            }

            if (DiscountLabel != null)
            {
                if (_discountValue > 0)
                {
                    DiscountLabel.Text = _isDiscountPercentage
                        ? $"DISCOUNT ({_discountValue:0.##}%): -LKR {_discount:N2} (F8)"
                        : $"DISCOUNT: -LKR {_discountValue:N2} (F8)";
                    DiscountLabel.Foreground = (Brush)FindResource("AccentWarning");
                }
                else
                {
                    DiscountLabel.Text = "APPLY DISCOUNT (F8)";
                    DiscountLabel.Foreground = (Brush)FindResource("TextMuted");
                }
            }

            double currentBase = Math.Max(0, subtotal - _discount);
            double totalTax = 0;

            foreach (var tax in _activeTaxes)
            {
                if (tax.apply_on == "base")
                {
                    tax.CalculatedAmount = currentBase * (tax.rate_percent / 100);
                }
                else if (tax.apply_on == "base_plus_previous")
                {
                    tax.CalculatedAmount = (currentBase + totalTax) * (tax.rate_percent / 100);
                }
                totalTax += tax.CalculatedAmount;
            }

            double grand = currentBase + totalTax;
            SubtotalText.Text = $"LKR {subtotal:N2}";
            GrandTotalText.Text = $"LKR {grand:N2}";

            TaxesItemsControl.ItemsSource = null;
            TaxesItemsControl.ItemsSource = _activeTaxes;
        }

        private void ApplyDiscount_Click(object sender, MouseButtonEventArgs e)
        {
            ShowBillDiscountDialog();
        }

        private void ShowBillDiscountDialog()
        {
            var dialog = new BillDiscountDialog(_discountValue, _isDiscountPercentage);
            var mainWindow = Application.Current.MainWindow;

            if (mainWindow != null)
            {
                dialog.Owner = mainWindow;
                mainWindow.Effect = new BlurEffect { Radius = 10 };
            }

            if (dialog.ShowDialog() == true)
            {
                _discountValue = dialog.DiscountValue;
                _isDiscountPercentage = dialog.IsPercentage;
                UpdateTotals();
            }

            if (mainWindow != null)
            {
                mainWindow.Effect = null;
            }
        }

        private void Page_PreviewKeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.F8)
            {
                ShowBillDiscountDialog();
                e.Handled = true;
            }
            else if (e.Key == Key.F7)
            {
                HoldPrint_Click(this, new RoutedEventArgs());
                e.Handled = true;
            }
            else if (e.Key == Key.F9)
            {
                Checkout_Click(this, new RoutedEventArgs());
                e.Handled = true;
            }
            else if (e.Key == Key.F8)
            {
                RecallOrder_Click(this, new RoutedEventArgs());
                e.Handled = true;
            }
        }

        private void IncreaseQty_Click(object sender, MouseButtonEventArgs e)
        {
            if ((sender as FrameworkElement)?.Tag is PosCartItemViewModel vm)
            {
                double unitDiscount = vm.Source.Quantity > 0 ? vm.Source.Discount / vm.Source.Quantity : 0;
                vm.Source.Quantity++;
                vm.Source.Discount = unitDiscount * vm.Source.Quantity;
                RefreshCart();
            }
        }
        private void DecreaseQty_Click(object sender, MouseButtonEventArgs e)
        {
            if ((sender as FrameworkElement)?.Tag is PosCartItemViewModel vm)
            {
                if (vm.Source.Quantity > 1)
                {
                    double unitDiscount = vm.Source.Quantity > 0 ? vm.Source.Discount / vm.Source.Quantity : 0;
                    vm.Source.Quantity--;
                    vm.Source.Discount = unitDiscount * vm.Source.Quantity;
                }
                else
                {
                    Cart.Remove(vm.Source);
                }
                RefreshCart();
            }
        }
        private void RemoveItem_Click(object sender, MouseButtonEventArgs e)
        {
            if ((sender as FrameworkElement)?.Tag is PosCartItemViewModel vm) { Cart.Remove(vm.Source); RefreshCart(); }
        }

        public class KotPreviewWindow : Window
        {
            private readonly StackPanel _kotPanel;
            private readonly int _heldOrderId;
            private readonly string _printerName;
            private readonly ApiService _api;

            public KotPreviewWindow(StackPanel kotPanel, int heldOrderId, string printerName, ApiService api)
            {
                _kotPanel = kotPanel;
                _heldOrderId = heldOrderId;
                _printerName = printerName;
                _api = api;

                Title = $"KOT Preview — Order #{heldOrderId}";
                Width = 380;
                Height = 680;
                WindowStartupLocation = WindowStartupLocation.CenterOwner;
                WindowStyle = WindowStyle.ThreeDBorderWindow;
                Background = new SolidColorBrush(Color.FromRgb(240, 240, 245));

                var root = new Grid();
                root.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
                root.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });

                var scroll = new ScrollViewer { Padding = new Thickness(10), VerticalScrollBarVisibility = ScrollBarVisibility.Auto };
                var card = new Border { Background = Brushes.White, Child = _kotPanel, Effect = new System.Windows.Media.Effects.DropShadowEffect { Color = Colors.Black, Opacity = 0.18, BlurRadius = 8, ShadowDepth = 2 }, HorizontalAlignment = HorizontalAlignment.Center };
                scroll.Content = card;
                Grid.SetRow(scroll, 0);
                root.Children.Add(scroll);

                var btnBar = new Border { Background = Brushes.White, BorderBrush = new SolidColorBrush(Color.FromRgb(220, 220, 220)), BorderThickness = new Thickness(0, 1, 0, 0), Padding = new Thickness(12, 8, 12, 8) };
                var btnStack = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Right };
                
                var printBtn = new Button { Content = "Print (F9)", Width = 120, Height = 36, Margin = new Thickness(0, 0, 10, 0), FontSize = 13, FontWeight = FontWeights.Bold, Foreground = Brushes.White, Background = new SolidColorBrush(Color.FromRgb(0, 122, 255)), BorderThickness = new Thickness(0), Cursor = System.Windows.Input.Cursors.Hand };
                printBtn.Click += (s, e) => ExecutePrint();
                var closeBtn = new Button { Content = "Close (Esc)", Width = 100, Height = 36, FontSize = 13, Background = new SolidColorBrush(Color.FromRgb(245, 245, 245)), BorderBrush = new SolidColorBrush(Color.FromRgb(200, 200, 200)), Cursor = System.Windows.Input.Cursors.Hand };
                closeBtn.Click += (s, e) => Close();

                btnStack.Children.Add(printBtn);
                btnStack.Children.Add(closeBtn);
                btnBar.Child = btnStack;
                Grid.SetRow(btnBar, 1);
                root.Children.Add(btnBar);

                Content = root;

                PreviewKeyDown += (s, e) =>
                {
                    if (e.Key == System.Windows.Input.Key.Escape) { Close(); e.Handled = true; }
                    else if (e.Key == System.Windows.Input.Key.F9 || e.Key == System.Windows.Input.Key.Enter)
                    { ExecutePrint(); e.Handled = true; }
                };

                Loaded += (s, e) => ExecutePrint();
            }

            private async void ExecutePrint()
            {
                try
                {
                    var dlg = new PrintDialog();
                    dlg.PrintQueue = new System.Printing.LocalPrintServer().GetPrintQueue(_printerName);
                    
                    double printWidth = dlg.PrintableAreaWidth > 10 ? dlg.PrintableAreaWidth : 226;
                    _kotPanel.Measure(new Size(printWidth, double.PositiveInfinity));
                    _kotPanel.Arrange(new Rect(new Size(printWidth, _kotPanel.DesiredSize.Height)));
                    _kotPanel.UpdateLayout();

                    dlg.PrintVisual(_kotPanel, $"KOT #{_heldOrderId}");

                    await _api.MarkKotPrintedAsync(_heldOrderId);
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"KOT Print failed: {ex.Message}", "Print Error", MessageBoxButton.OK, MessageBoxImage.Warning);
                }
            }
        }

        public static async System.Threading.Tasks.Task PrintKotAsync(int heldOrderId, bool full = false)
        {
            var savedKotPrinter = SettingsService.Current.KotPrinterName;
            if (string.IsNullOrEmpty(savedKotPrinter) || savedKotPrinter == "None") return;

            var api = new ApiService();
            var kotRes = await api.FetchKotDetailsAsync(heldOrderId, full);
            if (kotRes != null && kotRes.success && kotRes.data != null && kotRes.data.items != null && kotRes.data.items.Count > 0)
            {
                var root = new StackPanel { Background = Brushes.White, Margin = new Thickness(10) };
                
                root.Children.Add(new TextBlock { Text = "** KITCHEN TICKET **", FontSize = 18, FontWeight = FontWeights.Bold, HorizontalAlignment = HorizontalAlignment.Center, Margin = new Thickness(0,0,0,10), FontFamily = new System.Windows.Media.FontFamily("Consolas") });
                root.Children.Add(new TextBlock { Text = $"Order ID: #{kotRes.data.id}", FontSize = 14, FontWeight = FontWeights.Bold, FontFamily = new System.Windows.Media.FontFamily("Consolas") });
                root.Children.Add(new TextBlock { Text = $"Type: {kotRes.data.order_type}", FontSize = 14, FontFamily = new System.Windows.Media.FontFamily("Consolas") });
                if (kotRes.data.table_id > 0) root.Children.Add(new TextBlock { Text = $"Table: {kotRes.data.table_id}", FontSize = 14, FontFamily = new System.Windows.Media.FontFamily("Consolas") });
                root.Children.Add(new TextBlock { Text = $"Time: {DateTime.Now:yyyy-MM-dd HH:mm:ss}", FontSize = 12, Margin = new Thickness(0,0,0,10), FontFamily = new System.Windows.Media.FontFamily("Consolas") });

                root.Children.Add(new Border { BorderBrush = Brushes.Black, BorderThickness = new Thickness(0,1,0,0), Margin = new Thickness(0,5,0,5) });

                foreach (var item in kotRes.data.items)
                {
                    var itemRow = new Grid { Margin = new Thickness(0, 2, 0, 2) };
                    itemRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Auto) });
                    itemRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

                    var qty = new TextBlock { Text = $"{item.quantity}x ", FontWeight = FontWeights.Bold, FontSize = 16, Margin = new Thickness(0,0,8,0), FontFamily = new System.Windows.Media.FontFamily("Consolas") };
                    var name = new TextBlock { Text = item.description, FontSize = 16, TextWrapping = TextWrapping.Wrap, FontFamily = new System.Windows.Media.FontFamily("Consolas") };

                    Grid.SetColumn(qty, 0);
                    Grid.SetColumn(name, 1);
                    itemRow.Children.Add(qty);
                    itemRow.Children.Add(name);

                    root.Children.Add(itemRow);
                }

                root.Children.Add(new Border { BorderBrush = Brushes.Black, BorderThickness = new Thickness(0,1,0,0), Margin = new Thickness(0,10,0,5) });
                root.Children.Add(new TextBlock { Text = "END OF TICKET", HorizontalAlignment = HorizontalAlignment.Center, FontSize = 12, Margin = new Thickness(0,5,0,20), FontFamily = new System.Windows.Media.FontFamily("Consolas") });

                var previewWnd = new KotPreviewWindow(root, heldOrderId, savedKotPrinter, api);
                var mainWindow = Application.Current.MainWindow;
                if (mainWindow != null)
                {
                    previewWnd.Owner = mainWindow;
                }
                previewWnd.ShowDialog();
            }
        }

        private async void HoldPrint_Click(object sender, RoutedEventArgs e)
        {
            if (Cart.Count == 0) { MessageBox.Show("Cart is empty.", "No Items", MessageBoxButton.OK, MessageBoxImage.Warning); return; }

            var payload = new
            {
                held_order_id = GlobalState.Instance.HeldOrderId,
                location_id = GlobalState.Instance.CurrentUser?.location_id ?? 1,
                customer_id = GlobalState.Instance.SelectedCustomer?.id ?? 1,
                order_type = GlobalState.Instance.OrderType,
                table_id = GlobalState.Instance.SelectedTableId,
                steward_id = GlobalState.Instance.SelectedStewardId,
                notes = "POS Hold Order",
                subtotal = Cart.Sum(c => c.Price * c.Quantity),
                tax_total = 0.0,
                discount_total = Cart.Sum(c => c.Discount),
                grand_total = Cart.Sum(c => c.LineTotal),
                items = Cart.Select(c => new
                {
                    description = c.Name,
                    item_type = c.ItemType ?? "Part",
                    item_id = c.ProductId.ToString(),
                    quantity = c.Quantity,
                    unit_price = c.UnitPrice.ToString("F2"),
                    discount = c.Discount / (c.Quantity > 0 ? c.Quantity : 1),
                    tax_amount = 0.0,
                    line_total = c.LineTotal
                }).ToList(),
                payments = new object[] { }
            };

            var res = await _api.HoldOrderAsync(payload);
            if (res != null && res.success)
            {
                if (res.data != null && res.data.id > 0)
                {
                    await PrintKotAsync(res.data.id);
                }

                MessageBox.Show("Order successfully held.", "Held", MessageBoxButton.OK, MessageBoxImage.Information);
                GlobalState.Instance.ClearCart();
                _discount = 0;
                _discountValue = 0;
                ApplySessionInfo();
                RefreshCart();
            }
            else
            {
                MessageBox.Show($"Failed to hold order: {res?.message ?? "Unknown error"}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void RecallOrder_Click(object sender, RoutedEventArgs e)
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
                // UI update
                ApplySessionInfo();
                RefreshCart();
            }

            if (mainWindow != null)
            {
                mainWindow.Effect = null;
            }
        }

        private void Checkout_Click(object sender, RoutedEventArgs e)
        {
            if (Cart.Count == 0) { MessageBox.Show("Cart is empty.", "No Items", MessageBoxButton.OK, MessageBoxImage.Warning); return; }
            double subtotal = Cart.Sum(c => c.LineTotal);
            double grand = Math.Max(0, subtotal - _discount);

            var dialog = new CheckoutDialog(grand, _discount);
            var mainWindow = Application.Current.MainWindow;

            if (mainWindow != null)
            {
                dialog.Owner = mainWindow;
                mainWindow.Effect = new System.Windows.Media.Effects.BlurEffect { Radius = 10 };
            }

            bool completed = dialog.ShowDialog() == true;

            if (mainWindow != null)
            {
                mainWindow.Effect = null;
            }

            if (completed)
            {
                try
                {
                    if (NavigationService != null)
                        NavigationService.Navigate(new DashboardPage());
                    else if (mainWindow is MainWindow mw)
                        mw.NavigateTo(new DashboardPage());
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"Navigation error: {ex.Message}");
                }
            }
        }


        private void SelectCustomer_Click(object sender, MouseButtonEventArgs e)
        {
            var dialog = new CustomerSelectionDialog();
            var mainWindow = Application.Current.MainWindow;

            if (mainWindow != null)
            {
                dialog.Owner = mainWindow;
                mainWindow.Effect = new System.Windows.Media.Effects.BlurEffect { Radius = 10 };
            }

            if (dialog.ShowDialog() == true && dialog.SelectedCustomer != null)
            {
                GlobalState.Instance.SelectedCustomer = dialog.SelectedCustomer;
                ApplySessionInfo();
            }

            if (mainWindow != null) mainWindow.Effect = null;
        }

        private void BackToDashboard_Click(object sender, MouseButtonEventArgs e)
        {
            NavigationService.Navigate(new DashboardPage());
        }
    }

    public class PosCartItemViewModel
    {
        public CartItem Source { get; }
        public PosCartItemViewModel(CartItem s) => Source = s;
        public string? Name => Source.Name;
        public string PriceDisplay => $"@ LKR {Source.Price:N2}";
        public string QuantityDisplay => Source.Quantity.ToString("0.##");
        public string LineTotalDisplay => $"LKR {Source.LineTotal:N2}";
        public string DiscountDisplay => Source.Discount > 0 ? $"Discount: -LKR {Source.Discount:N2}" : "";
        public Visibility DiscountVisibility => Source.Discount > 0 ? Visibility.Visible : Visibility.Collapsed;
    }
}


