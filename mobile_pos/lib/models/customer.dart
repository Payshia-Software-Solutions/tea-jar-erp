class Customer {
  final int id;
  final String name;
  final String? phone;
  final String? email;
  final String? qrCodeHash;
  final int? routeId;
  final double? latitude;
  final double? longitude;

  Customer({
    required this.id,
    required this.name,
    this.phone,
    this.email,
    this.qrCodeHash,
    this.routeId,
    this.latitude,
    this.longitude,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: int.tryParse(json['id'].toString()) ?? 0,
      name: json['name'] ?? 'Unknown Customer',
      phone: json['phone']?.toString(),
      email: json['email']?.toString(),
      qrCodeHash: json['qr_code_hash']?.toString(),
      routeId: json['route_id'] != null ? int.tryParse(json['route_id'].toString()) : null,
      latitude: json['latitude'] != null ? double.tryParse(json['latitude'].toString()) : null,
      longitude: json['longitude'] != null ? double.tryParse(json['longitude'].toString()) : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'qr_code_hash': qrCodeHash,
      'route_id': routeId,
      'latitude': latitude,
      'longitude': longitude,
    };
  }
}
