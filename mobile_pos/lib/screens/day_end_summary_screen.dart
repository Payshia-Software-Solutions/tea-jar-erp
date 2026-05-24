import 'package:flutter/material.dart';
import 'package:screenshot/screenshot.dart';
import 'package:image/image.dart' as img;
import 'dart:typed_data';
import '../services/api_service.dart';
import '../services/printer_service.dart';

class DayEndSummaryScreen extends StatefulWidget {
  const DayEndSummaryScreen({super.key});

  @override
  State<DayEndSummaryScreen> createState() => _DayEndSummaryScreenState();
}

class _DayEndSummaryScreenState extends State<DayEndSummaryScreen> {
  final ApiService _apiService = ApiService();
  final ScreenshotController _screenshotController = ScreenshotController();
  
  Map<String, dynamic>? _summaryData;
  bool _isLoading = true;
  bool _isPrinting = false;
  String _errorMessage = '';
  String? _activeLocationId;

  @override
  void initState() {
    super.initState();
    _loadSummary();
  }

  Future<void> _loadSummary() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });
    try {
      final loc = await _apiService.getActiveLocation();
      if (loc != null) {
        _activeLocationId = loc['id'].toString();
        // Use today's date formatted as YYYY-MM-DD
        final now = DateTime.now();
        final dateStr = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
        
        final data = await _apiService.fetchDayEndSummary(_activeLocationId!, dateStr);
        if (mounted) {
          setState(() {
            _summaryData = data;
            _isLoading = false;
          });
        }
      } else {
        throw Exception("No active location selected");
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString();
        });
      }
    }
  }

  Future<void> _printSummary() async {
    if (_summaryData == null) return;
    setState(() => _isPrinting = true);
    
    try {
      final widgetToCapture = Container(
        width: 384,
        color: Colors.white,
        child: DayEndReceiptView(data: _summaryData!),
      );
      
      final imageBytes = await _screenshotController.captureFromWidget(
        widgetToCapture, 
        delay: const Duration(milliseconds: 100),
        pixelRatio: 3.0,
      );
      
      img.Image? originalImg = img.decodeImage(imageBytes);
      if (originalImg != null) {
        img.Image resizedImg = img.copyResize(
          originalImg, 
          width: 576, 
          interpolation: img.Interpolation.cubic,
        );
        final Uint8List resizedBytes = Uint8List.fromList(img.encodePng(resizedImg));
        await PrinterService().printImageBytes(resizedBytes);
      } else {
        await PrinterService().printImageBytes(imageBytes);
      }
      
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Day End Summary printed successfully!')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Printer Error: $e')));
    }
    
    if (mounted) setState(() => _isPrinting = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Day End Summary'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadSummary,
          )
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _errorMessage.isNotEmpty
          ? Center(child: Text(_errorMessage, style: const TextStyle(color: Colors.red)))
          : _summaryData == null
            ? const Center(child: Text('No data available'))
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Center(
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 400),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)],
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16), // Padding for UI preview only
                      child: DayEndReceiptView(data: _summaryData!),
                    ),
                  ),
                ),
              ),
      bottomNavigationBar: _summaryData != null ? Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), offset: const Offset(0, -4), blurRadius: 10)],
        ),
        child: ElevatedButton.icon(
          icon: _isPrinting 
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Icon(Icons.print, color: Colors.white),
          label: const Text('Print Day End Summary', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
          style: ElevatedButton.styleFrom(
            backgroundColor: Theme.of(context).primaryColor,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          onPressed: _isPrinting ? null : _printSummary,
        ),
      ) : null,
    );
  }
}

class DayEndReceiptView extends StatelessWidget {
  final Map<String, dynamic> data;

  const DayEndReceiptView({super.key, required this.data});

