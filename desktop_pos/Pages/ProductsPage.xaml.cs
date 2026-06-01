using DesktopPOS.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Effects;

namespace DesktopPOS.Pages
{
    public partial class ProductsPage : Page
    {
        private readonly ApiService _api = new();
        private List<ProductModel> _allProducts = new();
        private List<CartItem> Cart => GlobalState.Instance.CartItems;

        public ProductsPage()
        {
            InitializeComponent();
            Loaded += async (s, e) =>
            {
                var customer = GlobalState.Instance.SelectedCustomer;
                CustomerNameText.Text = customer?.name ?? "Walk-in Customer";
                await LoadProducts();
                UpdateCartFooter();
            };
        }

        private async System.Threading.Tasks.Task LoadProducts()
        {
            LoadingPanel.Visibility = Visibility.Visible;
            ProductScrollViewer.Visibility = Visibility.Collapsed;

            try
            {
                var result = await _api.FetchProductsAsync();
                _allProducts = result ?? new List<ProductModel>();
                RenderProducts(_allProducts);
            }
            catch (Exception ex)
            {
                LoadingPanel.Visibility = Visibility.Collapsed;
                MessageBox.Show($"Failed to load products: {ex.Message}", "Connection Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void RenderProducts(List<ProductModel> products)
        {
            LoadingPanel.Visibility = Visibility.Collapsed;
            ProductScrollViewer.Visibility = Visibility.Visible;
            ProductsWrapPanel.Children.Clear();

            foreach (var product in products)
            {
                var card = BuildProductCard(product);
                ProductsWrapPanel.Children.Add(card);
            }
        }

        private Border BuildProductCard(ProductModel product)
        {
            bool isService = product.item_type?.ToLower() == "service";
            bool outOfStock = !isService && product.stock_level <= 0;

            var badgeColor = isService ? "#7C3AED" : "#1D4ED8";
            var badge = new Border
            {
                Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString(badgeColor)),
                CornerRadius = new CornerRadius(5),
                Padding = new Thickness(6, 2, 6, 2),
                Margin = new Thickness(0, 0, 0, 8),
                HorizontalAlignment = HorizontalAlignment.Left,
                Child = new TextBlock
                {
                    Text = (product.item_type ?? "PART").ToUpper(),
                    Foreground = Brushes.White,
                    FontSize = 9,
                    FontWeight = FontWeights.Bold
                }
            };

            var name = new TextBlock
            {
                Text = product.name,
                Foreground = Brushes.White,
                FontSize = 13,
                FontWeight = FontWeights.SemiBold,
                TextTrimming = TextTrimming.CharacterEllipsis,
                MaxHeight = 40,
                TextWrapping = TextWrapping.Wrap
            };

            var price = new TextBlock
            {
                Text = $"LKR {product.price:N2}",
                Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#10B981")),
                FontSize = 15,
                FontWeight = FontWeights.Bold,
                Margin = new Thickness(0, 6, 0, 0)
            };

            var stockText = isService ? "Service" : (outOfStock ? "Out of Stock" : $"Stock: {(int)product.stock_level}");
            var stockColor = outOfStock ? "#EF4444" : (isService ? "#A855F7" : "#38BDF8");
            var stock = new TextBlock
            {
                Text = stockText,
                Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString(stockColor)),
                FontSize = 11,
                Margin = new Thickness(0, 2, 0, 0)
            };

            var addBtn = new Border
            {
                Background = outOfStock
                    ? new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1E293B"))
                    : new SolidColorBrush((Color)ColorConverter.ConvertFromString("#6366F1")),
                CornerRadius = new CornerRadius(8),
                Padding = new Thickness(0, 8, 0, 8),
                Margin = new Thickness(0, 10, 0, 0),
                Child = new TextBlock
                {
                    Text = outOfStock ? "Out of Stock" : "+ Add to Cart",
                    Foreground = outOfStock ? Brushes.Gray : Brushes.White,
                    FontSize = 12,
                    FontWeight = FontWeights.SemiBold,
                    HorizontalAlignment = HorizontalAlignment.Center
                },
                Cursor = outOfStock ? System.Windows.Input.Cursors.No : System.Windows.Input.Cursors.Hand
            };

            if (!outOfStock)
            {
                addBtn.MouseLeftButtonUp += (s, e) => AddToCart(product);
            }

            var content = new StackPanel { Margin = new Thickness(14) };
            content.Children.Add(badge);
            content.Children.Add(name);
            content.Children.Add(price);
            content.Children.Add(stock);
            content.Children.Add(addBtn);

            var card = new Border
            {
                Width = 180,
                Margin = new Thickness(8),
                Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#121828")),
                BorderBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1E293B")),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(14),
                Child = content,
                Cursor = System.Windows.Input.Cursors.Hand,
                Effect = new DropShadowEffect
                {
                    Color = Colors.Black,
                    Opacity = 0.2,
                    BlurRadius = 12,
                    ShadowDepth = 4
                }
            };

            return card;
        }

        private void AddToCart(ProductModel product)
        {
            var existing = Cart.FirstOrDefault(c => c.ProductId == product.id);
            if (existing != null)
                existing.Quantity++;
            else
                Cart.Add(new CartItem
                {
                    ProductId = product.id,
                    Name = product.name,
                    Price = product.price,
                    Quantity = 1,
                    ItemType = product.item_type
                });

            UpdateCartFooter();
        }

        private void UpdateCartFooter()
        {
            CartCountText.Text = $"{Cart.Count} item{(Cart.Count != 1 ? "s" : "")}";
            CartTotalText.Text = $"Total: LKR {Cart.Sum(c => c.LineTotal):N2}";
        }

        private void SearchBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            var q = SearchBox.Text.ToLower();
            var filtered = _allProducts.Where(p => p.name?.ToLower().Contains(q) ?? false).ToList();
            RenderProducts(filtered);
        }

        private void ViewCart_Click(object sender, RoutedEventArgs e)
        {
            if (Cart.Count == 0)
            {
                MessageBox.Show("Your cart is empty. Please add at least one product.", "Cart Empty",
                    MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }
            NavigationService.Navigate(new CartPage());
        }

        private void Back_Click(object sender, RoutedEventArgs e) => NavigationService.GoBack();
    }
}

