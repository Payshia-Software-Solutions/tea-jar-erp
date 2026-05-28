import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/customer.dart';
import '../components/payment_dialog.dart';
import 'package:geolocator/geolocator.dart';

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({Key? key}) : super(key: key);

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String _formatCurrency(dynamic amount) {
    double val = double.tryParse(amount?.toString() ?? '0') ?? 0.0;
    String str = val.toStringAsFixed(2);
    str = str.replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
    return 'LKR $str';
  }

  final ApiService _apiService = ApiService();
  List<Customer> _customers = [];
  List<Customer> _filteredCustomers = [];
  Customer? _selectedCustomer;
  List<dynamic> _invoices = [];
  bool _isLoadingCustomers = true;
  bool _isLoadingInvoices = false;
  bool _isLocating = false;
  Position? _currentPosition;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchCustomers();
    _fetchLocationAndSort();
    _searchController.addListener(_onSearchChanged);
  }

  Future<void> _fetchLocationAndSort() async {
    if (mounted) setState(() => _isLocating = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) setState(() => _isLocating = false);
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted) setState(() => _isLocating = false);
          return;
        }
      }
      if (permission == LocationPermission.deniedForever) {
        if (mounted) setState(() => _isLocating = false);
        return;
      }

      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      ).timeout(const Duration(seconds: 10));
    } catch (_) {
      try {
        _currentPosition = await Geolocator.getLastKnownPosition();
      } catch (_) {
        _currentPosition = null;
      }
    }
    
    if (mounted) {
      setState(() => _isLocating = false);
      if (_currentPosition != null) {
        _onSearchChanged();
      }
    }
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
        (c.phone != null && c.phone!.contains(query))
      ).toList();

      if (_currentPosition != null) {
        _filteredCustomers.sort((a, b) {
          final hasLocA = a.latitude != null && a.longitude != null && a.latitude != 0 && a.longitude != 0;
          final hasLocB = b.latitude != null && b.longitude != null && b.latitude != 0 && b.longitude != 0;
          
          if (!hasLocA && !hasLocB) return 0;
          if (!hasLocA) return 1;
          if (!hasLocB) return -1;

          final distA = Geolocator.distanceBetween(
            _currentPosition!.latitude, _currentPosition!.longitude,
            a.latitude!, a.longitude!
          );
          final distB = Geolocator.distanceBetween(
            _currentPosition!.latitude, _currentPosition!.longitude,
            b.latitude!, b.longitude!
          );
          return distA.compareTo(distB);
        });
      }
    });
  }

  Future<void> _fetchCustomers() async {
    try {
      final customers = await _apiService.fetchCustomers();
      if (mounted) {
        setState(() {
          _customers = customers;
          _filteredCustomers = customers;
          _isLoadingCustomers = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingCustomers = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading customers: $e')));
      }
    }
  }

  Future<void> _fetchInvoices(int customerId) async {
    setState(() {
      _isLoadingInvoices = true;
      _invoices = [];
    });

    try {
      final allInvoices = await _apiService.getCustomerInvoices(customerId);
      // Filter for Unpaid / Partial / (grand_total > paid_amount)
      final unpaidInvoices = allInvoices.where((inv) {
        final status = inv['status']?.toString();
        if (status == 'Cancelled' || status == 'Paid') return false;
        
        final grandTotal = double.tryParse(inv['grand_total']?.toString() ?? '0') ?? 0;
        final paidAmount = double.tryParse(inv['paid_amount']?.toString() ?? '0') ?? 0;
        return grandTotal > paidAmount;
      }).toList();

      if (mounted) {
        setState(() {
          _invoices = unpaidInvoices;
          _isLoadingInvoices = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingInvoices = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading invoices: $e')));
      }
    }
  }

  String _getDistanceString(Customer customer) {
    if (_currentPosition == null || customer.latitude == null || customer.longitude == null || customer.latitude == 0 || customer.longitude == 0) {
      return '';
    }
    final dist = Geolocator.distanceBetween(
      _currentPosition!.latitude, _currentPosition!.longitude,
      customer.latitude!, customer.longitude!
    );
    if (dist < 1000) {
      return '${dist.toStringAsFixed(0)} m';
    } else {
      return '${(dist / 1000).toStringAsFixed(1)} km';
    }
  }

  Widget _buildCustomerAvatar(Customer customer) {
    String initials = "C";
    if (customer.name.isNotEmpty) {
      final parts = customer.name.split(' ');
      if (parts.length > 1 && parts[1].isNotEmpty) {
        initials = '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      } else {
        initials = customer.name.substring(0, 1).toUpperCase();
      }
    }
    return CircleAvatar(
      backgroundColor: Colors.blueAccent.withOpacity(0.2),
      foregroundColor: Colors.blueAccent,
      radius: 20,
      child: Text(initials, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Receive Payment'),
        leading: _selectedCustomer != null ? IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            setState(() {
              _selectedCustomer = null;
              _invoices = [];
            });
          },
        ) : null,
        actions: [
          if (_selectedCustomer == null)
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () {
                setState(() => _isLoadingCustomers = true);
                _fetchLocationAndSort();
                _fetchCustomers();
              },
            ),
        ],
      ),
      body: _selectedCustomer == null 
        ? _buildCustomerSelection() 
        : _buildInvoiceSelection(),
    );
  }

  Widget _buildCustomerSelection() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search customer name or phone...',
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
        if (_isLocating)
          const Padding(
            padding: EdgeInsets.only(bottom: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.blueAccent)),
                SizedBox(width: 8),
                Text('Calculating distances...', style: TextStyle(color: Colors.blueAccent, fontSize: 12, fontWeight: FontWeight.bold)),
              ],
            ),
          )
        else
          Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: InkWell(
              onTap: _fetchLocationAndSort,
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.my_location, size: 14, color: Colors.blueAccent),
                  SizedBox(width: 4),
                  Text('Recalculate Distances', style: TextStyle(color: Colors.blueAccent, fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
        Expanded(
          child: _isLoadingCustomers 
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
                        setState(() {
                          _selectedCustomer = customer;
                        });
                        _fetchInvoices(customer.id);
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
                            if (_getDistanceString(customer).isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(right: 8.0),
                                child: Text(
                                  _getDistanceString(customer),
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blueAccent),
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
    );
  }

  Widget _buildInvoiceSelection() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _buildCustomerAvatar(_selectedCustomer!),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_selectedCustomer!.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    if (_selectedCustomer!.phone != null)
                      Text(_selectedCustomer!.phone!, style: TextStyle(color: Colors.grey[600])),
                  ],
                ),
              ),
            ],
          ),
          const Divider(height: 32),
          const Text('Pending Invoices', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          
          if (_isLoadingInvoices)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else if (_invoices.isEmpty)
            const Expanded(child: Center(child: Text('No pending invoices found for this customer.', style: TextStyle(color: Colors.grey))))
          else
            Expanded(
              child: ListView.builder(
                itemCount: _invoices.length,
                itemBuilder: (context, index) {
                  final inv = _invoices[index];
                  final grandTotal = double.tryParse(inv['grand_total']?.toString() ?? '0') ?? 0;
                  final paidAmount = double.tryParse(inv['paid_amount']?.toString() ?? '0') ?? 0;
                  final pending = grandTotal - paidAmount;

                  return Card(
                    elevation: 2,
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    child: Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Invoice #${inv['invoice_no']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              Text(inv['issue_date'] ?? '', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Total: ${_formatCurrency(grandTotal)}'),
                                  Text('Paid: ${_formatCurrency(paidAmount)}'),
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text('Pending: ${_formatCurrency(pending)}', style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 8),
                                  ElevatedButton(
                                    onPressed: () {
                                      showDialog(
                                        context: context,
                                        barrierDismissible: false,
                                        builder: (ctx) => PaymentDialog(
                                          invoice: inv,
                                          customerId: _selectedCustomer!.id,
                                          onPaymentSuccess: () {
                                            _fetchInvoices(_selectedCustomer!.id);
                                          },
                                        ),
                                      );
                                    },
                                    style: ElevatedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                                    ),
                                    child: const Text('Pay'),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
