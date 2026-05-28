import 'package:flutter/material.dart';
import 'package:mobile_pos/models/customer.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile_pos/screens/dashboard_screen.dart';
import 'package:screenshot/screenshot.dart';
import 'package:image/image.dart' as img;
import 'dart:typed_data';
import '../models/cart_item.dart';
import '../services/api_service.dart';
import '../services/printer_service.dart';
import 'package:geolocator/geolocator.dart';

class CheckoutPaymentScreen extends StatefulWidget {
  final Customer customer;
  final List<CartItem> cart;
  final double grandTotal;
  final double subtotal;
  final double taxTotal;
  final List<dynamic> appliedTaxes;
  final double discountTotal;
  final String discountType;
  final double discountValue;
  final String? orderType;
  final int? tableId;
  final int? stewardId;
  final int? heldOrderId;
  final int? appliedPromotionId;
  final String? appliedPromotionName;
  final bool isReturnMode;

  const CheckoutPaymentScreen({
    super.key,
    required this.customer,
    required this.cart,
    required this.grandTotal,
    required this.subtotal,
    required this.taxTotal,
    required this.appliedTaxes,
    this.discountTotal = 0.0,
    this.discountType = 'fixed',
    this.discountValue = 0.0,
    this.orderType,
    this.tableId,
    this.stewardId,
    this.heldOrderId,
    this.appliedPromotionId,
    this.appliedPromotionName,
    this.isReturnMode = false,
  });

  @override
  State<CheckoutPaymentScreen> createState() => _CheckoutPaymentScreenState();
}

class _CheckoutPaymentScreenState extends State<CheckoutPaymentScreen> {
  final ApiService _apiService = ApiService();
  String _paymentMethod = 'Cash';
  double _amountTendered = 0.0;
  bool _isProcessing = false;
  
  final TextEditingController _amountController = TextEditingController();

  String _formatCurrency(dynamic amount) {
    double val = double.tryParse(amount?.toString() ?? '0') ?? 0.0;
    String str = val.toStringAsFixed(2);
    str = str.replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
    return 'LKR $str';
  }

  List<Map<String, dynamic>> _banks = [];
  bool _isLoadingBanks = true;

  // Card details
  String _cardType = 'Visa';
  String _cardLast4 = '';
  String _cardAuthCode = '';
  String? _cardBankId;
  String _cardCategory = 'Credit';

  // Cheque details
  String _chequeNo = '';
  String _chequeDate = DateTime.now().toIso8601String().split('T')[0];
  String? _chequeBankName;
  String _chequeBranchName = '';
  String _receiptMode = 'standard';

  @override
  void initState() {
    super.initState();
    _amountTendered = widget.grandTotal;
    _amountController.text = _amountTendered.toStringAsFixed(0);
    _loadBanks();
    _loadReceiptMode();
  }

