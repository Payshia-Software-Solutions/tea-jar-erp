using DesktopPOS.Models;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace DesktopPOS.Pages
{
    public partial class LocationSelectionDialog : Window
    {
        public LocationInfo? SelectedLocation { get; private set; }

        public LocationSelectionDialog(List<LocationInfo> locations)
        {
            InitializeComponent();
            LocationsList.ItemsSource = locations;
        }

        private void Location_Click(object sender, MouseButtonEventArgs e)
        {
            if (sender is Border border && border.Tag is LocationInfo location)
            {
                SelectedLocation = location;
                DialogResult = true;
                Close();
            }
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }
    }
}
