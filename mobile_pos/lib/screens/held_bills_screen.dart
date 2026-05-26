import 'package:flutter/material.dart';
import '../services/api_service.dart';

class HeldBillsScreen extends StatefulWidget {
  const HeldBillsScreen({super.key});

  @override
  State<HeldBillsScreen> createState() => _HeldBillsScreenState();
}

class _HeldBillsScreenState extends State<HeldBillsScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _heldBills = [];
  bool _isLoading = true;
  int? _activeLocationId;

  @override
  void initState() {
    super.initState();
    _loadHeldBills();
  }

  Future<void> _loadHeldBills() async {
    setState(() {
      _isLoading = true;
    });
    try {
      final activeLocation = await _apiService.getActiveLocation();
      if (activeLocation != null) {
        _activeLocationId = int.tryParse(activeLocation['id']?.toString() ?? '1') ?? 1;
        final bills = await _apiService.fetchHeldOrders(_activeLocationId!);
        if (mounted) {
          setState(() {
            _heldBills = bills;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading held bills: $e')),
        );
      }
    }
  }

  void _handleBillAction(int id, String action) async {
    Navigator.pop(context); // close bottom sheet
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    final billData = await _apiService.loadHeldOrder(id);
    if (mounted) {
      Navigator.pop(context); // close loading dialog
      if (billData != null) {
        Navigator.pop(context, {'action': action, 'data': billData});
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to load full bill details (check connection).'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showActionOptions(int id) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (BuildContext context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              const Padding(
                padding: EdgeInsets.all(16.0),
                child: Text('Held Bill Options', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              ),
              ListTile(
                leading: const Icon(Icons.play_circle_fill, color: Colors.blueAccent),
                title: const Text('Continue Bill'),
                onTap: () => _handleBillAction(id, 'continue'),
              ),
              ListTile(
                leading: const Icon(Icons.print, color: Colors.orange),
                title: const Text('Reprint KOT'),
                onTap: () => _handleBillAction(id, 'reprint'),
              ),
              ListTile(
                leading: const Icon(Icons.receipt_long, color: Colors.teal),
                title: const Text('Guest Receipt'),
                onTap: () => _handleBillAction(id, 'guest_receipt'),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Held Bills'),
        backgroundColor: Colors.orange.withOpacity(0.1),
        foregroundColor: Colors.deepOrange,
      ),
      body: RefreshIndicator(
        onRefresh: _loadHeldBills,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _heldBills.isEmpty
                ? ListView(physics: const AlwaysScrollableScrollPhysics(), children: [SizedBox(height: MediaQuery.of(context).size.height*0.4), const Center(child: Text('No held bills currently pending.'))])
                : ListView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16.0),
                  itemCount: _heldBills.length,
                  itemBuilder: (context, index) {
                    final bill = _heldBills[index];
                    DateTime? date = DateTime.tryParse(bill['created_at']?.toString() ?? '');
                    final dateStr = date != null ? '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}' : '';
                    final tableStr = bill['table_name'] ?? 'No Table';
                    final customerStr = bill['customer_name'] ?? 'Default Customer';
                    final notes = bill['notes'] ?? '';

                    return Card(
                      elevation: 2,
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(16),
                        leading: CircleAvatar(
                          backgroundColor: Colors.orange.withOpacity(0.2),
                          child: const Icon(Icons.receipt_long, color: Colors.deepOrange),
                        ),
                        title: Text('Bill #${bill['id']} - $tableStr', style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text('Customer: $customerStr'),
                            Text('Time: $dateStr'),
                            if (notes.isNotEmpty) Text('Notes: $notes', style: const TextStyle(fontStyle: FontStyle.italic)),
                          ],
                        ),
                        trailing: Text(
                          'LKR ${double.tryParse(bill['grand_total']?.toString() ?? '0')?.toStringAsFixed(2)}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.green),
                        ),
                        onTap: () {
                          final int billId = int.tryParse(bill['id']?.toString() ?? '0') ?? 0;
                          _showActionOptions(billId);
                        },
                      ),
                    );
                  },
                ),
      ),
    );
  }
}
