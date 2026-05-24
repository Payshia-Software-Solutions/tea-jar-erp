import 'package:flutter/material.dart';
import 'package:screenshot/screenshot.dart';
import 'package:image/image.dart' as img;
import 'dart:typed_data';
import '../services/printer_service.dart';

class GuestReceiptDialog extends StatefulWidget {
  final Map<String, dynamic> orderData;
  const GuestReceiptDialog({super.key, required this.orderData});

  @override
  State<GuestReceiptDialog> createState() => _GuestReceiptDialogState();
}

class _GuestReceiptDialogState extends State<GuestReceiptDialog> {
  bool isPrinting = false;
  bool isTaxInclusive = false;
  final ScreenshotController screenshotController = ScreenshotController();

  Widget _buildDivider({bool isDashed = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: isDashed 
        ? LayoutBuilder(
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
                    child: DecoratedBox(decoration: BoxDecoration(color: Colors.black)),
                  );
                }),
              );
            },
          )
        : Container(height: 1.5, color: Colors.black),
    );
  }

  String _formatCurrency(dynamic amount) {
    double val = double.tryParse(amount?.toString() ?? '0') ?? 0.0;
    String str = val.toStringAsFixed(2);
    str = str.replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
    return 'LKR $str';
  }

  Widget _buildRow(String label, String value, {bool isBold = false, double fontSize = 12}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: fontSize, fontWeight: isBold ? FontWeight.bold : FontWeight.normal, color: Colors.black)),
          Text(value, style: TextStyle(fontSize: fontSize, fontWeight: isBold ? FontWeight.bold : FontWeight.normal, color: Colors.black)),
        ],
      ),
    );
  }

  Widget _buildReceiptView() {
    final items = widget.orderData['items'] as List<dynamic>? ?? [];
    double grandTotal = double.tryParse(widget.orderData['grandTotal']?.toString() ?? '0') ?? 0.0;
    final taxes = widget.orderData['taxes'] as List<dynamic>? ?? widget.orderData['applied_taxes'] as List<dynamic>? ?? [];
    
    double totalTaxAmount = 0.0;
    for (var t in taxes) {
      totalTaxAmount += double.tryParse(t['amount']?.toString() ?? '0') ?? 0.0;
    }

    return Container(
      padding: const EdgeInsets.all(0.0),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('KDU Group', textAlign: TextAlign.center, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.black)),
          const SizedBox(height: 4),
          const Text('Nebulync Restaurant', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Colors.black87)),
          const Text('Tel: 0770481363', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Colors.black87)),
          const Text('Rathnapura Rd, Lellopitiya', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Colors.black87)),
          const SizedBox(height: 8),
          const Text('*** PROFORMA / GUEST RECEIPT ***', textAlign: TextAlign.center, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black)),
          _buildDivider(),
          _buildRow('Bill#', widget.orderData['id'].toString().replaceAll('BILL-', ''), isBold: true),
          _buildRow('Date', DateTime.now().toString().substring(0, 16)),
          _buildRow('Customer', widget.orderData['customer'].toString()),
          _buildDivider(isDashed: true),
          const Text('ITEMS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
          const SizedBox(height: 8),
          
          ...items.map((item) {
            double price = double.tryParse(item['price']?.toString() ?? '0') ?? 0.0;
            double qty = double.tryParse(item['quantity']?.toString() ?? '1') ?? 1.0;
            double subtotal = double.tryParse(item['subtotal']?.toString() ?? '0') ?? (price * qty);

            if (isTaxInclusive && grandTotal > 0 && totalTaxAmount > 0) {
              double ratio = subtotal / grandTotal;
              double itemTax = totalTaxAmount * ratio;
              price += (itemTax / qty);
              subtotal += itemTax;
            }

            return Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item['name'].toString(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('${qty.toStringAsFixed(0)} × @ ${_formatCurrency(price)}', style: const TextStyle(fontSize: 12, color: Colors.black87)),
                      Text(_formatCurrency(subtotal), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
                    ],
                  ),
                ],
              ),
            );
          }),
          
          _buildDivider(isDashed: true),
          if (!isTaxInclusive && taxes.isNotEmpty) ...[
            _buildRow('Subtotal', _formatCurrency(grandTotal)),
            ...taxes.map((t) {
              double tAmt = double.tryParse(t['amount']?.toString() ?? '0') ?? 0.0;
              return _buildRow(t['tax_name']?.toString() ?? t['name']?.toString() ?? 'Tax', _formatCurrency(tAmt));
            }),
            _buildDivider(),
          ],
          _buildRow('TOTAL', _formatCurrency(grandTotal + (isTaxInclusive ? 0 : totalTaxAmount)), isBold: true, fontSize: 18),
          const SizedBox(height: 8),
          const Text('This is not a final tax invoice.', textAlign: TextAlign.center, style: TextStyle(fontSize: 10, color: Colors.black54)),
          const SizedBox(height: 8),
          const Text('BizFlow ERP System', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
          const Text('Developed by Nebulync.com', textAlign: TextAlign.center, style: TextStyle(fontSize: 10, color: Colors.black54)),
          const SizedBox(height: 16),
          const Text('* * * * * * * * *', textAlign: TextAlign.center, style: TextStyle(letterSpacing: 4, color: Colors.black54)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
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
                    child: _buildReceiptView(),
                  ),
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      const Text('Preview Tax Inclusive', style: TextStyle(fontWeight: FontWeight.bold)),
                      const Spacer(),
                      Switch(
                        value: isTaxInclusive,
                        onChanged: (val) {
                          setState(() {
                            isTaxInclusive = val;
                          });
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.all(16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: isPrinting ? null : () async {
                      setState(() => isPrinting = true);
                      try {
                        final widgetToCapture = Container(
                          width: 384,
                          color: Colors.white,
                          child: _buildReceiptView(),
                        );
                        final imageBytes = await screenshotController.captureFromWidget(
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
                        
                        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Guest Receipt printed.')));
                      } catch (e) {
                        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Printer Error: $e')));
                      }
                      if (mounted) setState(() => isPrinting = false);
                    },
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.print),
                        const SizedBox(width: 8),
                        Text(isTaxInclusive ? 'PRINT TAX INCLUSIVE' : 'PRINT STANDARD RECEIPT', style: const TextStyle(fontWeight: FontWeight.bold)),
                        if (isPrinting) const Padding(padding: EdgeInsets.only(left: 12), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey[300],
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Close', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
