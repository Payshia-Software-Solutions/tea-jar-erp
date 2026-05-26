import 'dart:typed_data';
import 'package:blue_thermal_printer/blue_thermal_printer.dart';

class PrinterService {
  // Singleton instance
  static final PrinterService _instance = PrinterService._internal();
  factory PrinterService() => _instance;
  PrinterService._internal();

  final BlueThermalPrinter _bluetooth = BlueThermalPrinter.instance;
  BluetoothDevice? _selectedDevice;

  Future<List<BluetoothDevice>> getDevices() async {
    try {
      return await _bluetooth.getBondedDevices();
    } catch (e) {
      return [];
    }
  }

  void selectDevice(BluetoothDevice device) {
    _selectedDevice = device;
  }

  Future<bool> connect() async {
    if (_selectedDevice == null) return false;
    
    bool? isConnected = await _bluetooth.isConnected;
    if (isConnected == true) return true;

    try {
      await _bluetooth.connect(_selectedDevice!);
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<void> disconnect() async {
    await _bluetooth.disconnect();
  }

  Future<void> printReceipt(Map<String, dynamic> orderData, {bool isTaxInclusive = false}) async {
    bool? isConnected = await _bluetooth.isConnected;
    if (isConnected != true) {
      await connect();
    }
    
    if (await _bluetooth.isConnected == true) {
      _bluetooth.printNewLine();
      _bluetooth.printCustom("KDU Group", 4, 1);
      _bluetooth.printCustom("Nebulync Restaurant", 2, 1);
      _bluetooth.printCustom("Tel: 0770481363", 2, 1);
      _bluetooth.printCustom("Rathnapura Rd, Lellopitiya", 2, 1);
      
      _bluetooth.printNewLine();
      if (orderData['isReprint'] == true) {
        _bluetooth.printCustom("INVOICE REPRINT", 3, 1);
      } else {
        _bluetooth.printCustom("INVOICE", 3, 1);
      }

      _bluetooth.printNewLine();
      
      _bluetooth.printCustom("Invoice#: ${orderData['id'] ?? 'N/A'}", 2, 0);
      _bluetooth.printCustom("Date: ${DateTime.now().toString().substring(0, 16)}", 2, 0);
      _bluetooth.printCustom("Customer: ${orderData['customer'] ?? 'Walk-in'}", 2, 0);
      
      _bluetooth.printCustom("--------------------------------", 2, 1);
      
      final items = orderData['items'] as List<dynamic>? ?? [];
      final taxes = orderData['taxes'] as List<dynamic>? ?? orderData['applied_taxes'] as List<dynamic>? ?? [];
      double grandTotal = double.tryParse(orderData['grandTotal']?.toString() ?? '0') ?? 0.0;
      double totalTaxAmount = 0.0;
      for (var t in taxes) {
        totalTaxAmount += double.tryParse(t['amount']?.toString() ?? '0') ?? 0.0;
      }

      for (var item in items) {
        final name = item['name'].toString().padRight(15).substring(0, 15);
        double discount = double.tryParse(item['discount']?.toString() ?? '0') ?? 0.0;
        double lineTotal = double.tryParse(item['subtotal']?.toString() ?? '0') ?? 0.0;
        double qty = double.tryParse(item['quantity']?.toString() ?? '1') ?? 1.0;
        
        // Reconstruct base price before discount
        double price = (lineTotal + discount) / (qty > 0 ? qty : 1);

        if (isTaxInclusive && grandTotal > 0 && totalTaxAmount > 0) {
          double ratio = lineTotal / grandTotal;
          double itemTax = totalTaxAmount * ratio;
          price += (itemTax / qty);
        }

        final qtyStr = qty.toStringAsFixed(0).padLeft(3);
        final priceStr = price.toStringAsFixed(2).padLeft(6);
        _bluetooth.printCustom("$name x$qtyStr LKR $priceStr", 2, 0);
        
        if (discount > 0) {
          _bluetooth.printCustom("  Discount: -LKR ${discount.toStringAsFixed(2)}", 2, 0);
        }
      }
      
      _bluetooth.printCustom("--------------------------------", 2, 1);
      
      double subtotalOrder = double.tryParse(orderData['subtotal']?.toString() ?? '0') ?? (grandTotal - totalTaxAmount);
      double discountTotal = double.tryParse(orderData['discount_total']?.toString() ?? '0') ?? 0.0;
      String discountType = orderData['discount_type']?.toString() ?? 'fixed';
      String discountLabel = 'Discount ($discountType)';
      if (discountType == 'percentage' && orderData['discount_value'] != null) {
        discountLabel = 'Discount (${orderData['discount_value']}%)';
      }
      
      if (!isTaxInclusive) {
        _bluetooth.printCustom("Subtotal: LKR ${subtotalOrder.toStringAsFixed(2)}", 2, 0);
        if (discountTotal > 0) {
          _bluetooth.printCustom("$discountLabel: -LKR ${discountTotal.toStringAsFixed(2)}", 2, 0);
        }
        if (taxes.isNotEmpty) {
          for (var t in taxes) {
            double tAmt = double.tryParse(t['amount']?.toString() ?? '0') ?? 0.0;
            String tName = t['tax_name']?.toString() ?? t['name']?.toString() ?? 'Tax';
            String rateStr = t['rate_percent'] != null ? ' (${t['rate_percent']}%)' : '';
            _bluetooth.printCustom("$tName$rateStr: LKR ${tAmt.toStringAsFixed(2)}", 2, 0);
          }
        }
        _bluetooth.printCustom("--------------------------------", 2, 1);
      } else {
        _bluetooth.printCustom("Subtotal: LKR ${(subtotalOrder + totalTaxAmount).toStringAsFixed(2)}", 2, 0);
        if (discountTotal > 0) {
          _bluetooth.printCustom("$discountLabel: -LKR ${discountTotal.toStringAsFixed(2)}", 2, 0);
        }
        _bluetooth.printCustom("--------------------------------", 2, 1);
      }
      
      double finalTotal = grandTotal; // grandTotal already includes taxes from the backend/cart
      _bluetooth.printCustom("Total: LKR ${finalTotal.toStringAsFixed(2)}", 3, 1);
      if (isTaxInclusive) {
        _bluetooth.printCustom("(Prices include tax)", 2, 1);
      }
      _bluetooth.printNewLine();
      
      _bluetooth.printCustom("Thank you for your business!", 2, 1);
      _bluetooth.printNewLine();
      _bluetooth.printNewLine();
      _bluetooth.paperCut();
    }
  }

  Future<void> printGuestReceipt(Map<String, dynamic> orderData, {bool isTaxInclusive = false}) async {
    bool? isConnected = await _bluetooth.isConnected;
    if (isConnected != true) {
      await connect();
    }
    
    if (await _bluetooth.isConnected == true) {
      _bluetooth.printNewLine();
      _bluetooth.printCustom("KDU Group", 4, 1);
      _bluetooth.printCustom("Nebulync Restaurant", 2, 1);
      _bluetooth.printCustom("Tel: 0770481363", 2, 1);
      _bluetooth.printCustom("Rathnapura Rd, Lellopitiya", 2, 1);
      _bluetooth.printNewLine();
      _bluetooth.printCustom("GUEST RECEIPT / PROFORMA", 3, 1);
      if (isTaxInclusive) {
        _bluetooth.printCustom("(TAX INCLUSIVE)", 2, 1);
      }
      _bluetooth.printNewLine();
      
      _bluetooth.printCustom("Invoice#: ${orderData['id'] ?? 'N/A'}", 2, 0);
      _bluetooth.printCustom("Date: ${DateTime.now().toString().substring(0, 16)}", 2, 0);
      _bluetooth.printCustom("Customer: ${orderData['customer'] ?? 'Walk-in Customer'}", 2, 0);
      
      _bluetooth.printCustom("--------------------------------", 2, 1);
      
      final items = orderData['items'] as List<dynamic>? ?? [];
      final taxes = orderData['taxes'] as List<dynamic>? ?? orderData['applied_taxes'] as List<dynamic>? ?? [];
      double grandTotal = double.tryParse(orderData['grandTotal']?.toString() ?? '0') ?? 0.0;
      double totalTaxAmount = 0.0;
      for (var t in taxes) {
        totalTaxAmount += double.tryParse(t['amount']?.toString() ?? '0') ?? 0.0;
      }

      for (var item in items) {
        final name = item['name'].toString().padRight(15).substring(0, 15);
        double discount = double.tryParse(item['discount']?.toString() ?? '0') ?? 0.0;
        double lineTotal = double.tryParse(item['subtotal']?.toString() ?? '0') ?? 0.0;
        double qty = double.tryParse(item['quantity']?.toString() ?? '1') ?? 1.0;

        // Reconstruct base price before discount
        double price = (lineTotal + discount) / (qty > 0 ? qty : 1);

        if (isTaxInclusive && grandTotal > 0 && totalTaxAmount > 0) {
          double ratio = lineTotal / grandTotal;
          double itemTax = totalTaxAmount * ratio;
          price += (itemTax / qty);
        }

        final qtyStr = qty.toStringAsFixed(0).padLeft(3);
        final priceStr = price.toStringAsFixed(2).padLeft(6);
        _bluetooth.printCustom("$name x$qtyStr LKR $priceStr", 2, 0);

        if (discount > 0) {
          _bluetooth.printCustom("  Discount: -LKR ${discount.toStringAsFixed(2)}", 2, 0);
        }
      }
      
      _bluetooth.printCustom("--------------------------------", 2, 1);
      
      double subtotalOrder = double.tryParse(orderData['subtotal']?.toString() ?? '0') ?? (grandTotal - totalTaxAmount);
      double discountTotal = double.tryParse(orderData['discount_total']?.toString() ?? '0') ?? 0.0;
      String discountType = orderData['discount_type']?.toString() ?? 'fixed';
      String discountLabel = 'Discount ($discountType)';
      if (discountType == 'percentage' && orderData['discount_value'] != null) {
        discountLabel = 'Discount (${orderData['discount_value']}%)';
      }
      
      if (!isTaxInclusive) {
        _bluetooth.printCustom("Subtotal: LKR ${subtotalOrder.toStringAsFixed(2)}", 2, 0);
        if (discountTotal > 0) {
          _bluetooth.printCustom("$discountLabel: -LKR ${discountTotal.toStringAsFixed(2)}", 2, 0);
        }
        if (taxes.isNotEmpty) {
          for (var t in taxes) {
            double tAmt = double.tryParse(t['amount']?.toString() ?? '0') ?? 0.0;
            String tName = t['tax_name']?.toString() ?? t['name']?.toString() ?? 'Tax';
            String rateStr = t['rate_percent'] != null ? ' (${t['rate_percent']}%)' : '';
            _bluetooth.printCustom("$tName$rateStr: LKR ${tAmt.toStringAsFixed(2)}", 2, 0);
          }
        }
        _bluetooth.printCustom("--------------------------------", 2, 1);
      } else {
        _bluetooth.printCustom("Subtotal: LKR ${(subtotalOrder + totalTaxAmount).toStringAsFixed(2)}", 2, 0);
        if (discountTotal > 0) {
          _bluetooth.printCustom("$discountLabel: -LKR ${discountTotal.toStringAsFixed(2)}", 2, 0);
        }
        _bluetooth.printCustom("--------------------------------", 2, 1);
      }
      
      double finalTotal = grandTotal; // grandTotal already includes taxes
      _bluetooth.printCustom("Total: LKR ${finalTotal.toStringAsFixed(2)}", 3, 1);
      _bluetooth.printNewLine();
      _bluetooth.printCustom("This is not a final tax invoice", 2, 1);
      _bluetooth.printNewLine();
      _bluetooth.printNewLine();
      _bluetooth.printNewLine();
      _bluetooth.paperCut();
    }
  }
  Future<void> printKOT(Map<String, dynamic> orderData) async {
    bool? isConnected = await _bluetooth.isConnected;
    if (isConnected != true) {
      await connect();
    }
    
    if (await _bluetooth.isConnected == true) {
      _bluetooth.printNewLine();
      _bluetooth.printCustom("KOT", 4, 1);
      _bluetooth.printNewLine();
      
      _bluetooth.printCustom("KOT No: ${orderData['id'] ?? 'N/A'}", 2, 0);
      _bluetooth.printCustom("Date: ${DateTime.now().toString().split('.')[0]}", 2, 0);
      _bluetooth.printNewLine();
      
      _bluetooth.printCustom("--------------------------------", 2, 1);
      _bluetooth.printCustom("Item Name         Qty", 2, 0);
      _bluetooth.printCustom("--------------------------------", 2, 1);
      
      final items = orderData['items'] as List<dynamic>? ?? [];
      for (var item in items) {
        final name = item['name'].toString().padRight(20).substring(0, 20);
        final qty = item['quantity'].toString().padLeft(4);
        _bluetooth.printCustom("$name $qty", 2, 0);
      }
      
      _bluetooth.printCustom("--------------------------------", 2, 1);
      _bluetooth.printNewLine();
      _bluetooth.printNewLine();
      _bluetooth.paperCut();
    }
  }

  Future<void> testPrint() async {
    bool? isConnected = await _bluetooth.isConnected;
    if (isConnected != true) {
      await connect();
    }
    
    if (await _bluetooth.isConnected == true) {
      _bluetooth.printNewLine();
      _bluetooth.printCustom("TEST PRINT", 4, 1);
      _bluetooth.printNewLine();
      _bluetooth.printCustom("Thermal Printer Connected successfully!", 2, 1);
      _bluetooth.printNewLine();
      _bluetooth.printCustom("--------------------------------", 2, 1);
      _bluetooth.printNewLine();
      _bluetooth.paperCut();
    }
  }

  Future<void> printPaymentReceipt(Map<String, dynamic> data) async {
    bool? isConnected = await _bluetooth.isConnected;
    if (isConnected != true) {
      print("Printer not connected");
      return;
    }

    try {
      _bluetooth.printCustom("PAYMENT RECEIPT", 4, 1);
      _bluetooth.printNewLine();
      
      _bluetooth.printCustom("Receipt No: ${data['receipt_id'] ?? 'N/A'}", 2, 0);
      _bluetooth.printCustom("Invoice No: ${data['invoice_no']}", 2, 0);
      _bluetooth.printCustom("Date: ${data['payment_date']}", 2, 0);
      _bluetooth.printCustom("Customer: ${data['customer_name']}", 2, 0);
      _bluetooth.printNewLine();
      
      _bluetooth.printCustom("--------------------------------", 2, 1);
      
      _bluetooth.printCustom("Method: ${data['payment_method']}", 2, 0);
      _bluetooth.printCustom("Amount Paid: LKR ${double.parse(data['amount'].toString()).toStringAsFixed(2)}", 3, 0);
      _bluetooth.printNewLine();
      
      _bluetooth.printCustom("Pending Balance: LKR ${double.parse(data['pending_balance'].toString()).toStringAsFixed(2)}", 2, 0);
      
      _bluetooth.printCustom("--------------------------------", 2, 1);
      _bluetooth.printNewLine();
      _bluetooth.printCustom("Thank you for your payment!", 2, 1);
      _bluetooth.printNewLine();
      _bluetooth.printNewLine();
      _bluetooth.paperCut();
    } catch (e) {
      print("Error printing payment receipt: $e");
    }
  }

  Future<void> printImageBytes(Uint8List imageBytes) async {
    bool? isConnected = await _bluetooth.isConnected;
    if (isConnected != true) {
      await connect();
    }
    
    if (await _bluetooth.isConnected == true) {
      _bluetooth.printNewLine();
      _bluetooth.printImageBytes(imageBytes);
      _bluetooth.printNewLine();
      _bluetooth.printNewLine();
      _bluetooth.paperCut();
    }
  }
  
  Future<void> printImageBytesResized(Uint8List imageBytes, {int width = 576}) async {
    // Instead of doing it in dart, let the printer print the bytes directly. 
    // Wait, the user wants EXACT 576. 
    // We can do it in checkout_payment_screen to avoid adding image package logic here.
  }

  Future<void> printCustomerQR(Map<String, dynamic> customerData) async {
    bool? isConnected = await _bluetooth.isConnected;
    if (isConnected != true) {
      await connect();
    }
    
    if (await _bluetooth.isConnected == true) {
      _bluetooth.printNewLine();
      _bluetooth.printCustom("CUSTOMER QR", 3, 1);
      _bluetooth.printNewLine();
      
      _bluetooth.printCustom("Name: ${customerData['name']}", 2, 1);
      if (customerData['phone'] != null && customerData['phone'].isNotEmpty) {
        _bluetooth.printCustom("Phone: ${customerData['phone']}", 2, 1);
      }
      _bluetooth.printNewLine();
      
      String qrHash = customerData['qr_code_hash'] ?? 'CUSTOMER:${customerData['id']}';
      _bluetooth.printQRcode(qrHash, 300, 300, 1); // width, height, align(center=1)
      
      _bluetooth.printNewLine();
      _bluetooth.printCustom(qrHash, 1, 1);
      _bluetooth.printNewLine();
      _bluetooth.printNewLine();
      _bluetooth.paperCut();
    }
  }
}
