import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/route.dart';

class RouteSelectorWidget extends StatefulWidget {
  final VoidCallback onRoutesChanged;

  const RouteSelectorWidget({Key? key, required this.onRoutesChanged}) : super(key: key);

  @override
  State<RouteSelectorWidget> createState() => _RouteSelectorWidgetState();
}

class _RouteSelectorWidgetState extends State<RouteSelectorWidget> {
  List<int> _activeRouteIds = [];
  List<DeliveryRoute> _allRoutes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadRoutes();
  }

  Future<void> _loadRoutes() async {
    final active = await ApiService().getActiveRoutes();
    try {
      final routes = await ApiService().fetchRoutes();
      if (mounted) {
        setState(() {
          _allRoutes = routes;
          _activeRouteIds = active;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showSelectionDialog() {
    showDialog(
      context: context,
      builder: (ctx) {
        List<int> tempSelected = List.from(_activeRouteIds);
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Select Default Routes'),
              content: SizedBox(
                width: double.maxFinite,
                child: _allRoutes.isEmpty
                    ? const Text('No routes available.')
                    : ListView.builder(
                        shrinkWrap: true,
                        itemCount: _allRoutes.length,
                        itemBuilder: (ctx, index) {
                          final route = _allRoutes[index];
                          final int routeId = route.id;
                          final bool isSelected = tempSelected.contains(routeId);
                          return CheckboxListTile(
                            title: Text(route.name),
                            value: isSelected,
                            onChanged: (val) {
                              setDialogState(() {
                                if (val == true) {
                                  tempSelected.add(routeId);
                                } else {
                                  tempSelected.remove(routeId);
                                }
                              });
                            },
                          );
                        },
                      ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
                TextButton(
                  onPressed: () async {
                    await ApiService().setActiveRoutes(tempSelected);
                    setState(() {
                      _activeRouteIds = tempSelected;
                    });
                    widget.onRoutesChanged();
                    if (mounted) Navigator.pop(ctx);
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 16.0),
        child: Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))),
      );
    }
    
    String label = 'Routes (${_activeRouteIds.length})';
    if (_activeRouteIds.isEmpty) label = 'All Routes';

    return InkWell(
      onTap: _showSelectionDialog,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: Colors.blueAccent.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.blueAccent.withOpacity(0.5)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.route, size: 16, color: Colors.blueAccent),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                color: Colors.blueAccent,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