  Future<void> _loadReceiptMode() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _receiptMode = prefs.getString('receipt_mode') ?? 'standard';
      });
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _loadBanks() async {
    try {
      final banks = await _apiService.fetchBanks();
      if (mounted) {
        setState(() {
          _banks = banks;
          _isLoadingBanks = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingBanks = false);
    }
  }

  void _updateAmountTendered(double amount) {
    setState(() {
      _amountTendered = amount;
      _amountController.text = amount.toStringAsFixed(0);
    });
  }

  Future<void> _processCheckout() async {
    if (_isProcessing) return;
    
    // Validation
    if (_paymentMethod == 'Card') {
      if (_cardLast4.isEmpty || _cardAuthCode.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter Card details (Last 4 and Auth Code).'), backgroundColor: Colors.redAccent));
        return;
      }
    } else if (_paymentMethod == 'Cheque') {
      if (_chequeNo.isEmpty || _chequeBankName == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter Cheque details (Cheque No and Bank).'), backgroundColor: Colors.redAccent));
        return;
      }
    }

    setState(() => _isProcessing = true);

    try {
      final activeLocation = await _apiService.getActiveLocation();
      if (activeLocation == null) {
        throw Exception("No active location selected.");
      }

      final items = widget.cart.map((cartItem) {
        return {
          'item_id': cartItem.item.id,
          'batch_id': cartItem.batchId,
          'description': cartItem.item.name,
          'item_type': cartItem.item.itemType ?? 'Part',
          'quantity': cartItem.quantity,
          'unit_price': cartItem.item.price,
          'discount': cartItem.discount + cartItem.promoDiscount,
          'tax_amount': 0,
          'line_total': cartItem.subtotal,
        };
      }).toList();

      Map<String, dynamic> payload;
      
      if (widget.isReturnMode) {
        payload = {
          'location_id': activeLocation['id'],
          'customer_id': widget.customer.id,
          'invoice_id': null, // Blind return
          'total_amount': widget.grandTotal,
          'reason': 'Mobile App Blind Return',
          'items': items,
          'refund': {
            'payment_method': _paymentMethod,
            'amount': _paymentMethod == 'Credit' ? 0 : widget.grandTotal,
          }
        };
      } else {
        payload = {
          'location_id': activeLocation['id'],
          'customer_id': widget.customer.id,
          'billing_address': '',
          'shipping_address': '',
          'issue_date': DateTime.now().toIso8601String().split('T')[0],
          'due_date': DateTime.now().toIso8601String().split('T')[0],
          'subtotal': widget.subtotal,
          'tax_total': widget.taxTotal,
          'applied_taxes': widget.appliedTaxes,
          'discount_total': widget.discountTotal,
          'grand_total': widget.grandTotal,
          'order_type': widget.orderType ?? 'retail',
          'table_id': widget.tableId,
          'steward_id': widget.stewardId,
          'held_order_id': widget.heldOrderId,
          'applied_promotion_id': widget.appliedPromotionId,
          'applied_promotion_name': widget.appliedPromotionName,
          'discount_type': widget.discountType,
          'discount_value': widget.discountValue,
          'notes': 'POS Mobile App Sale',
          'items': items,
          'payments': [
            {
              'method': _paymentMethod,
              'amount': _paymentMethod == 'Credit' ? 0 : widget.grandTotal,
              'cardLast4': _cardLast4,
              'cardType': _cardType,
              'cardAuthCode': _cardAuthCode,
              'bankId': _cardBankId,
              'cardCategory': _cardCategory,
              'chequeNo': _chequeNo,
              'chequeBankName': _chequeBankName,
              'chequeBranchName': _chequeBranchName,
              'chequeDate': _chequeDate,
              'chequePayee': '',
            }
          ]
        };
      }

      final response = widget.isReturnMode 
          ? await _apiService.processReturn(payload)
          : await _apiService.createInvoice(payload);

      if (response['success']) {
        // Auto log a visit so the shop is removed from the To Visit list 
        // even if the user didn't explicitly check in via GPS/QR.
        if (widget.customer.id != 0) {
          double lat = 0.0;
          double lng = 0.0;
          try {
            Position? pos = await Geolocator.getLastKnownPosition();
            pos ??= await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.medium, timeLimit: const Duration(seconds: 3));
            lat = pos.latitude;
            lng = pos.longitude;
          } catch (_) {}

          await _apiService.logVisit({
            'customer_id': widget.customer.id,
            'visit_type': 'SALE',
            'reason': 'Invoice Created',
            'latitude': lat,
            'longitude': lng,
          });
        }

        final orderData = {
          'id': widget.isReturnMode 
              ? (response['data']['return_no']?.toString() ?? response['data']['id']?.toString() ?? 'N/A')
              : (response['data']['invoice_no']?.toString() ?? response['data']['id']?.toString() ?? 'N/A'),
          'customer': widget.customer.name,
          'total': widget.grandTotal.toStringAsFixed(2),
          'paymentMethod': _paymentMethod,
          'amountTendered': _amountTendered,
          'grandTotal': widget.grandTotal,
          'subtotal': widget.subtotal,
          'tax_total': widget.taxTotal,
          'discount_total': widget.discountTotal,
          'discount_type': widget.discountType,
          'discount_value': widget.discountValue,
          'applied_taxes': widget.appliedTaxes,
          'items': items.map((i) => {
            'name': i['description'],
            'price': i['unit_price'],
            'quantity': i['quantity'],
            'discount': i['discount'],
            'subtotal': i['line_total'],
          }).toList(),
        };

        if (!mounted) return;
        _showPrintSelectionDialog(orderData);
      } else {
        throw Exception(response['message']);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  void _showPrintSelectionDialog(Map<String, dynamic> orderData) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        bool isPrinting = false;
        bool isPrinted = false;
        final screenshotController = ScreenshotController();
        
        return StatefulBuilder(
          builder: (context, setState) {
            if (isPrinted) {
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
                              child: ReceiptView(orderData: orderData, receiptMode: _receiptMode),
                            ),
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(16),
                        color: Colors.white,
                        child: SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blueAccent,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            onPressed: () {
                              Navigator.pop(ctx);
                              Navigator.pop(this.context, true);
                            },
                            child: const Text('Close to Dashboard', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }

            return AlertDialog(
              backgroundColor: Theme.of(context).cardColor,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              contentPadding: isPrinting ? EdgeInsets.zero : const EdgeInsets.all(24),
              content: isPrinting 
              ? SizedBox(
                  width: 300,
                  height: 350,
                  child: PrintingAnimation(orderData: orderData, receiptMode: _receiptMode),
                )
              : Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.check_circle, color: Colors.green, size: 60),
                  const SizedBox(height: 16),
                  Text(widget.isReturnMode ? 'RETURN SUCCESSFUL!' : 'CHECKOUT SUCCESSFUL!', style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color, fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(
                    widget.isReturnMode
                      ? 'Return #${orderData['id']} has been processed.\nSelect your preferred receipt format to print.'
                      : 'Invoice #${orderData['id']} has been processed.\nSelect your preferred receipt format to print.',
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
                          width: 384, // Logical width (makes text wrap properly)
                          color: Colors.white,
                          child: ReceiptView(orderData: orderData, receiptMode: 'standard'),
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
                      setState(() {
                        isPrinting = false;
                        isPrinted = true;
                      });
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
                              const Text('Print exact preview format.', style: TextStyle(fontSize: 12, color: Colors.grey)),
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
                          child: ReceiptView(orderData: orderData, receiptMode: 'inclusive'),
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
                      setState(() {
                        isPrinting = false;
                        isPrinted = true;
                      });
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
                    onPressed: isPrinting ? null : () {
                      Navigator.pop(ctx);
                      Navigator.pop(this.context, true);
                    },
                    child: const Text('Skip Printing', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                  )
                ],
              ),
            );
          }
        );
      },
    );
  }

  Widget _buildMethodButton(String method, IconData icon) {
    final isSelected = _paymentMethod == method;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _paymentMethod = method;
            if (method == 'Credit') {
              _updateAmountTendered(0);
            } else if (_amountTendered == 0) {
              _updateAmountTendered(widget.grandTotal);
            }
          });
        },
        child: Container(
          height: 60,
          decoration: BoxDecoration(
            color: isSelected ? Colors.blueAccent : Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isSelected ? Colors.blueAccent : Theme.of(context).dividerColor.withOpacity(0.1), width: 2),
            boxShadow: isSelected ? [BoxShadow(color: Colors.blueAccent.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))] : [],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: isSelected ? Colors.white : Theme.of(context).iconTheme.color, size: 20),
              const SizedBox(width: 8),
              Text(
                method, 
                style: TextStyle(
                  color: isSelected ? Colors.white : Theme.of(context).textTheme.bodyLarge?.color,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                )
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCardDetails() {
    return Container(
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.only(top: 16),
      decoration: BoxDecoration(
        color: Colors.indigo.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.indigo.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('CARD DETAILS', style: TextStyle(color: Colors.indigo, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.5)),
          const SizedBox(height: 16),
          Row(
            children: ['Visa', 'Mastercard', 'AMEX', 'Other'].map((type) => Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4.0),
                child: OutlinedButton(
                  onPressed: () => setState(() => _cardType = type),
                  style: OutlinedButton.styleFrom(
                    backgroundColor: _cardType == type ? Colors.indigo : Colors.transparent,
                    side: BorderSide(color: Colors.indigo.withOpacity(_cardType == type ? 1 : 0.2)),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                  child: Text(type, style: TextStyle(fontSize: 11, color: _cardType == type ? Colors.white : Colors.indigo)),
                ),
              ),
            )).toList(),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  decoration: const InputDecoration(
                    labelText: 'Last 4 Digits',
                    border: OutlineInputBorder(),
                    counterText: '',
                  ),
                  onChanged: (val) => _cardLast4 = val,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(
                    labelText: 'Auth Code',
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (val) => _cardAuthCode = val,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (!_isLoadingBanks && _banks.isNotEmpty)
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Bank', border: OutlineInputBorder()),
              value: _cardBankId,
              items: _banks.map((b) => DropdownMenuItem<String>(value: b['id'].toString(), child: Text(b['name']))).toList(),
              onChanged: (val) => setState(() => _cardBankId = val),
            ),
        ],
      ),
    );
  }

  Widget _buildChequeDetails() {
    return Container(
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.only(top: 16),
      decoration: BoxDecoration(
        color: Colors.amber.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.amber.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('CHEQUE DETAILS', style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.5)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(labelText: 'Cheque No.', border: OutlineInputBorder()),
                  onChanged: (val) => _chequeNo = val,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextField(
                  readOnly: true,
                  decoration: const InputDecoration(labelText: 'Date', border: OutlineInputBorder()),
                  controller: TextEditingController(text: _chequeDate),
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now(),
                      firstDate: DateTime(2000),
                      lastDate: DateTime(2100),
                    );
                    if (date != null) {
                      setState(() => _chequeDate = date.toIso8601String().split('T')[0]);
                    }
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (!_isLoadingBanks && _banks.isNotEmpty)
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Issuing Bank', border: OutlineInputBorder()),
              value: _chequeBankName,
              items: _banks.map((b) => DropdownMenuItem<String>(value: b['name'].toString(), child: Text(b['name']))).toList(),
              onChanged: (val) => setState(() => _chequeBankName = val),
            ),
          const SizedBox(height: 16),
          TextField(
            decoration: const InputDecoration(labelText: 'Branch Name', border: OutlineInputBorder()),
            onChanged: (val) => _chequeBranchName = val,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(widget.isReturnMode ? 'RETURN REFUND' : 'POS CHECKOUT', style: const TextStyle(fontWeight: FontWeight.w900)),
        centerTitle: true,
        elevation: 0,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Total Due
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
                      decoration: BoxDecoration(
                        color: Colors.blueAccent.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('TOTAL DUE', style: TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.5)),
                          Flexible(
                          child: Text(_formatCurrency(widget.grandTotal), style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color, fontSize: 32, fontWeight: FontWeight.w900)),
                        ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Payment Method
                    Text('PAYMENT METHOD', style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6), fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.5)),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _buildMethodButton('Cash', Icons.money),
                        const SizedBox(width: 12),
                        _buildMethodButton('Card', Icons.credit_card),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _buildMethodButton('Cheque', Icons.receipt_long),
                        const SizedBox(width: 12),
                        _buildMethodButton('Bank Transfer', Icons.account_balance),
                      ],
                    ),
                    const SizedBox(height: 16),
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          _paymentMethod = 'Credit';
                          _updateAmountTendered(0);
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: _paymentMethod == 'Credit' ? Colors.redAccent.withOpacity(0.1) : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _paymentMethod == 'Credit' ? Colors.redAccent : Colors.redAccent.withOpacity(0.3),
                            style: BorderStyle.solid,
                            width: 2,
                          ),
                        ),
                        child: const Center(
                          child: Text(
                            '📋 Credit Close — Invoice later',
                            style: TextStyle(
                              color: Colors.redAccent,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                    ),

                    if (_paymentMethod == 'Card') _buildCardDetails(),
                    if (_paymentMethod == 'Cheque') _buildChequeDetails(),
                    
                    const SizedBox(height: 32),

                    // Amount Tendered
                    if (_paymentMethod != 'Credit') ...[
                      Text('AMOUNT TENDERED', style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6), fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.5)),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.green.withOpacity(0.3)),
                        ),
                        child: TextField(
                          controller: _amountController,
                          keyboardType: TextInputType.number,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.green, fontSize: 32, fontWeight: FontWeight.w900),
                          decoration: const InputDecoration(border: InputBorder.none),
                          onChanged: (val) {
                            setState(() {
                              _amountTendered = double.tryParse(val) ?? 0.0;
                            });
                          },
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(child: _buildQuickAddButton('Exact', widget.grandTotal, true)),
                          const SizedBox(width: 8),
                          Expanded(child: _buildQuickAddButton('+500', 500, false)),
                          const SizedBox(width: 8),
                          Expanded(child: _buildQuickAddButton('+1000', 1000, false)),
                          const SizedBox(width: 8),
                          Expanded(child: _buildQuickAddButton('+5000', 5000, false)),
                        ],
                      ),
                      
                      if (_amountTendered > widget.grandTotal) ...[
                        const SizedBox(height: 24),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                          decoration: BoxDecoration(
                            color: Colors.orangeAccent.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.orangeAccent.withOpacity(0.3)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('CHANGE DUE', style: TextStyle(color: Colors.orangeAccent, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.5)),
                              Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(_formatCurrency(_amountTendered - widget.grandTotal), style: const TextStyle(color: Colors.orangeAccent, fontSize: 24, fontWeight: FontWeight.w900)),
                                const Text('CHANGE', style: TextStyle(color: Colors.orangeAccent, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),     ],
                          ),
                            ],
                          ),
                        ),
                      ]
                    ]
                  ],
                ),
              ),
            ),
            
            // Bottom Action Bar
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -5),
                  )
                ]
              ),
              child: Row(
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text('Cancel', style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color, fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                  const SizedBox(width: 24),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _isProcessing ? null : _processCheckout,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: Colors.blueAccent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      icon: _isProcessing 
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.print, color: Colors.white),
                      label: const Text('Process & Print Invoice', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildQuickAddButton(String label, double amount, bool isExact) {
    return OutlinedButton(
      onPressed: () {
        if (isExact) {
          _updateAmountTendered(amount);
        } else {
          _updateAmountTendered(_amountTendered + amount);
        }
      },
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 12),
        side: BorderSide(color: Theme.of(context).dividerColor.withOpacity(0.2)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: Text(label, style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color, fontWeight: FontWeight.bold, fontSize: 14)),
    );
  }
}

