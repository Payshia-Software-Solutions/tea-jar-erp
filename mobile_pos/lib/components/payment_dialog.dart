import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/printer_service.dart';

class PaymentDialog extends StatefulWidget {
  final Map<String, dynamic> invoice;
  final VoidCallback onPaymentSuccess;

  const PaymentDialog({Key? key, required this.invoice, required this.onPaymentSuccess}) : super(key: key);

  @override
  State<PaymentDialog> createState() => _PaymentDialogState();
}

class _PaymentDialogState extends State<PaymentDialog> {
  final _amountController = TextEditingController();
  final _referenceController = TextEditingController();
  final _notesController = TextEditingController();
  
  String _paymentMethod = 'Cash';
  bool _isLoading = false;
  double _pendingBalance = 0;

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

  @override
  void initState() {
    super.initState();
    final grandTotal = double.tryParse(widget.invoice['grand_total']?.toString() ?? '0') ?? 0;
    final paidAmount = double.tryParse(widget.invoice['paid_amount']?.toString() ?? '0') ?? 0;
    _pendingBalance = grandTotal - paidAmount;
    _amountController.text = _pendingBalance.toStringAsFixed(2);
    _loadBanks();
  }

  Future<void> _loadBanks() async {
    try {
      final banks = await ApiService().fetchBanks();
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

  Future<void> _submitPayment() async {
    final amount = double.tryParse(_amountController.text) ?? 0;
    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a valid amount')));
      return;
    }
    if (amount > _pendingBalance) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Amount cannot exceed pending balance')));
      return;
    }

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

    setState(() => _isLoading = true);

    try {
      final payload = <String, dynamic>{
        'payment_amount': amount,
        'payment_method': _paymentMethod,
        'payment_date': DateTime.now().toIso8601String().split('T').first,
        'reference_no': _referenceController.text,
        'notes': _notesController.text,
      };

      if (_paymentMethod == 'Card') {
        payload.addAll({
          'card_type': _cardType,
          'card_last4': _cardLast4,
          'card_auth_code': _cardAuthCode,
          'bank_id': _cardBankId,
          'card_category': _cardCategory,
        });
      } else if (_paymentMethod == 'Cheque') {
        payload.addAll({
          'cheque': {
            'cheque_no': _chequeNo,
            'bank_name': _chequeBankName,
            'branch_name': _chequeBranchName,
            'cheque_date': _chequeDate,
            'payee_name': '',
          }
        });
      }

      final receiptId = await ApiService().addPayment(
        int.parse(widget.invoice['id'].toString()),
        payload,
      );

      if (receiptId != null) {
        if (mounted) {
          final paymentData = {
            'receipt_id': receiptId,
            'invoice_no': widget.invoice['invoice_no'],
            'customer_name': widget.invoice['customer_name'] ?? 'Walk-in Customer',
            'amount': amount,
            'payment_method': _paymentMethod,
            'payment_date': DateTime.now().toIso8601String().split('T').first,
            'pending_balance': _pendingBalance - amount,
          };
          _showPrintDialog(paymentData);
        }
      } else {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to record payment')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showPrintDialog(Map<String, dynamic> paymentData) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        bool isPrinting = false;
        
        return StatefulBuilder(
          builder: (context, setState) {
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
                            child: PaymentReceiptView(paymentData: paymentData),
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
                            child: TextButton(
                              onPressed: isPrinting ? null : () {
                                Navigator.pop(ctx);
                                Navigator.pop(this.context);
                                widget.onPaymentSuccess();
                              },
                              style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                              child: const Text('Close', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 16)),
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
                              onPressed: isPrinting ? null : () async {
                                setState(() => isPrinting = true);
                                final printer = PrinterService();
                                await printer.printPaymentReceipt(paymentData);
                                await Future.delayed(const Duration(seconds: 2));
                                setState(() => isPrinting = false);
                              },
                              icon: isPrinting 
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                                  : const Icon(Icons.print, color: Colors.white),
                              label: const Text('Print', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
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
        );
      },
    );
  }

  Widget _buildCardDetails() {
    return Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(top: 8),
      decoration: BoxDecoration(
        color: Colors.indigo.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.indigo.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('CARD DETAILS', style: TextStyle(color: Colors.indigo, fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 1)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: ['Visa', 'Mastercard', 'AMEX', 'Other'].map((type) => OutlinedButton(
              onPressed: () => setState(() => _cardType = type),
              style: OutlinedButton.styleFrom(
                backgroundColor: _cardType == type ? Colors.indigo : Colors.transparent,
                side: BorderSide(color: Colors.indigo.withOpacity(_cardType == type ? 1 : 0.2)),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text(type, style: TextStyle(fontSize: 10, color: _cardType == type ? Colors.white : Colors.indigo)),
            )).toList(),
          ),
          const SizedBox(height: 12),
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
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  onChanged: (val) => _cardLast4 = val,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(
                    labelText: 'Auth Code',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  onChanged: (val) => _cardAuthCode = val,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (!_isLoadingBanks && _banks.isNotEmpty)
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(
                labelText: 'Bank', 
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
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
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(top: 8),
      decoration: BoxDecoration(
        color: Colors.amber.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('CHEQUE DETAILS', style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 1)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(
                    labelText: 'Cheque No.', 
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  onChanged: (val) => _chequeNo = val,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  readOnly: true,
                  decoration: const InputDecoration(
                    labelText: 'Date', 
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
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
          const SizedBox(height: 12),
          if (!_isLoadingBanks && _banks.isNotEmpty)
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(
                labelText: 'Issuing Bank', 
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              value: _chequeBankName,
              items: _banks.map((b) => DropdownMenuItem<String>(value: b['name'].toString(), child: Text(b['name']))).toList(),
              onChanged: (val) => setState(() => _chequeBankName = val),
            ),
          const SizedBox(height: 12),
          TextField(
            decoration: const InputDecoration(
              labelText: 'Branch Name', 
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            onChanged: (val) => _chequeBranchName = val,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Settle Invoice: ${widget.invoice['invoice_no']}'),
      content: SingleChildScrollView(
        child: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Pending Balance: LKR ${_pendingBalance.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 16),
              TextField(
                controller: _amountController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Amount (LKR)', 
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _paymentMethod,
                decoration: const InputDecoration(
                  labelText: 'Payment Method', 
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                ),
                items: ['Cash', 'Card', 'Bank Transfer', 'Cheque'].map((method) {
                  return DropdownMenuItem(value: method, child: Text(method));
                }).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _paymentMethod = val);
                },
              ),
              
              if (_paymentMethod == 'Card') _buildCardDetails(),
              if (_paymentMethod == 'Cheque') _buildChequeDetails(),

              const SizedBox(height: 12),
              if (_paymentMethod == 'Bank Transfer' || _paymentMethod == 'Card')
                TextField(
                  controller: _referenceController,
                  decoration: const InputDecoration(
                    labelText: 'Reference Number', 
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  ),
                ),
              if (_paymentMethod == 'Bank Transfer' || _paymentMethod == 'Card') const SizedBox(height: 12),
              TextField(
                controller: _notesController,
                decoration: const InputDecoration(
                  labelText: 'Notes', 
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: _isLoading ? null : _submitPayment,
          child: _isLoading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Pay'),
        ),
      ],
    );
  }
}

class PaymentReceiptView extends StatelessWidget {
  final Map<String, dynamic> paymentData;
  const PaymentReceiptView({super.key, required this.paymentData});

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
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(24.0),
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
          const Text('PAYMENT RECEIPT', textAlign: TextAlign.center, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black)),
          _buildDivider(),
          _buildRow('Receipt#', paymentData['receipt_id']?.toString() ?? 'N/A', isBold: true),
          _buildRow('Invoice#', paymentData['invoice_no'].toString()),
          _buildRow('Date', paymentData['payment_date'].toString()),
          _buildRow('Customer', paymentData['customer_name'].toString()),
          _buildDivider(isDashed: true),
          _buildRow('Method', paymentData['payment_method'].toString()),
          _buildDivider(isDashed: true),
          _buildRow('Amount Paid', _formatCurrency(paymentData['amount']), isBold: true, fontSize: 16),
          _buildDivider(),
          _buildRow('Pending Bal', _formatCurrency(paymentData['pending_balance']), isBold: true),
          const SizedBox(height: 16),
          const Text('Thank you for your payment!', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: Colors.black)),
        ],
      ),
    );
  }
}
