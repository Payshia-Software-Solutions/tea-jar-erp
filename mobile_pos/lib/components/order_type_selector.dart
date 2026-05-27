import 'package:flutter/material.dart';
import '../models/service_location.dart';
import '../models/table.dart';
import '../models/steward.dart';
import '../services/api_service.dart';
import '../screens/customer_selection_screen.dart';

class OrderTypeSelector extends StatefulWidget {
  final ServiceLocation activeLocation;

  const OrderTypeSelector({Key? key, required this.activeLocation}) : super(key: key);

  static Future<Map<String, dynamic>?> show(BuildContext context, ServiceLocation activeLocation) async {
    return await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => OrderTypeSelector(activeLocation: activeLocation),
    );
  }

  @override
  State<OrderTypeSelector> createState() => _OrderTypeSelectorState();
}

class _OrderTypeSelectorState extends State<OrderTypeSelector> {
  int _step = 0; // 0 = Mode, 1 = Table, 2 = Steward
  List<TableModel> _tables = [];
  List<Steward> _stewards = [];
  bool _isLoading = false;

  String? _selectedMode;
  int? _selectedTableId;
  String? _selectedTableName;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: Theme.of(context).brightness == Brightness.dark
              ? [const Color(0xFF1E293B), const Color(0xFF000000)]
              : [const Color(0xFFE0E7FF), const Color(0xFFF8FAFC)],
        ),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildHeader(),
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: _buildContent(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    String title = "New Order";
    String subtitle = "Select service mode";
    if (_step == 1) {
      title = "Select Table";
      subtitle = "Choose available table";
    } else if (_step == 2) {
      title = "Assign Steward";
      subtitle = _selectedTableName != null ? "Steward for $_selectedTableName" : "Assign Steward";
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      child: Row(
        children: [
          if (_step > 0)
            IconButton(
              icon: const Icon(Icons.arrow_back_ios, size: 20),
              onPressed: () {
                setState(() {
                  _step--;
                });
              },
            ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(48.0),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_step == 0) return _buildModeSelection();
    if (_step == 1) return _buildTableSelection();
    if (_step == 2) return _buildStewardSelection();

    return const SizedBox();
  }

  Widget _buildModeSelection() {
    return Column(
      children: [
        if (widget.activeLocation.allowDineIn)
          _buildOptionCard(
            title: "Dine In",
            subtitle: "Table service",
            icon: Icons.restaurant,
            color: Colors.indigo,
            onTap: () => _handleModeSelection("dine_in"),
          ),
        if (widget.activeLocation.allowTakeAway)
          _buildOptionCard(
            title: "Take Away",
            subtitle: "Collection",
            icon: Icons.shopping_bag_outlined,
            color: Colors.teal,
            onTap: () => _handleModeSelection("take_away"),
          ),
        if (widget.activeLocation.allowRetail)
          _buildOptionCard(
            title: "Retail",
            subtitle: "Standard sale",
            icon: Icons.storefront,
            color: Colors.orange,
            onTap: () => _handleModeSelection("retail"),
          ),
      ],
    );
  }

  Future<void> _handleModeSelection(String mode) async {
    _selectedMode = mode;
    if (mode == "dine_in") {
      setState(() => _isLoading = true);
      try {
        final api = ApiService();
        final results = await Future.wait([
          api.fetchTables(widget.activeLocation.id),
          api.fetchStewards(widget.activeLocation.id),
        ]);
        _tables = results[0] as List<TableModel>;
        _stewards = results[1] as List<Steward>;
        setState(() {
          _step = 1;
        });
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading tables: $e')));
        }
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    } else {
      _finishSelection();
    }
  }

  Widget _buildTableSelection() {
    return Column(
      children: [
        _buildSkipCard(
          title: "None / Skip Table",
          icon: Icons.grid_view,
          onTap: () {
            _selectedTableId = null;
            _selectedTableName = null;
            setState(() => _step = 2);
          },
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.2,
          ),
          itemCount: _tables.length,
          itemBuilder: (ctx, index) {
            final table = _tables[index];
            return InkWell(
              onTap: () {
                _selectedTableId = table.id;
                _selectedTableName = table.name;
                setState(() => _step = 2);
              },
              borderRadius: BorderRadius.circular(16),
              child: Container(
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.withOpacity(0.2)),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.grid_view, color: Colors.grey.shade600),
                    const SizedBox(height: 8),
                    Text(
                      table.name,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildStewardSelection() {
    return Column(
      children: [
        _buildSkipCard(
          title: "Skip Steward",
          icon: Icons.person_outline,
          onTap: () {
            _finishSelection(stewardId: null);
          },
        ),
        const SizedBox(height: 16),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _stewards.length,
          itemBuilder: (ctx, index) {
            final steward = _stewards[index];
            return InkWell(
              onTap: () => _finishSelection(stewardId: steward.id),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: Colors.indigo.withOpacity(0.1),
                      foregroundColor: Colors.indigo,
                      child: Text(
                        steward.name.substring(0, steward.name.length > 1 ? 2 : 1).toUpperCase(),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Text(
                        steward.name,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ),
                    const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  void _finishSelection({int? stewardId}) {
    Navigator.pop(context, {
      'orderType': _selectedMode,
      'tableId': _selectedTableId,
      'stewardId': stewardId,
    });
  }

  Widget _buildOptionCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.withOpacity(0.2)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, color: Colors.grey, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildSkipCard({
    required String title,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.teal.withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.teal.withOpacity(0.3), style: BorderStyle.solid),
        ),
        child: Row(
          children: [
            Icon(icon, color: Colors.teal),
            const SizedBox(width: 16),
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.teal),
            ),
          ],
        ),
      ),
    );
  }
}