class PrintingAnimation extends StatefulWidget {
  final Map<String, dynamic>? orderData;
  final String receiptMode;
  const PrintingAnimation({super.key, this.orderData, this.receiptMode = 'standard'});

  @override
  State<PrintingAnimation> createState() => _PrintingAnimationState();
}

class _PrintingAnimationState extends State<PrintingAnimation> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );

    _slideAnimation = Tween<double>(begin: 0, end: 120).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: Container(
        color: Theme.of(context).cardColor,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Text feedback
            const Positioned(
              top: 40,
              child: Text(
                'Printing Receipt...',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blueAccent),
              ),
            ),
            
            // Receipt sliding up
            AnimatedBuilder(
              animation: _slideAnimation,
              builder: (context, child) {
                return Positioned(
                  bottom: 100 + _slideAnimation.value,
                  child: Container(
                    width: 140,
                    height: 180,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: Colors.grey.withOpacity(0.3)),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, -2))
                      ],
                    ),
                    clipBehavior: Clip.hardEdge,
                    child: widget.orderData != null
                        ? Transform.scale(
                            scale: 0.35,
                            alignment: Alignment.topCenter,
                            child: SizedBox(
                              width: 400, // Fixed width for scaling
                              child: ReceiptView(orderData: widget.orderData!, receiptMode: widget.receiptMode),
                            ),
                          )
                        : Column(
                            children: [
                              const SizedBox(height: 20),
                              Container(width: 80, height: 4, color: Colors.grey.withOpacity(0.3)),
                              const SizedBox(height: 10),
                              Container(width: 100, height: 4, color: Colors.grey.withOpacity(0.3)),
                              const SizedBox(height: 10),
                              Container(width: 60, height: 4, color: Colors.grey.withOpacity(0.3)),
                              const SizedBox(height: 20),
                              const Icon(Icons.qr_code, size: 40, color: Colors.black87),
                            ],
                          ),
                  ),
                );
              },
            ),

            // Printer Machine Base
            Positioned(
              bottom: 60,
              child: Container(
                width: 200,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.grey[800],
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                    bottomLeft: Radius.circular(10),
                    bottomRight: Radius.circular(10),
                  ),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 5))
                  ],
                ),
                child: Column(
                  children: [
                    // Printer Slot
                    Container(
                      margin: const EdgeInsets.only(top: 10),
                      width: 150,
                      height: 6,
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Blinking Light
                    AnimatedBuilder(
                      animation: _controller,
                      builder: (context, child) {
                        return Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: (_controller.value * 10).floor() % 2 == 0 ? Colors.greenAccent : Colors.green[800],
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(color: Colors.greenAccent.withOpacity(0.5), blurRadius: 5)
                            ]
                          ),
                        );
                      }
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ReceiptView extends StatelessWidget {
  final Map<String, dynamic> orderData;
  final String receiptMode;
  const ReceiptView({super.key, required this.orderData, this.receiptMode = 'standard'});

  String _formatCurrency(dynamic amount) {
    double val = double.tryParse(amount?.toString() ?? '0') ?? 0.0;
    String str = val.toStringAsFixed(2);
    str = str.replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
    return 'LKR $str';
  }

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

  Widget _buildRow(String label, String value, {bool isBold = false, double fontSize = 16}) {
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
    final grandTotal = orderData['grandTotal'] as double;
    final paymentMethod = orderData['paymentMethod'] as String;
    
    // Taxes processing
    final List<dynamic> appliedTaxes = orderData['applied_taxes'] ?? [];
    final double taxTotal = double.tryParse(orderData['tax_total']?.toString() ?? '0') ?? 0.0;
    
    bool isInclusive = receiptMode == 'inclusive';

    return Padding(
      padding: const EdgeInsets.all(0.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('KDU Group', textAlign: TextAlign.center, style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.black)),
          const SizedBox(height: 4),
          const Text('Nebulync Restaurant', textAlign: TextAlign.center, style: TextStyle(fontSize: 16, color: Colors.black87)),
          const Text('Tel: 0770481363', textAlign: TextAlign.center, style: TextStyle(fontSize: 16, color: Colors.black87)),
          const Text('Rathnapura Rd, Lellopitiya', textAlign: TextAlign.center, style: TextStyle(fontSize: 16, color: Colors.black87)),
          const SizedBox(height: 8),
          Text(
            orderData['isReprint'] == true ? 'INVOICE REPRINT' : 'INVOICE',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black, letterSpacing: 1.5),
          ),
          const SizedBox(height: 8),
          _buildDivider(),
          _buildRow('Invoice#', orderData['id'].toString(), isBold: true),
          _buildRow('Date', DateTime.now().toString().substring(0, 16)),
          _buildRow('Customer', orderData['customer'].toString()),
          _buildDivider(isDashed: true),
          const Text('ITEMS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black)),
          const SizedBox(height: 8),
          
          ...items.map((item) {
            double lineTotal = double.tryParse(item['subtotal']?.toString() ?? '0') ?? 0.0;
            double qty = double.tryParse(item['quantity']?.toString() ?? '1') ?? 1.0;
            double discount = double.tryParse(item['discount']?.toString() ?? '0') ?? 0.0;
            double unitPrice = (lineTotal + discount) / (qty > 0 ? qty : 1);
            
            // If inclusive, we distribute tax proportionally into the items' unit price (approximate, for display)
            // But actually we can just use the grandTotal/subtotal ratio or just show lineTotal + tax share.
            // A simpler inclusive way is just showing the final lineTotal with tax.
            // Since we don't have per-item tax breakdown, we'll just show the base lineTotal for now.
            // In web POS, inclusive means tax is hidden in the price. 
            // So we add a proportional tax to the line total.
            double displayLineTotal = lineTotal;
            if (isInclusive && appliedTaxes.isNotEmpty) {
              double subtotal = double.tryParse(orderData['subtotal']?.toString() ?? '0') ?? grandTotal;
              if (subtotal > 0) {
                double ratio = lineTotal / subtotal;
                displayLineTotal += (taxTotal * ratio);
                unitPrice = displayLineTotal / (qty > 0 ? qty : 1);
              }
            }

            return Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item['name'].toString(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black)),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('${item['quantity']} × @ ${_formatCurrency(unitPrice)}', style: const TextStyle(fontSize: 16, color: Colors.black87)),
                      Text(_formatCurrency(displayLineTotal + discount), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black)),
                    ],
                  ),
                  if (discount > 0)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Discount:', style: TextStyle(fontSize: 14, color: Colors.black87)),
                        Text('-${_formatCurrency(discount)}', style: const TextStyle(fontSize: 14, color: Colors.black87)),
                      ],
                  ),
                ],
              ),
            );
          }),
          
          _buildDivider(isDashed: true),
          
          if (!isInclusive) ...[
            _buildRow('Subtotal', _formatCurrency(orderData['subtotal'] ?? (grandTotal - taxTotal))),
            if (orderData['discount_total'] != null && double.tryParse(orderData['discount_total'].toString()) != null && double.parse(orderData['discount_total'].toString()) > 0)
              _buildRow('Discount (${orderData['discount_type'] == 'percentage' && orderData['discount_value'] != null ? '${orderData['discount_value']}%' : (orderData['discount_type'] ?? 'fixed')})', '-${_formatCurrency(double.parse(orderData['discount_total'].toString()))}'),
            for (var tax in appliedTaxes)
              _buildRow(
                '${tax['name']?.toString() ?? 'Tax'}${tax['rate_percent'] != null ? ' (${tax['rate_percent']}%)' : ''}',
                _formatCurrency(tax['amount'])
              ),
            const SizedBox(height: 4),
          ] else ...[
            _buildRow('Subtotal', _formatCurrency((double.tryParse(orderData['subtotal']?.toString() ?? '0') ?? grandTotal) + taxTotal)),
            if (orderData['discount_total'] != null && double.tryParse(orderData['discount_total'].toString()) != null && double.parse(orderData['discount_total'].toString()) > 0)
              _buildRow('Discount (${orderData['discount_type'] == 'percentage' && orderData['discount_value'] != null ? '${orderData['discount_value']}%' : (orderData['discount_type'] ?? 'fixed')})', '-${_formatCurrency(double.parse(orderData['discount_total'].toString()))}'),
          ],

          _buildRow('TOTAL', _formatCurrency(grandTotal), isBold: true, fontSize: 22),
          
          _buildDivider(),
          
          _buildRow(paymentMethod, _formatCurrency(grandTotal), isBold: true),
          if (paymentMethod == 'Cash') ...[
            _buildRow('Total Paid', _formatCurrency(grandTotal), isBold: true),
          ],
          const SizedBox(height: 16),
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(border: Border.all(color: Colors.black, width: 1.5)),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check, size: 20, color: Colors.black),
                  SizedBox(width: 8),
                  Text('PAID', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: Colors.black, letterSpacing: 2)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          _buildDivider(isDashed: true),
          const SizedBox(height: 8),
          const Text('Thank you for your purchase!', textAlign: TextAlign.center, style: TextStyle(fontSize: 16, color: Colors.black87)),
          const SizedBox(height: 8),
          const Text('BizFlow ERP System', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black)),
          const Text('Developed by Nebulync.com', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Colors.black54)),
          const SizedBox(height: 16),
          const Text('* * * * * * * * *', textAlign: TextAlign.center, style: TextStyle(letterSpacing: 4, color: Colors.black54)),
        ],
      ),
    );
  }
}
