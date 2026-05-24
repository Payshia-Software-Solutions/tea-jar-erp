import 'package:flutter/material.dart';
import 'package:screenshot/screenshot.dart';
import 'package:image/image.dart' as img;
import 'dart:typed_data';
import '../services/api_service.dart';
import '../services/printer_service.dart';
import 'checkout_payment_screen.dart';

class InvoicesScreen extends StatefulWidget {
  const InvoicesScreen({super.key});

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  List<dynamic> _invoices = [];
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _loadInvoices();
  }

  Future<void> _loadInvoices() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      // Get today's date formatted as YYYY-MM-DD
      final today = DateTime.now();
      final dateStr = "${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}";
      
      final invoices = await _apiService.fetchInvoices(date: dateStr);
      if (mounted) {
        setState(() {
          _invoices = invoices;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _viewInvoiceDetails(String id) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final details = await _apiService.fetchInvoiceDetails(id);
      if (!mounted) return;
      Navigator.pop(context); // Close loading dialog

      if (details != null) {
        // Map backend details to orderData format expected by ReceiptView
        final orderData = {
          'id': details['invoice_no']?.toString() ?? details['id']?.toString() ?? id,
          'customer': details['customer']?['name'] ?? 'Walk-in Customer',
          'total': double.tryParse(details['grand_total']?.toString() ?? '0')?.toStringAsFixed(2) ?? '0.00',
          'paymentMethod': details['payment_method'] ?? 'Cash',
          'amountTendered': double.tryParse(details['amount_tendered']?.toString() ?? '0') ?? 0.0,
          'grandTotal': double.tryParse(details['grand_total']?.toString() ?? '0') ?? 0.0,
          'subtotal': double.tryParse(details['subtotal']?.toString() ?? '0') ?? 0.0,
          'tax_total': double.tryParse(details['tax_total']?.toString() ?? '0') ?? 0.0,
          'taxes': (details['applied_taxes'] as List<dynamic>? ?? []).map((t) => {
            'tax_name': t['tax_name'] ?? t['name'] ?? 'Tax',
            'amount': double.tryParse(t['amount']?.toString() ?? '0') ?? 0.0,
          }).toList(),
          'items': (details['items'] as List<dynamic>? ?? []).map((i) => {
            'name': i['description'] ?? 'Unknown Item',
            'price': double.tryParse(i['unit_price']?.toString() ?? '0') ?? 0.0,
            'quantity': double.tryParse(i['quantity']?.toString() ?? '1') ?? 1.0,
            'discount': double.tryParse(i['discount']?.toString() ?? '0') ?? 0.0,
            'subtotal': double.tryParse(i['line_total']?.toString() ?? '0') ?? 0.0,
          }).toList(),
        };

        _showReceiptDialog(orderData);
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Close loading dialog
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
      }
    }
  }

  void _showReceiptDialog(Map<String, dynamic> orderData) {
    showDialog(
      context: context,
      builder: (ctx) {
        final screenshotController = ScreenshotController();
        return Dialog.fullscreen(
          backgroundColor: Colors.grey[200],
          child: SafeArea(
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Center(
                      child: Container(
                        constraints: const BoxConstraints(maxWidth: 400),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)],
                        ),
                        child: ReceiptView(orderData: orderData),
                      ),
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(16),
                  color: Colors.white,
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: () {
                            Navigator.pop(ctx);
                          },
                          child: const Text('Close', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blueAccent,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          icon: const Icon(Icons.print, color: Colors.white),
                          label: const Text('Reprint', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                          onPressed: () {
                            Navigator.pop(ctx);
                            _showPrintSelectionDialog(orderData);
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showPrintSelectionDialog(Map<String, dynamic> orderData) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        bool isPrinting = false;
        final screenshotController = ScreenshotController();

        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              backgroundColor: Theme.of(context).cardColor,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              contentPadding: isPrinting ? EdgeInsets.zero : const EdgeInsets.all(24),
              content: isPrinting 
              ? SizedBox(
                  width: 300,
                  height: 350,
                  child: PrintingAnimation(orderData: orderData),
                )
              : Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.print, color: Colors.blueAccent, size: 60),
                    const SizedBox(height: 16),
                    Text('REPRINT INVOICE', style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color, fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text(
                      'Select your preferred receipt format to print.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color),
                    ),
                    const SizedBox(height: 24),
                    
                    // Standard Receipt
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.all(16),
                        side: BorderSide(color: Theme.of(context).primaryColor),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: isPrinting ? null : () async {
                        setState(() => isPrinting = true);
                        try {
                          final widgetToCapture = Container(
                            width: 384, // Logical width for text wrapping
                            color: Colors.white,
                            child: ReceiptView(orderData: orderData),
                          );
                          final imageBytes = await screenshotController.captureFromWidget(
                            widgetToCapture, 
                            delay: const Duration(milliseconds: 100),
                            pixelRatio: 3.0, // Capture at high resolution for clarity
                          );
                          
                          // Downscale high-res capture to EXACTLY 576 pixels for 80mm printer with cubic interpolation
                          img.Image? originalImg = img.decodeImage(imageBytes);
                          if (originalImg != null) {
                            img.Image resizedImg = img.copyResize(
                              originalImg, 
                              width: 576, 
                              interpolation: img.Interpolation.cubic, // Best for smooth text downscaling
                            );
                            final Uint8List resizedBytes = Uint8List.fromList(img.encodePng(resizedImg));
                            await PrinterService().printImageBytes(resizedBytes);
                          } else {
                            await PrinterService().printImageBytes(imageBytes);
                          }
                        } catch (e) {
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Print Error: $e')));
                        }
                        
                        await Future.delayed(const Duration(seconds: 2));
                        if (mounted) Navigator.pop(ctx); // Close dialog
                      },
                      child: Row(
                        children: [
                          Icon(Icons.print, color: Theme.of(context).primaryColor),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('STANDARD RECEIPT', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).textTheme.bodyLarge?.color)),
                                const Text('Item prices shown without tax.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                              ],
                            ),
                          ),
                          if (isPrinting) const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    // Tax Inclusive Receipt
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.all(16),
                        side: BorderSide(color: Theme.of(context).primaryColor),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: isPrinting ? null : () async {
                        setState(() => isPrinting = true);
                        try {
                          final widgetToCapture = Container(
                            width: 384,
                            color: Colors.white,
                            child: ReceiptView(orderData: orderData),
                          );
                          final imageBytes = await screenshotController.captureFromWidget(
                            widgetToCapture, 
                            delay: const Duration(milliseconds: 100),
                            pixelRatio: 3.0, // Capture at high resolution for clarity
                          );
                          
                          // Downscale high-res capture to EXACTLY 576 pixels for 80mm printer with cubic interpolation
                          img.Image? originalImg = img.decodeImage(imageBytes);
                          if (originalImg != null) {
                            img.Image resizedImg = img.copyResize(
                              originalImg, 
                              width: 576, 
                              interpolation: img.Interpolation.cubic, // Best for smooth text downscaling
                            );
                            final Uint8List resizedBytes = Uint8List.fromList(img.encodePng(resizedImg));
                            await PrinterService().printImageBytes(resizedBytes);
                          } else {
                            await PrinterService().printImageBytes(imageBytes);
                          }
                        } catch (e) {
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Print Error: $e')));
                        }
                        
                        await Future.delayed(const Duration(seconds: 2));
                        if (mounted) Navigator.pop(ctx); // Close dialog
                      },
                      child: Row(
                        children: [
                          Icon(Icons.receipt_long, color: Theme.of(context).primaryColor),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('TAX INCLUSIVE RECEIPT', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).textTheme.bodyLarge?.color)),
                                const Text('Prices include applicable taxes.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                              ],
                            ),
                          ),
                          if (isPrinting) const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    TextButton(
                      onPressed: isPrinting ? null : () => Navigator.pop(ctx),
                      child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                    )
                  ],
                ),
            );
          }
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Today's Invoices", style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadInvoices),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _errorMessage.isNotEmpty
          ? Center(child: Text(_errorMessage, style: const TextStyle(color: Colors.red)))
          : _invoices.isEmpty
            ? const Center(child: Text('No invoices found for today.'))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _invoices.length,
                itemBuilder: (context, index) {
                  final inv = _invoices[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () => _viewInvoiceDetails(inv['id'].toString()),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              backgroundColor: Colors.blueAccent.withOpacity(0.1),
                              child: const Icon(Icons.receipt, color: Colors.blueAccent),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${inv['invoice_no'] ?? 'Invoice #${inv['id']}'}',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    inv['customer']?['name'] ?? 'Walk-in Customer',
                                    style: TextStyle(color: Colors.grey[700], fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  'LKR ${double.tryParse(inv['grand_total']?.toString() ?? '0')?.toStringAsFixed(2)}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.blueAccent),
                                ),
                                const SizedBox(height: 4),
                                const Icon(Icons.chevron_right, color: Colors.grey, size: 20),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
    );
  }
}
