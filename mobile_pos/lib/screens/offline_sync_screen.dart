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
    setState(() {
      _offlineInvoices = invoices;
      _isLoading = false;
    });
  }

  Future<void> _syncData() async {
    if (_offlineInvoices.isEmpty) return;

    setState(() => _isSyncing = true);
    try {
      await ApiService().syncOfflineInvoices();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sync completed')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Sync error: $e')));
    } finally {
      await _loadOfflineData();
      setState(() => _isSyncing = false);
    }
  }

  Future<void> _deleteInvoice(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Offline Record?'),
        content: const Text('This will permanently delete this offline transaction. Are you sure?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true), 
            child: const Text('Delete', style: TextStyle(color: Colors.red))
          ),
        ],
      ),
    );

    if (confirm == true) {
      await DbService().deleteOfflineInvoice(id);
      await _loadOfflineData();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Offline Transactions'),
        actions: [
          if (_offlineInvoices.isNotEmpty)
            TextButton.icon(
              onPressed: _isSyncing ? null : _syncData,
              icon: _isSyncing ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.sync),
              label: const Text('Sync All'),
            ),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _offlineInvoices.isEmpty
          ? const Center(child: Text('No offline transactions pending.'))
          : ListView.builder(
              itemCount: _offlineInvoices.length,
              itemBuilder: (context, index) {
                final record = _offlineInvoices[index];
                Map<String, dynamic> payload = {};
                try {
                  payload = jsonDecode(record['payload']);
                } catch (e) {
                  // Ignore parse error
                }
                
                final created = record['created_at'];
                final grandTotal = payload['grandTotal'] ?? 0;
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
                        color: Colors.grey[50],
                        width: double.infinity,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Created: $created', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                            const SizedBox(height: 8),
                            const Text('Payload:', style: TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text(
                              const JsonEncoder.withIndent('  ').convert(payload),
                              style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
                            ),
                          ],
                        ),
                      )
                    ],
                  ),
                );
              },
            ),
    );
  }
}
