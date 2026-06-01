using DesktopPOS.Services;
using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;

namespace DesktopPOS.Pages
{
    public partial class TableSelectionDialog : Window
    {
        private readonly ApiService _api = new();
        private readonly List<(int TableId, string Name)> _displayedTables = new();

        public TableSelectionDialog()
        {
            InitializeComponent();
            Loaded += async (s, e) => await LoadTables();
            this.PreviewKeyDown += TableSelectionDialog_PreviewKeyDown;
        }

        private void TableSelectionDialog_PreviewKeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Escape)
            {
                this.DialogResult = false;
                e.Handled = true;
                return;
            }

            if (e.Key == Key.D0 || e.Key == Key.NumPad0)
            {
                SkipTable();
                e.Handled = true;
                return;
            }

            int index = -1;
            if (e.Key >= Key.D1 && e.Key <= Key.D9)
            {
                index = e.Key - Key.D1;
            }
            else if (e.Key >= Key.NumPad1 && e.Key <= Key.NumPad9)
            {
                index = e.Key - Key.NumPad1;
            }

            if (index >= 0 && index < _displayedTables.Count)
            {
                SelectTable(_displayedTables[index].TableId, _displayedTables[index].Name);
                e.Handled = true;
            }
        }

        private async System.Threading.Tasks.Task LoadTables()
        {
            LoadingText.Visibility = Visibility.Visible;

            var tables = await _api.FetchTablesAsync(1);

            LoadingText.Visibility = Visibility.Collapsed;
            TablesPanel.Children.Clear();
            _displayedTables.Clear();

            int hotkeyIndex = 1;
            foreach (var table in tables)
            {
                string tableName = table.name ?? $"Table {table.id}";
                var card = BuildTableCard(tableName, table.id, hotkeyIndex <= 9 ? hotkeyIndex.ToString() : null);
                TablesPanel.Children.Add(card);

                if (hotkeyIndex <= 9)
                {
                    _displayedTables.Add((table.id, tableName));
                    hotkeyIndex++;
                }
            }

            if (tables.Count == 0)
                LoadingText.Text = "No tables found for this location.";
        }

        private Border BuildTableCard(string name, int tableId, string? hotkey)
        {
            var inner = new Grid { Margin = new Thickness(8) };
            inner.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // Icon & Hotkey
            inner.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) }); // Name

            var icon = new TextBlock
            {
                Text = "⊞",
                Foreground = (SolidColorBrush)Application.Current.TryFindResource("AccentSuccess"),
                FontSize = 22,
                HorizontalAlignment = HorizontalAlignment.Center
            };
            Grid.SetRow(icon, 0);
            inner.Children.Add(icon);

            if (hotkey != null)
            {
                var badgeText = new TextBlock
                {
                    Text = hotkey,
                    Foreground = (SolidColorBrush)Application.Current.TryFindResource("TextSecondary"),
                    FontSize = 10,
                    FontWeight = FontWeights.Bold,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center
                };
                var badgeBorder = new Border
                {
                    Background = (SolidColorBrush)Application.Current.TryFindResource("BgInput"),
                    BorderBrush = (SolidColorBrush)Application.Current.TryFindResource("BorderPrimary"),
                    BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(5),
                    Padding = new Thickness(5, 2, 5, 2),
                    HorizontalAlignment = HorizontalAlignment.Right,
                    VerticalAlignment = VerticalAlignment.Top,
                    Child = badgeText
                };
                Grid.SetRow(badgeBorder, 0);
                inner.Children.Add(badgeBorder);
            }

            var label = new TextBlock
            {
                Text = name,
                Foreground = (SolidColorBrush)Application.Current.TryFindResource("TextPrimary"),
                FontSize = 12,
                FontWeight = FontWeights.SemiBold,
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center,
                Margin = new Thickness(0, 6, 0, 0),
                TextWrapping = TextWrapping.Wrap,
                TextAlignment = TextAlignment.Center
            };
            Grid.SetRow(label, 1);
            inner.Children.Add(label);

            var card = new Border
            {
                Width = 110,
                Height = 100,
                Background = (SolidColorBrush)Application.Current.TryFindResource("BgCardElevated"),
                BorderBrush = (SolidColorBrush)Application.Current.TryFindResource("BorderPrimary"),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(14),
                Margin = new Thickness(0, 0, 12, 12),
                Cursor = Cursors.Hand,
                Child = inner
            };

            card.MouseLeftButtonUp += (s, e) =>
            {
                SelectTable(tableId, name);
            };

            return card;
        }

        private void SelectTable(int tableId, string name)
        {
            GlobalState.Instance.SelectedTableId = tableId;
            GlobalState.Instance.SelectedTableName = name;
            this.DialogResult = true;
        }

        private void SkipTable()
        {
            GlobalState.Instance.SelectedTableId = null;
            GlobalState.Instance.SelectedTableName = null;
            this.DialogResult = true;
        }

        private void SkipTable_Click(object sender, MouseButtonEventArgs e)
        {
            SkipTable();
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            this.DialogResult = false;
        }
    }
}
