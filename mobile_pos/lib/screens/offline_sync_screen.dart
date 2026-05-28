import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/db_service.dart';
import '../services/api_service.dart';

class OfflineSyncScreen extends StatefulWidget {
  const OfflineSyncScreen({Key? key}) : super(key: key);

  @override
  State<OfflineSyncScreen> createState() => _OfflineSyncScreenState();
}

class _OfflineSyncScreenState extends State<OfflineSyncScreen> {
  List<Map<String, dynamic>> _offlineInvoices = [];
  List<Map<String, dynamic>> _offlineCustomers = [];
  List<Map<String, dynamic>> _offlinePayments = [];
  bool _isLoading = true;
  bool _isSyncing = false;

  @override
  void initState() {
    super.initState();
    _loadOfflineData();
  }

  Future<void> _loadOfflineData() async {
    setState(() => _isLoading = true);
    final invoices = await DbService().getOfflineInvoices();
    final customers = await DbService().getOfflineCustomers();
    final payments = await DbService().getOfflinePayments();
    setState(() {
      _offlineInvoices = invoices;
      _offlineCustomers = customers;
      _offlinePayments = payments;
      _isLoading = false;
    });
  }

  Future<void> _syncData() async {
    if (_offlineInvoices.isEmpty && _offlineCustomers.isEmpty && _offlinePayments.isEmpty) return;

    setState(() => _isSyncing = true);
    try {
      await ApiService().syncOfflineCustomers();
      await ApiService().syncOfflineVisits();
      await ApiService().syncOfflineInvoices();
      await ApiService().syncOfflinePayments();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sync completed')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Sync error: $e')));
    } finally {
      await _loadOfflineData();
      setState(() => _isSyncing = false);
    }
  }

  Future<void> _deleteInvoice(String id) async {
    final confirm = await _confirmDelete();
    if (confirm == true) {
      await DbService().deleteOfflineInvoice(id);
      await _loadOfflineData();
    }
  }

  Future<void> _deletePayment(String id) async {
    final confirm = await _confirmDelete();
    if (confirm == true) {
      await DbService().deleteOfflinePayment(id);
      await _loadOfflineData();
    }
  }

  Future<void> _deleteCustomer(String id) async {
    final confirm = await _confirmDelete();
    if (confirm == true) {
      await DbService().deleteOfflineCustomer(id);
      await _loadOfflineData();
    }
  }

  Future<bool?> _confirmDelete() async {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Offline Record?'),
        content: const Text('This will permanently delete this offline record. Are you sure?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true), 
            child: const Text('Delete', style: TextStyle(color: Colors.red))
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Offline Transactions'),
        actions: [
          if (_offlineInvoices.isNotEmpty || _offlineCustomers.isNotEmpty || _offlinePayments.isNotEmpty)
            TextButton.icon(
              onPressed: _isSyncing ? null : _syncData,
              icon: _isSyncing ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.sync),
              label: const Text('Sync All'),
            ),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _offlineInvoices.isEmpty && _offlineCustomers.isEmpty && _offlinePayments.isEmpty
          ? const Center(child: Text('No offline records pending.'))
          : ListView(
              children: [
                if (_offlineCustomers.isNotEmpty) ...[
                  const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text('Pending Customers', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                  ..._offlineCustomers.map((record) {
                    Map<String, dynamic> payload = {};
                    try { payload = jsonDecode(record['payload']); } catch (_) {}
                    final created = record['created_at'];
                    final name = payload['name'] ?? 'Unknown Customer';

                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: ExpansionTile(
                        title: Text(record['temp_id'], style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('Name: $name'),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.redAccent),
                          onPressed: () => _deleteCustomer(record['temp_id']),
                        ),
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            color: Theme.of(context).brightness == Brightness.dark ? Colors.grey[900] : Colors.grey[50],
                            width: double.infinity,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Created: $created', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                const SizedBox(height: 8),
                                Text('Payload:', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).textTheme.bodyLarge?.color)),
                                const SizedBox(height: 4),
                                Text(
                                  const JsonEncoder.withIndent('  ').convert(payload),
                                  style: TextStyle(fontFamily: 'monospace', fontSize: 12, color: Theme.of(context).textTheme.bodyMedium?.color),
                                ),
                              ],
                            ),
                          )
                        ],
                      ),
                    );
                  }).toList(),
                ],
                if (_offlineInvoices.isNotEmpty) ...[
                  const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text('Pending Invoices', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                  ..._offlineInvoices.map((record) {
                    Map<String, dynamic> payload = {};
                    try { payload = jsonDecode(record['payload']); } catch (_) {}
                    final created = record['created_at'];
                    final grandTotal = payload['grand_total'] ?? payload['grandTotal'] ?? 0;
                    final items = payload['items'] as List<dynamic>? ?? [];

                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: ExpansionTile(
                        title: Text(record['id'], style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('Items: ${items.length} | Total: LKR ${grandTotal.toString()}'),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.redAccent),
                          onPressed: () => _deleteInvoice(record['id']),
                        ),
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            color: Theme.of(context).brightness == Brightness.dark ? Colors.grey[900] : Colors.grey[50],
                            width: double.infinity,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Created: $created', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                const SizedBox(height: 8),
                                Text('Payload:', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).textTheme.bodyLarge?.color)),
                                const SizedBox(height: 4),
                                Text(
                                  const JsonEncoder.withIndent('  ').convert(payload),
                                  style: TextStyle(fontFamily: 'monospace', fontSize: 12, color: Theme.of(context).textTheme.bodyMedium?.color),
                                ),
                              ],
                            ),
                          )
                        ],
                      ),
                    );
                  }).toList(),
                ],
                if (_offlinePayments.isNotEmpty) ...[
                  const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text('Pending Payments', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                  ..._offlinePayments.map((record) {
                    Map<String, dynamic> payload = {};
                    try { payload = jsonDecode(record['payload']); } catch (_) {}
                    final created = record['created_at'];
                    final amount = payload['payment_amount'] ?? 0;
                    final invoiceId = record['invoice_id'];

                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: ExpansionTile(
                        title: Text(record['id'], style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('Invoice ID: $invoiceId | Amount: LKR $amount'),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.redAccent),
                          onPressed: () => _deletePayment(record['id']),
                        ),
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            color: Theme.of(context).brightness == Brightness.dark ? Colors.grey[900] : Colors.grey[50],
                            width: double.infinity,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Created: $created', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                const SizedBox(height: 8),
                                Text('Payload:', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).textTheme.bodyLarge?.color)),
                                const SizedBox(height: 4),
                                Text(
                                  const JsonEncoder.withIndent('  ').convert(payload),
                                  style: TextStyle(fontFamily: 'monospace', fontSize: 12, color: Theme.of(context).textTheme.bodyMedium?.color),
                                ),
                              ],
                            ),
                          )
                        ],
                      ),
                    );
                  }).toList(),
                ],
              ],
            ),
    );
  }
}
