using System;
using System.Collections.Generic;
using System.Linq;
using System.Printing;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace DesktopPOS.Services
{
    public static class PrintService
    {
        public static void PrintZReport(DayLedgerSummary summary)
        {
            try
            {
                var dlg = new PrintDialog();
                dlg.PrintQueue = LocalPrintServer.GetDefaultPrintQueue();
                double w = dlg.PrintableAreaWidth > 10 ? dlg.PrintableAreaWidth : 280;
                
                var root = new StackPanel { Background = Brushes.White, Width = w, Margin = new Thickness(10) };

                // Header
                root.Children.Add(MakeTB("Z-REPORT (DAY END)", 16, FontWeights.Bold, TextAlignment.Center, new Thickness(0,0,0,10)));
                root.Children.Add(MakeTB($"Date: {DateTime.Now:yyyy-MM-dd HH:mm}", 12, FontWeights.Normal, TextAlignment.Center, new Thickness(0,0,0,10)));
                root.Children.Add(DashedLine(w));

                // Summary
                root.Children.Add(MakeTB("SALES SUMMARY", 14, FontWeights.Bold, TextAlignment.Center, new Thickness(0,5,0,5)));
                root.Children.Add(LRRow("Gross Sales", $"LKR {summary.sales:N2}", w));
                root.Children.Add(LRRow("Returns", $"LKR {summary.returns:N2}", w));
                root.Children.Add(LRRow("Refunds", $"LKR {summary.refunds:N2}", w));
                root.Children.Add(DashedLine(w));
                root.Children.Add(LRRow("NET SALES", $"LKR {summary.net:N2}", w, rightBold: true));
                root.Children.Add(DashedLine(w));

                // Methods
                root.Children.Add(MakeTB("PAYMENT METHODS", 14, FontWeights.Bold, TextAlignment.Center, new Thickness(0,5,0,5)));
                if (summary.methods != null)
                {
                    foreach (var kvp in summary.methods)
                    {
                        root.Children.Add(LRRow(kvp.Key, $"LKR {kvp.Value:N2}", w));
                    }
                }
                root.Children.Add(DashedLine(w));
                root.Children.Add(MakeTB("END OF REPORT", 12, FontWeights.Bold, TextAlignment.Center, new Thickness(0,10,0,0)));

                root.Measure(new Size(w, double.PositiveInfinity));
                root.Arrange(new Rect(new Size(w, root.DesiredSize.Height)));
                root.UpdateLayout();

                dlg.PrintVisual(root, "Z-Report");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Print failed: {ex.Message}", "Print Error", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        public static StackPanel BuildReceiptPanel(string locationName, dynamic invoiceData, List<CartItem> items, double grandTotal, double paidAmount, double balance, double previewWidth = 280, bool isReprint = false, bool? isTaxInclusiveOverride = null)
        {
            double w = previewWidth - 24; // usable width (padding 12 each side)

            var root = new StackPanel
            {
                Background = Brushes.White,
                Width      = previewWidth,
                Orientation = Orientation.Vertical
            };

            var inner = new StackPanel { Margin = new Thickness(12, 10, 12, 10) };
            root.Children.Add(inner);

            // ── Header ──────────────────────────────────────────────────────────────────
            inner.Children.Add(MakeTB("KDU Group", 15, FontWeights.Bold, TextAlignment.Center, new Thickness(0,0,0,2)));
            inner.Children.Add(MakeTB(locationName, 10, FontWeights.Normal, TextAlignment.Center, new Thickness(0,0,0,1), new SolidColorBrush(Color.FromRgb(220, 120, 0))));
            
            var phone = GlobalState.Instance.LocationPhone ?? "";
            var addr  = GlobalState.Instance.LocationAddress ?? "";
            if (!string.IsNullOrEmpty(phone))
                inner.Children.Add(MakeTB($"Tel: {phone}", 10, FontWeights.Normal, TextAlignment.Center, new Thickness(0,0,0,1), new SolidColorBrush(Color.FromRgb(220, 120, 0))));
            if (!string.IsNullOrEmpty(addr))
                inner.Children.Add(MakeTB(addr, 10, FontWeights.Normal, TextAlignment.Center, new Thickness(0,0,0,4), new SolidColorBrush(Color.FromRgb(220, 120, 0))));

            // ── Solid line ──────────────────────────────────────────────────────────────
            inner.Children.Add(SolidLine(w));

            if (isReprint)
            {
                inner.Children.Add(MakeTB("*** INVOICE REPRINT ***", 12, FontWeights.Bold, TextAlignment.Center, new Thickness(0,2,0,4)));
            }

            // ── Meta rows ───────────────────────────────────────────────────────────────
            inner.Children.Add(LRRow("Invoice#", invoiceData.invoice_no, w, rightBold:true));
            inner.Children.Add(LRRow("Date", DateTime.Now.ToString("dd/MM/yyyy, hh:mm tt"), w));
            string custName = invoiceData.customer_name ?? "Walk-in Customer";
            inner.Children.Add(LRRow("Customer", custName, w));
            inner.Children.Add(LRRow("Order Type", "Retail", w));

            // ── Dashed line ─────────────────────────────────────────────────────────────
            inner.Children.Add(DashedLine(w));

            // ── Items ───────────────────────────────────────────────────────────────────
            inner.Children.Add(MakeTB("ITEMS", 10, FontWeights.Bold, TextAlignment.Left, new Thickness(0,4,0,4)));

            bool isTaxInc = isTaxInclusiveOverride ?? SettingsService.Current.IsTaxInclusive;
            double totalTaxPercent = 0;
            try
            {
                var taxesList = invoiceData?.applied_taxes;
                if (taxesList != null)
                {
                    foreach (dynamic tax in taxesList)
                    {
                        totalTaxPercent += (double)tax.rate_percent;
                    }
                }
            }
            catch {}

            double subtotal = 0;
            foreach (var item in items)
            {
                bool isFree    = item.Discount >= item.Price && item.Price > 0;
                double displayPrice = item.Price;
                double displayLineTotal = item.Quantity * item.Price;
                
                if (isTaxInc && totalTaxPercent > 0)
                {
                    displayPrice = displayPrice * (1 + totalTaxPercent / 100);
                    displayLineTotal = displayLineTotal * (1 + totalTaxPercent / 100);
                }
                
                double lineTot = isFree ? 0.0 : displayLineTotal;
                subtotal += lineTot;

                // Item name (bold)
                inner.Children.Add(MakeTB(item.Name ?? "Item", 11, FontWeights.Bold, TextAlignment.Left, new Thickness(0,3,0,1)));

                // Qty × @ price  |  lineTotal
                string qtyLabel = $"{item.Quantity:0.##} x @ LKR {displayPrice:N2}";
                string totLabel = isFree ? "LKR 0.00" : $"LKR {lineTot:N2}";
                inner.Children.Add(LRRow(qtyLabel, totLabel, w, leftSize:10, rightSize:10, rightBold:false));
            }

            // ── Dashed line ─────────────────────────────────────────────────────────────
            inner.Children.Add(DashedLine(w));

            // ── Subtotal / Discount / Taxes ─────────────────────────────────────────────
            if (isTaxInc)
            {
                double discount = subtotal - grandTotal;
                if (discount > 0 && grandTotal < subtotal)
                {
                    inner.Children.Add(LRRow("Savings / Discount", $"-LKR {discount:N2}", w));
                }
                
                double taxTotal = 0;
                try
                {
                    var taxesList = invoiceData?.applied_taxes;
                    if (taxesList != null)
                    {
                        foreach (dynamic tax in taxesList)
                        {
                            taxTotal += (double)tax.amount;
                        }
                    }
                    else if (grandTotal > subtotal - discount)
                    {
                        taxTotal = grandTotal - (subtotal - discount);
                    }
                }
                catch 
                {
                    if (grandTotal > subtotal - discount)
                    {
                        taxTotal = grandTotal - (subtotal - discount);
                    }
                }
                
                inner.Children.Add(LRRow("Total (Tax Inclusive)", $"LKR {grandTotal:N2}", w));
                inner.Children.Add(LRRow("Includes Total Taxes:", $"LKR {taxTotal:N2}", w, leftSize:9, rightSize:9));
            }
            else
            {
                inner.Children.Add(LRRow("Subtotal", $"LKR {subtotal:N2}", w));
                
                double discount = subtotal - grandTotal;
                if (discount > 0 && grandTotal < subtotal)
                {
                    inner.Children.Add(LRRow("Discount", $"-LKR {discount:N2}", w));
                }

                // Let's add standard tax rows if it doesn't match subtotal (reverse engineering SSCL and VAT from the difference)
                if (grandTotal > subtotal && Math.Abs(grandTotal - subtotal - discount) > 0.01)
                {
                    // This means there is tax added. We'll show standard SSCL and VAT based on a 2.5% and 18% calculation if applicable, or just show a general tax.
                    // For simplicity, let's just show SSCL and VAT lines dynamically.
                    double sscl = subtotal * 0.025;
                    double vat = (subtotal + sscl) * 0.18;
                    
                    // If the sum is very close to grand total, display them explicitly!
                    if (Math.Abs(grandTotal - (subtotal + sscl + vat)) < 1.0)
                    {
                        inner.Children.Add(LRRow("SSCL (2.50%)", $"LKR {sscl:N2}", w));
                        inner.Children.Add(LRRow("VAT (18.00%)", $"LKR {vat:N2}", w));
                    }
                    else
                    {
                        inner.Children.Add(LRRow("Taxes", $"LKR {(grandTotal - subtotal + discount):N2}", w));
                    }
                }
            }

            // ── Solid line ──────────────────────────────────────────────────────────────
            inner.Children.Add(SolidLine(w));

            // ── TOTAL ───────────────────────────────────────────────────────────────────
            inner.Children.Add(LRRow("TOTAL", $"LKR {grandTotal:N2}", w, leftBold:true, rightBold:true, leftSize:15, rightSize:15));

            // ── Payment Details ─────────────────────────────────────────────────────────
            inner.Children.Add(MakeTB("PAYMENT DETAILS", 9, FontWeights.Bold, TextAlignment.Left, new Thickness(0,6,0,3)));
            
            // Hardcode Cash since we don't know the exact payment method for a past invoice unless stored
            inner.Children.Add(LRRow("Cash", $"LKR {paidAmount:N2}", w));

            // ── Dashed line ─────────────────────────────────────────────────────────────
            inner.Children.Add(DashedLine(w));

            // ── Total Paid ──────────────────────────────────────────────────────────────
            inner.Children.Add(LRRow("Total Paid", $"LKR {paidAmount:N2}", w, rightBold:true));

            // ── Change / PAID badge ─────────────────────────────────────────────────────
            double bal = paidAmount - grandTotal;
            if (bal < 0) bal = 0;

            if (bal >= 0.01)
            {
                inner.Children.Add(LRRow("Balance Due", $"LKR {bal:N2}", w, leftBold:true, rightBold:true));
            }
            else
            {
                var badge = new Border
                {
                    BorderBrush     = Brushes.Black,
                    BorderThickness = new Thickness(1.5),
                    HorizontalAlignment = HorizontalAlignment.Center,
                    Padding = new Thickness(16, 3, 16, 3),
                    Margin  = new Thickness(0, 6, 0, 4)
                };
                badge.Child = MakeTB("\u2713 PAID", 13, FontWeights.Bold, TextAlignment.Center, new Thickness(0));
                inner.Children.Add(badge);
            }

            // ── Dashed line ─────────────────────────────────────────────────────────────
            inner.Children.Add(DashedLine(w));

            // ── Footer ──────────────────────────────────────────────────────────────────
            inner.Children.Add(MakeTB("Thank you for your purchase!", 10, FontWeights.Bold, TextAlignment.Center, new Thickness(0,4,0,2), new SolidColorBrush(Color.FromRgb(220, 120, 0))));
            inner.Children.Add(MakeTB("BizFlow ERP System", 11, FontWeights.Bold, TextAlignment.Center, new Thickness(0,0,0,1)));
            inner.Children.Add(MakeTB("Developed by Nebulync.com", 8, FontWeights.Normal, TextAlignment.Center, new Thickness(0,0,0,4), new SolidColorBrush(Color.FromRgb(100, 100, 100))));

            return root;
        }

        public static void PrintReceipt(string locationName, dynamic invoiceData, List<CartItem> items, double grandTotal, double paidAmount, double balance, bool isReprint = false, bool? isTaxInclusiveOverride = null)
        {
            try
            {
                var dlg = new PrintDialog();
                dlg.PrintQueue = LocalPrintServer.GetDefaultPrintQueue();
                double w = dlg.PrintableAreaWidth > 10 ? dlg.PrintableAreaWidth : 280;
                
                var root = BuildReceiptPanel(locationName, invoiceData, items, grandTotal, paidAmount, balance, w, isReprint, isTaxInclusiveOverride);

                root.Measure(new Size(w, double.PositiveInfinity));
                root.Arrange(new Rect(new Size(w, root.DesiredSize.Height)));
                root.UpdateLayout();

                dlg.PrintVisual(root, $"Receipt {invoiceData.invoice_no}");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Print failed: {ex.Message}", "Print Error", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        public static void ShowReceiptPreview(string title, StackPanel receiptPanel, Action printAction, Window owner)
        {
            var win = new Window
            {
                Owner = owner,
                Title = title,
                Width = 380,
                Height = 680,
                MinWidth = 380,
                MinHeight = 400,
                WindowStartupLocation = WindowStartupLocation.CenterOwner,
                WindowStyle = WindowStyle.ThreeDBorderWindow,
                ResizeMode = ResizeMode.CanResize,
                Background = new SolidColorBrush(Color.FromRgb(240, 240, 245))
            };

            var root = new Grid();
            root.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
            root.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });

            var scroll = new ScrollViewer
            {
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
                Background = new SolidColorBrush(Color.FromRgb(200, 200, 210)),
                Padding = new Thickness(10)
            };

            var card = new Border
            {
                Background = Brushes.White,
                BorderBrush = new SolidColorBrush(Color.FromRgb(200, 200, 200)),
                BorderThickness = new Thickness(1),
                HorizontalAlignment = HorizontalAlignment.Center,
                Effect = new System.Windows.Media.Effects.DropShadowEffect
                {
                    Color = Colors.Black,
                    Opacity = 0.18,
                    BlurRadius = 8,
                    ShadowDepth = 2
                },
                Child = receiptPanel
            };

            scroll.Content = card;
            Grid.SetRow(scroll, 0);
            root.Children.Add(scroll);

            var btnBar = new Border
            {
                Background = Brushes.White,
                BorderBrush = new SolidColorBrush(Color.FromRgb(220, 220, 220)),
                BorderThickness = new Thickness(0, 1, 0, 0),
                Padding = new Thickness(12, 8, 12, 8)
            };

            var btnStack = new StackPanel
            {
                Orientation = Orientation.Horizontal,
                HorizontalAlignment = HorizontalAlignment.Right
            };

            var printBtn = new Button
            {
                Content = "  \uD83D\uDDB6  Print  (F9)",
                Width = 120,
                Height = 36,
                Margin = new Thickness(0, 0, 10, 0),
                FontSize = 13,
                FontWeight = FontWeights.Bold,
                Foreground = Brushes.White,
                Background = new SolidColorBrush(Color.FromRgb(0, 122, 255)),
                BorderThickness = new Thickness(0),
                Cursor = System.Windows.Input.Cursors.Hand
            };
            printBtn.Click += (s, e) => { printAction?.Invoke(); win.Close(); };

            var closeBtn = new Button
            {
                Content = "Close  (Esc)",
                Width = 100,
                Height = 36,
                FontSize = 13,
                Background = new SolidColorBrush(Color.FromRgb(240, 240, 240)),
                Foreground = Brushes.Black,
                BorderBrush = new SolidColorBrush(Color.FromRgb(200, 200, 200)),
                BorderThickness = new Thickness(1),
                Cursor = System.Windows.Input.Cursors.Hand
            };
            closeBtn.Click += (s, e) => win.Close();

            btnStack.Children.Add(printBtn);
            btnStack.Children.Add(closeBtn);
            btnBar.Child = btnStack;

            Grid.SetRow(btnBar, 1);
            root.Children.Add(btnBar);

            win.Content = root;

            win.PreviewKeyDown += (s, e) =>
            {
                if (e.Key == System.Windows.Input.Key.Escape) { win.Close(); e.Handled = true; }
                else if (e.Key == System.Windows.Input.Key.F9 || e.Key == System.Windows.Input.Key.Enter)
                {
                    printAction?.Invoke();
                    win.Close();
                    e.Handled = true;
                }
            };

            win.ShowDialog();
        }

        private static TextBlock MakeTB(string txt, double size, FontWeight wt, TextAlignment align, Thickness margin, SolidColorBrush? fg = null)
        {
            return new TextBlock
            {
                Text = txt,
                FontSize = size,
                FontWeight = wt,
                TextAlignment = align,
                Margin = margin,
                Foreground = fg ?? Brushes.Black,
                FontFamily = new FontFamily("Consolas")
            };
        }

        private static Grid LRRow(string left, string right, double w, int leftSize=12, int rightSize=12, bool rightBold=false, bool leftBold=false)
        {
            var g = new Grid { Margin = new Thickness(0,2,0,2), Width = w - 20 };
            g.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            g.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Auto) });

            var tL = MakeTB(left, leftSize, leftBold ? FontWeights.Bold : FontWeights.Normal, TextAlignment.Left, new Thickness(0));
            var tR = MakeTB(right, rightSize, rightBold ? FontWeights.Bold : FontWeights.Normal, TextAlignment.Right, new Thickness(0));

            Grid.SetColumn(tL, 0);
            Grid.SetColumn(tR, 1);
            g.Children.Add(tL);
            g.Children.Add(tR);
            return g;
        }

        private static UIElement DashedLine(double w)
        {
            var line = new System.Windows.Shapes.Line
            {
                Stroke = Brushes.Black,
                StrokeThickness = 1,
                StrokeDashArray = new DoubleCollection { 2, 2 },
                X1 = 0,
                X2 = w - 20,
                Y1 = 0,
                Y2 = 0,
                Margin = new Thickness(0, 5, 0, 5)
            };
            return line;
        }

        private static UIElement SolidLine(double w)
        {
            return new System.Windows.Shapes.Line
            {
                Stroke = Brushes.Black,
                StrokeThickness = 1,
                X1 = 0, X2 = w - 20,
                Y1 = 0, Y2 = 0,
                Margin = new Thickness(0, 5, 0, 5)
            };
        }

        public static StackPanel BuildReturnReceiptPanel(string locationName, string returnNo, string invoiceNo, string customerName, List<ReturnInvoiceItem> items, double totalAmount, string reason, double previewWidth = 280)
        {
            double w = previewWidth - 24; // usable width (padding 12 each side)

            var root = new StackPanel
            {
                Background = Brushes.White,
                Width      = previewWidth,
                Orientation = Orientation.Vertical
            };

            var inner = new StackPanel { Margin = new Thickness(12, 10, 12, 10) };
            root.Children.Add(inner);

            // ── Header ──────────────────────────────────────────────────────────────────
            inner.Children.Add(MakeTB("KDU Group", 15, FontWeights.Bold, TextAlignment.Center, new Thickness(0,0,0,2)));
            inner.Children.Add(MakeTB(locationName, 10, FontWeights.Normal, TextAlignment.Center, new Thickness(0,0,0,1), new SolidColorBrush(Color.FromRgb(220, 120, 0))));
            
            var phone = GlobalState.Instance.LocationPhone ?? "";
            var addr  = GlobalState.Instance.LocationAddress ?? "";
            if (!string.IsNullOrEmpty(phone))
                inner.Children.Add(MakeTB($"Tel: {phone}", 10, FontWeights.Normal, TextAlignment.Center, new Thickness(0,0,0,1), new SolidColorBrush(Color.FromRgb(220, 120, 0))));
            if (!string.IsNullOrEmpty(addr))
                inner.Children.Add(MakeTB(addr, 10, FontWeights.Normal, TextAlignment.Center, new Thickness(0,0,0,4), new SolidColorBrush(Color.FromRgb(220, 120, 0))));

            // ── Solid line ──────────────────────────────────────────────────────────────
            inner.Children.Add(SolidLine(w));

            inner.Children.Add(MakeTB("SALES RETURN NOTE", 13, FontWeights.Bold, TextAlignment.Center, new Thickness(0,2,0,4)));

            // ── Solid line ──────────────────────────────────────────────────────────────
            inner.Children.Add(SolidLine(w));

            // ── Meta rows ───────────────────────────────────────────────────────────────
            inner.Children.Add(LRRow("Return#", returnNo, w, rightBold:true));
            inner.Children.Add(LRRow("Date", DateTime.Now.ToString("dd/MM/yyyy, hh:mm tt"), w));
            inner.Children.Add(LRRow("Invoice#", invoiceNo, w));
            if (!string.IsNullOrEmpty(customerName))
                inner.Children.Add(LRRow("Customer", customerName, w));

            // ── Dashed line ─────────────────────────────────────────────────────────────
            inner.Children.Add(DashedLine(w));

            // ── Items ───────────────────────────────────────────────────────────────────
            inner.Children.Add(MakeTB("RETURNED ITEMS", 10, FontWeights.Bold, TextAlignment.Left, new Thickness(0,4,0,4)));

            foreach (var item in items)
            {
                // Item name (bold)
                inner.Children.Add(MakeTB(item.description ?? "Item", 11, FontWeights.Bold, TextAlignment.Left, new Thickness(0,3,0,1)));

                // Qty Unit(s)  |  lineTotal
                string qtyLabel = $"{Math.Floor(item.return_qty)} Unit(s)";
                string totLabel = $"LKR {item.refund_amount:N2}";
                inner.Children.Add(LRRow(qtyLabel, totLabel, w, leftSize:10, rightSize:10, rightBold:true));
            }

            // ── Solid line ──────────────────────────────────────────────────────────────
            inner.Children.Add(SolidLine(w));

            // ── TOTAL ───────────────────────────────────────────────────────────────────
            inner.Children.Add(LRRow("RETURN TOTAL", $"LKR {totalAmount:N2}", w, leftBold:true, rightBold:true, leftSize:14, rightSize:14));

            if (!string.IsNullOrEmpty(reason))
            {
                inner.Children.Add(new TextBlock
                {
                    Margin = new Thickness(0, 8, 0, 0),
                    FontSize = 10,
                    TextWrapping = TextWrapping.Wrap,
                    FontFamily = new FontFamily("Consolas"),
                    Inlines = {
                        new System.Windows.Documents.Run("Reason: ") { FontWeight = FontWeights.Bold },
                        new System.Windows.Documents.Run(reason)
                    }
                });
            }

            // ── Dashed line ─────────────────────────────────────────────────────────────
            inner.Children.Add(DashedLine(w));

            // ── Footer ──────────────────────────────────────────────────────────────────
            inner.Children.Add(MakeTB("Thank you!", 10, FontWeights.Bold, TextAlignment.Center, new Thickness(0,4,0,2), new SolidColorBrush(Color.FromRgb(220, 120, 0))));
            inner.Children.Add(MakeTB("* * * * * * * * * *", 9, FontWeights.Normal, TextAlignment.Center, new Thickness(0,0,0,4), new SolidColorBrush(Color.FromRgb(100, 100, 100))));

            return root;
        }

        public static void PrintReturnReceipt(string locationName, string returnNo, string invoiceNo, string customerName, List<ReturnInvoiceItem> items, double totalAmount, string reason)
        {
            try
            {
                var dlg = new PrintDialog();
                dlg.PrintQueue = LocalPrintServer.GetDefaultPrintQueue();
                double w = dlg.PrintableAreaWidth > 10 ? dlg.PrintableAreaWidth : 280;
                
                var root = BuildReturnReceiptPanel(locationName, returnNo, invoiceNo, customerName, items, totalAmount, reason, w);

                root.Measure(new Size(w, double.PositiveInfinity));
                root.Arrange(new Rect(new Size(w, root.DesiredSize.Height)));
                root.UpdateLayout();

                dlg.PrintVisual(root, $"Return {returnNo}");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Print failed: {ex.Message}", "Print Error", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }

        public static StackPanel BuildRefundReceiptPanel(string locationName, string refundNo, string returnNo, string invoiceNo, string customerName, double amount, string paymentMethod, string referenceNo, double previewWidth = 280)
        {
            double w = previewWidth - 24; // usable width (padding 12 each side)

            var root = new StackPanel
            {
                Background = Brushes.White,
                Width      = previewWidth,
                Orientation = Orientation.Vertical
            };

            var inner = new StackPanel { Margin = new Thickness(12, 10, 12, 10) };
            root.Children.Add(inner);

            // ── Header ──────────────────────────────────────────────────────────────────
            inner.Children.Add(MakeTB("KDU Group", 15, FontWeights.Bold, TextAlignment.Center, new Thickness(0,0,0,2)));
            inner.Children.Add(MakeTB(locationName, 10, FontWeights.Normal, TextAlignment.Center, new Thickness(0,0,0,1), new SolidColorBrush(Color.FromRgb(220, 120, 0))));
            
            var phone = GlobalState.Instance.LocationPhone ?? "";
            var addr  = GlobalState.Instance.LocationAddress ?? "";
            if (!string.IsNullOrEmpty(phone))
                inner.Children.Add(MakeTB($"Tel: {phone}", 10, FontWeights.Normal, TextAlignment.Center, new Thickness(0,0,0,1), new SolidColorBrush(Color.FromRgb(220, 120, 0))));
            if (!string.IsNullOrEmpty(addr))
                inner.Children.Add(MakeTB(addr, 10, FontWeights.Normal, TextAlignment.Center, new Thickness(0,0,0,4), new SolidColorBrush(Color.FromRgb(220, 120, 0))));

            // ── Solid line ──────────────────────────────────────────────────────────────
            inner.Children.Add(SolidLine(w));

            inner.Children.Add(MakeTB("REFUND RECEIPT", 13, FontWeights.Bold, TextAlignment.Center, new Thickness(0,2,0,4)));

            // ── Solid line ──────────────────────────────────────────────────────────────
            inner.Children.Add(SolidLine(w));

            // ── Meta rows ───────────────────────────────────────────────────────────────
            if (!string.IsNullOrEmpty(refundNo))
                inner.Children.Add(LRRow("Refund#", refundNo, w, rightBold:true));
            inner.Children.Add(LRRow("Date", DateTime.Now.ToString("dd/MM/yyyy"), w));
            inner.Children.Add(LRRow("Invoice#", invoiceNo, w));
            if (!string.IsNullOrEmpty(returnNo))
                inner.Children.Add(LRRow("Return#", returnNo, w, rightBold:true));
            if (!string.IsNullOrEmpty(customerName))
                inner.Children.Add(LRRow("Customer", customerName, w));

            // ── Dashed line ─────────────────────────────────────────────────────────────
            inner.Children.Add(DashedLine(w));

            // ── Refund Details ──────────────────────────────────────────────────────────
            inner.Children.Add(LRRow("Refund Method", paymentMethod, w, rightBold:true));
            if (!string.IsNullOrEmpty(referenceNo))
                inner.Children.Add(LRRow("Reference", referenceNo, w));

            // ── Solid line ──────────────────────────────────────────────────────────────
            inner.Children.Add(SolidLine(w));

            // ── TOTAL ───────────────────────────────────────────────────────────────────
            inner.Children.Add(LRRow("REFUNDED AMOUNT", $"LKR {amount:N2}", w, leftBold:true, rightBold:true, leftSize:13, rightSize:13));

            // ── Dashed line ─────────────────────────────────────────────────────────────
            inner.Children.Add(DashedLine(w));

            // ── Footer ──────────────────────────────────────────────────────────────────
            inner.Children.Add(MakeTB("Transaction Finalized", 10, FontWeights.Bold, TextAlignment.Center, new Thickness(0,4,0,2)));
            inner.Children.Add(MakeTB("Thank you!", 10, FontWeights.Normal, TextAlignment.Center, new Thickness(0,0,0,2)));
            inner.Children.Add(MakeTB("* * * * * * * * * *", 9, FontWeights.Normal, TextAlignment.Center, new Thickness(0,0,0,4), new SolidColorBrush(Color.FromRgb(100, 100, 100))));

            return root;
        }

        public static void PrintRefundReceipt(string locationName, string refundNo, string returnNo, string invoiceNo, string customerName, double amount, string paymentMethod, string referenceNo)
        {
            try
            {
                var dlg = new PrintDialog();
                dlg.PrintQueue = LocalPrintServer.GetDefaultPrintQueue();
                double w = dlg.PrintableAreaWidth > 10 ? dlg.PrintableAreaWidth : 280;
                
                var root = BuildRefundReceiptPanel(locationName, refundNo, returnNo, invoiceNo, customerName, amount, paymentMethod, referenceNo, w);

                root.Measure(new Size(w, double.PositiveInfinity));
                root.Arrange(new Rect(new Size(w, root.DesiredSize.Height)));
                root.UpdateLayout();

                dlg.PrintVisual(root, $"Refund {refundNo}");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Print failed: {ex.Message}", "Print Error", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
        }
    }
}
