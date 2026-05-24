import 'package:flutter/material.dart';
import 'package:screenshot/screenshot.dart';
import 'package:image/image.dart' as img;
import 'dart:typed_data';
import '../services/printer_service.dart';

class KOTReceiptDialog extends StatefulWidget {
  final Map<String, dynamic> orderData;
  const KOTReceiptDialog({super.key, required this.orderData});

  @override
  State<KOTReceiptDialog> createState() => _KOTReceiptDialogState();
}

class _KOTReceiptDialogState extends State<KOTReceiptDialog> {
  bool isPrinting = false;
  final ScreenshotController screenshotController = ScreenshotController();

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
                    child: KOTReceiptView(orderData: widget.orderData),
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
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: isPrinting 
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Icon(Icons.print, color: Colors.white),
                      label: const Text('Print KOT Receipt', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: isPrinting ? null : () async {
                        setState(() => isPrinting = true);
                        try {
                          final widgetToCapture = Container(
                            width: 384,
                            color: Colors.white,
                            child: KOTReceiptView(orderData: widget.orderData),
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
                          
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('KOT Printed Successfully!')));
                        } catch (e) {
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Printer Error: $e')));
                        }
                        if (mounted) setState(() => isPrinting = false);
                      },
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

class KOTReceiptView extends StatelessWidget {
  final Map<String, dynamic> orderData;

  const KOTReceiptView({super.key, required this.orderData});

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
          Text(label, style: TextStyle(fontSize: fontSize, fontWeight: isBold ? FontWeight.bold : FontWeight.normal, color: Colors.black)),
          Text(value, style: TextStyle(fontSize: fontSize, fontWeight: isBold ? FontWeight.bold : FontWeight.normal, color: Colors.black)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final items = orderData['items'] as List<dynamic>;
    
    return Padding(
      padding: const EdgeInsets.all(0.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('KITCHEN ORDER TICKET', textAlign: TextAlign.center, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.black)),
          const SizedBox(height: 8),
          _buildDivider(),
          _buildRow('KOT#', orderData['id'].toString(), isBold: true),
          _buildRow('Date', DateTime.now().toString().substring(0, 16)),
          if (orderData['customer'] != null && orderData['customer'].toString() != 'Walk-in Customer')
            _buildRow('Customer', orderData['customer'].toString()),
          _buildDivider(isDashed: true),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text('ITEM', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
              Text('QTY', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black)),
            ],
          ),
          const SizedBox(height: 8),
          
          ...items.map((item) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(item['name'].toString(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black)),
                  ),
                  const SizedBox(width: 16),
                  Text(item['quantity'].toString(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black)),
                ],
              ),
            );
          }),
          
          _buildDivider(isDashed: true),
          const SizedBox(height: 16),
          const Text('* * * * * * * * *', textAlign: TextAlign.center, style: TextStyle(letterSpacing: 4, color: Colors.black54)),
        ],
      ),
    );
  }
}
