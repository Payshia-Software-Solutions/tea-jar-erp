import 'package:flutter/material.dart';
import '../models/customer.dart';
import '../services/api_service.dart';
import 'cart_screen.dart';
import 'qr_scanner_screen.dart' as qr_scanner;

class CustomerSelectionScreen extends StatefulWidget {
  final String? orderType;
  final int? tableId;
  final int? stewardId;

  const CustomerSelectionScreen({
    super.key,
    this.orderType,
    this.tableId,
    this.stewardId,
  });

  @override
  State<CustomerSelectionScreen> createState() => _CustomerSelectionScreenState();
}

class _CustomerSelectionScreenState extends State<CustomerSelectionScreen> {
  final ApiService _apiService = ApiService();
  List<Customer> _customers = [];
  List<Customer> _filteredCustomers = [];
  bool _isLoading = true;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadCustomers();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _filteredCustomers = _customers.where((c) => 
        c.name.toLowerCase().contains(query) || 
        (c.phone != null && c.phone!.contains(query)) ||
        (c.email != null && c.email!.toLowerCase().contains(query))
      ).toList();
    });
  }

  Future<void> _loadCustomers() async {
    try {
      final customers = await _apiService.fetchCustomers();
      if (mounted) {
        setState(() {
          _customers = customers;
          _filteredCustomers = customers;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load customers: ${e.toString()}')),
        );
      }
    }
  }

  Widget _buildCustomerAvatar(Customer customer) {
    String initials = "C";
    if (customer.name.isNotEmpty) {
      final parts = customer.name.split(' ');
      if (parts.length > 1) {
        initials = '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      } else {
        initials = customer.name.substring(0, 1).toUpperCase();
      }
    }

    return CircleAvatar(
      backgroundColor: Colors.blueAccent.withOpacity(0.2),
      foregroundColor: Colors.blueAccent,
      radius: 24,
      child: Text(initials, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Customer', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const qr_scanner.QRScannerScreen()),
              );
              if (result != null && result is String) {
                // Find customer by QR code hash
                final customer = _customers.firstWhere(
                  (c) => c.qrCodeHash == result,
                  orElse: () => Customer(id: 0, name: ''),
                );
                if (customer.id != 0) {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (_) => CartScreen(
                        customer: customer,
                        orderType: widget.orderType,
                        tableId: widget.tableId,
                        stewardId: widget.stewardId,
                      ),
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Customer not found for this QR code.')),
                  );
                }
              }
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by name, phone or email...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                        },
                      )
                    : null,
                filled: true,
                fillColor: Theme.of(context).cardColor,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
          ),
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator(color: Colors.blueAccent))
              : _filteredCustomers.isEmpty 
                ? const Center(child: Text('No customers found'))
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: _filteredCustomers.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final customer = _filteredCustomers[index];
                      return GestureDetector(
                        onTap: () {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                              builder: (_) => CartScreen(
                                customer: customer,
                                orderType: widget.orderType,
                                tableId: widget.tableId,
                                stewardId: widget.stewardId,
                              ),
                            ),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Theme.of(context).cardColor,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.1)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.02),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              )
                            ]
                          ),
                          child: Row(
                            children: [
                              _buildCustomerAvatar(customer),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      customer.name, 
                                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Theme.of(context).textTheme.bodyLarge?.color),
                                    ),
                                    if (customer.phone != null && customer.phone!.isNotEmpty)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 4),
                                        child: Row(
                                          children: [
                                            Icon(Icons.phone, size: 12, color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.5)),
                                            const SizedBox(width: 4),
                                            Text(customer.phone!, style: TextStyle(fontSize: 12, color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7))),
                                          ],
                                        ),
                                      ),
                                    if (customer.email != null && customer.email!.isNotEmpty)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 2),
                                        child: Row(
                                          children: [
                                            Icon(Icons.email, size: 12, color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.5)),
                                            const SizedBox(width: 4),
                                            Text(customer.email!, style: TextStyle(fontSize: 12, color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7))),
                                          ],
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              const Icon(Icons.chevron_right, color: Colors.blueAccent),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: Colors.blueAccent,
        onPressed: () {
          // Walk-in customer shortcut
          final walkIn = Customer(id: 0, name: 'Walk-in Customer');
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => CartScreen(
                customer: walkIn,
                orderType: widget.orderType,
                tableId: widget.tableId,
                stewardId: widget.stewardId,
              ),
            ),
          );
        },
        icon: const Icon(Icons.person_outline, color: Colors.white),
        label: const Text('WALK-IN', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
