import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../services/api_service.dart';
import '../models/route.dart';
import '../models/city.dart';

class CustomerRegistrationScreen extends StatefulWidget {
  const CustomerRegistrationScreen({Key? key}) : super(key: key);

  @override
  State<CustomerRegistrationScreen> createState() => _CustomerRegistrationScreenState();
}

class _CustomerRegistrationScreenState extends State<CustomerRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isSubmitting = false;

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _nicController = TextEditingController();
  final TextEditingController _taxNumberController = TextEditingController();
  final TextEditingController _creditLimitController = TextEditingController(text: "0");
  final TextEditingController _creditDaysController = TextEditingController(text: "0");

  String _orderType = 'External';
  int _isActive = 1;
  
  // New State variables
  File? _selectedPhoto;
  final ImagePicker _picker = ImagePicker();
  double? _latitude;
  double? _longitude;
  bool _isFetchingLocation = false;

  int? _selectedRouteId;
  List<DeliveryRoute> _routes = [];
  String? _selectedCity;
  List<City> _apiCities = [];
  List<String> _cities = [];

  @override
  void initState() {
    super.initState();
    _getLocation();
    _fetchRoutes();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _nicController.dispose();
    _taxNumberController.dispose();
    _creditLimitController.dispose();
    _creditDaysController.dispose();
    super.dispose();
  }
  
  Future<void> _takePhoto() async {
    try {
      final XFile? photo = await _picker.pickImage(source: ImageSource.camera, imageQuality: 70);
      if (photo != null) {
        setState(() {
          _selectedPhoto = File(photo.path);
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to take photo: $e')));
    }
  }

  Future<void> _fetchRoutes() async {
    final routes = await ApiService().fetchRoutes();
    final cities = await ApiService().fetchCities();
    if (mounted) {
      setState(() {
        _routes = routes;
        _apiCities = cities;
        _cities = cities.map((c) => c.name).toList();
      });
    }
  }

  Future<void> _getLocation() async {
    setState(() => _isFetchingLocation = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Location services are disabled.');
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Location permissions are denied');
        }
      }
      
      if (permission == LocationPermission.deniedForever) {
        throw Exception('Location permissions are permanently denied');
      } 

      Position position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      setState(() {
        _latitude = position.latitude;
        _longitude = position.longitude;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Location Error: $e')));
      }
    } finally {
      setState(() => _isFetchingLocation = false);
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    if (_latitude == null || _longitude == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Coordinates are required to save a customer. Please wait or check location permissions.')),
      );
      return;
    }
    
    setState(() => _isSubmitting = true);

    try {
      final payload = {
        'name': _nameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'email': _emailController.text.trim(),
        'address': _selectedCity != null && _selectedCity!.isNotEmpty
            ? '$_selectedCity, ${_addressController.text.trim()}'
            : _addressController.text.trim(),
        'nic': _nicController.text.trim(),
        'tax_number': _taxNumberController.text.trim(),
        'order_type': _orderType,
        'credit_limit': double.tryParse(_creditLimitController.text) ?? 0.0,
        'credit_days': int.tryParse(_creditDaysController.text) ?? 0,
        'is_active': _isActive,
      };

      if (_selectedRouteId != null) {
        payload['route_id'] = _selectedRouteId!;
      }
      
      if (_latitude != null && _longitude != null) {
        payload['latitude'] = _latitude!;
        payload['longitude'] = _longitude!;
      }

      final success = await ApiService().createCustomer(payload, photoPath: _selectedPhoto?.path);

      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Customer created successfully')),
          );
          Navigator.pop(context);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to create customer')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }
  void _showCitySearchDialog() {
    showDialog(
      context: context,
      builder: (context) {
        String query = '';
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            final filtered = _cities.where((c) => c.toLowerCase().contains(query.toLowerCase())).toList();
            return AlertDialog(
              title: const Text('Search & Select City'),
              content: SizedBox(
                width: double.maxFinite,
                height: 400,
                child: Column(
                  children: [
                    TextField(
                      decoration: const InputDecoration(
                        labelText: 'Search City',
                        prefixIcon: Icon(Icons.search),
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (val) => setStateDialog(() => query = val),
                    ),
                    const SizedBox(height: 10),
                    Expanded(
                      child: ListView.builder(
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          return ListTile(
                            title: Text(filtered[index]),
                            onTap: () {
                              setState(() => _selectedCity = filtered[index]);
                              Navigator.pop(context);
                            },
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Customer'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Photo Area
              Center(
                child: GestureDetector(
                  onTap: _takePhoto,
                  child: Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      shape: BoxShape.circle,
                      image: _selectedPhoto != null 
                        ? DecorationImage(image: FileImage(_selectedPhoto!), fit: BoxFit.cover)
                        : null,
                      border: Border.all(color: Colors.grey[400]!),
                    ),
                    child: _selectedPhoto == null 
                        ? const Icon(Icons.camera_alt, size: 50, color: Colors.grey)
                        : null,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              const Center(child: Text("Tap to take photo", style: TextStyle(color: Colors.grey))),
              const SizedBox(height: 24),
              
              // Location Area
              Card(
                clipBehavior: Clip.antiAlias,
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: Row(
                        children: [
                          const Icon(Icons.gps_fixed, color: Colors.blue),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Location Coordinates *', style: TextStyle(fontWeight: FontWeight.bold)),
                                Text(
                                  _latitude != null ? '${_latitude!.toStringAsFixed(6)}, ${_longitude!.toStringAsFixed(6)}' : 'Not captured',
                                  style: TextStyle(color: _latitude != null ? Colors.green : Colors.grey),
                                ),
                              ],
                            ),
                          ),
                          if (_isFetchingLocation) 
                            const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                        ],
                      ),
                    ),
                    if (_latitude != null && !_isFetchingLocation)
                      SizedBox(
                        height: 200,
                        width: double.infinity,
                        child: FlutterMap(
                          options: MapOptions(
                            initialCenter: LatLng(_latitude!, _longitude!),
                            initialZoom: 15.0,
                          ),
                          children: [
                            TileLayer(
                              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                              userAgentPackageName: 'com.payshia.mobile_pos',
                            ),
                            MarkerLayer(
                              markers: [
                                Marker(
                                  point: LatLng(_latitude!, _longitude!),
                                  width: 40,
                                  height: 40,
                                  child: const Icon(
                                    Icons.location_on,
                                    color: Colors.red,
                                    size: 40,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Customer Name *',
                  prefixIcon: Icon(Icons.person),
                  border: OutlineInputBorder(),
                ),
                validator: (value) =>
                    value == null || value.trim().isEmpty ? 'Please enter customer name' : null,
              ),
              const SizedBox(height: 16),
              
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  prefixIcon: Icon(Icons.phone),
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(
                  labelText: 'Email Address',
                  prefixIcon: Icon(Icons.email),
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),

              InkWell(
                onTap: _showCitySearchDialog,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'City',
                    prefixIcon: Icon(Icons.location_city),
                    border: OutlineInputBorder(),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _selectedCity ?? 'Select City',
                        style: TextStyle(color: _selectedCity == null ? Colors.grey[600] : Colors.black87),
                      ),
                      const Icon(Icons.arrow_drop_down, color: Colors.grey),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _addressController,
                decoration: const InputDecoration(
                  labelText: 'Address',
                  prefixIcon: Icon(Icons.location_on),
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _nicController,
                      decoration: const InputDecoration(
                        labelText: 'NIC Number',
                        prefixIcon: Icon(Icons.badge),
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _taxNumberController,
                      decoration: const InputDecoration(
                        labelText: 'Tax Number (VAT/SVAT)',
                        prefixIcon: Icon(Icons.receipt),
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              DropdownButtonFormField<String>(
                value: _orderType,
                decoration: const InputDecoration(
                  labelText: 'Customer Category',
                  prefixIcon: Icon(Icons.category),
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'External', child: Text('External Customer')),
                  DropdownMenuItem(value: 'Internal', child: Text('Internal (Company)')),
                ],
                onChanged: (val) {
                  if (val != null) setState(() => _orderType = val);
                },
              ),
              const SizedBox(height: 16),

              DropdownButtonFormField<int>(
                value: _selectedRouteId,
                decoration: const InputDecoration(
                  labelText: 'Delivery Route',
                  prefixIcon: Icon(Icons.map_outlined),
                  border: OutlineInputBorder(),
                ),
                items: [
                  const DropdownMenuItem<int>(
                    value: null,
                    child: Text('None'),
                  ),
                  ..._routes.map((route) {
                    return DropdownMenuItem<int>(
                      value: route.id,
                      child: Text(route.name),
                    );
                  }).toList(),
                ],
                onChanged: (val) {
                  setState(() => _selectedRouteId = val);
                },
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _creditLimitController,
                      decoration: const InputDecoration(
                        labelText: 'Credit Limit',
                        prefixIcon: Icon(Icons.attach_money),
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _creditDaysController,
                      decoration: const InputDecoration(
                        labelText: 'Credit Days',
                        prefixIcon: Icon(Icons.calendar_today),
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submitForm,
                icon: _isSubmitting 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.save),
                label: Text(_isSubmitting ? 'Saving...' : 'Save Customer', style: const TextStyle(fontSize: 16)),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