  Widget _buildDivider({bool isDashed = false}) {
    if (isDashed) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8.0),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final boxWidth = constraints.constrainWidth();
            const dashWidth = 4.0;
            const dashSpace = 4.0;
            final dashCount = (boxWidth / (dashWidth + dashSpace)).floor();
            return Flex(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              direction: Axis.horizontal,
              children: List.generate(dashCount, (_) {
                return const SizedBox(
                  width: dashWidth,
                  height: 1,
                  child: DecoratedBox(decoration: BoxDecoration(color: Colors.black54)),
                );
              }),
            );
          },
        ),
      );
    }
    return const Divider(color: Colors.black, thickness: 1.5, height: 16);
  }

  Widget _buildRow(String label, String value, {bool isBold = false, double fontSize = 12}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(child: Text(label, style: TextStyle(fontSize: fontSize, fontWeight: isBold ? FontWeight.bold : FontWeight.normal, color: Colors.black))),
          Text(value, style: TextStyle(fontSize: fontSize, fontWeight: isBold ? FontWeight.bold : FontWeight.normal, color: Colors.black)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final summary = data['summary'] as Map<String, dynamic>? ?? {};
    final payments = data['payments'] as List<dynamic>? ?? [];
    final returns = data['returns'] ?? 0;
    final itemsSold = data['items_sold'] as List<dynamic>? ?? [];
    final date = data['date'] ?? '';

    double totalSales = double.tryParse(summary['total_sales']?.toString() ?? '0') ?? 0.0;
    double totalReceived = double.tryParse(summary['total_received']?.toString() ?? '0') ?? 0.0;
    int invoiceCount = int.tryParse(summary['invoice_count']?.toString() ?? '0') ?? 0;
    double totalReturns = double.tryParse(returns.toString()) ?? 0.0;

    return Container(
      padding: const EdgeInsets.all(0),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('DAY END SUMMARY', textAlign: TextAlign.center, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.black)),
          const SizedBox(height: 8),
          Text('Date: $date', textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: Colors.black)),
          const SizedBox(height: 4),
          Text('Printed: ${DateTime.now().toString().substring(0, 16)}', textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: Colors.black)),
          _buildDivider(),
          
          _buildRow('Total Invoices', invoiceCount.toString(), isBold: true),
          _buildRow('Total Sales', 'LKR ${totalSales.toStringAsFixed(2)}', isBold: true, fontSize: 14),
          _buildRow('Total Received', 'LKR ${totalReceived.toStringAsFixed(2)}', isBold: true, fontSize: 14),
          if (totalReturns > 0)
            _buildRow('Total Returns', 'LKR ${totalReturns.toStringAsFixed(2)}', isBold: true, fontSize: 14),
          
          _buildDivider(isDashed: true),
          const Text('PAYMENTS BY METHOD', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
          const SizedBox(height: 4),
          ...payments.map((p) {
            double amount = double.tryParse(p['total']?.toString() ?? '0') ?? 0.0;
            return _buildRow(p['payment_method']?.toString() ?? 'Unknown', 'LKR ${amount.toStringAsFixed(2)}');
          }),
          
          _buildDivider(isDashed: true),
          const Text('ITEMS SOLD', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Expanded(flex: 3, child: Text('Item', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: Colors.black))),
              Expanded(flex: 1, child: Text('Qty', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: Colors.black))),
              Expanded(flex: 2, child: Text('Amount', textAlign: TextAlign.right, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: Colors.black))),
            ],
          ),
          const SizedBox(height: 4),
          ...itemsSold.map((item) {
            double qty = double.tryParse(item['quantity']?.toString() ?? '0') ?? 0.0;
            double amount = double.tryParse(item['total']?.toString() ?? '0') ?? 0.0;
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 2.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(flex: 3, child: Text(item['name']?.toString() ?? '', style: const TextStyle(fontSize: 10, color: Colors.black))),
                  Expanded(flex: 1, child: Text(qty.toString(), textAlign: TextAlign.center, style: const TextStyle(fontSize: 10, color: Colors.black))),
                  Expanded(flex: 2, child: Text(amount.toStringAsFixed(2), textAlign: TextAlign.right, style: const TextStyle(fontSize: 10, color: Colors.black))),
                ],
              ),
            );
          }),

          const SizedBox(height: 16),
          const Text('BizFlow ERP System', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
          const Text('Developed by Nebulync.com', textAlign: TextAlign.center, style: TextStyle(fontSize: 10, color: Colors.black54)),
          const SizedBox(height: 16),
          const Text('* * * * * * * * *', textAlign: TextAlign.center, style: TextStyle(letterSpacing: 4, color: Colors.black54)),
        ],
      ),
    );
  }
}
