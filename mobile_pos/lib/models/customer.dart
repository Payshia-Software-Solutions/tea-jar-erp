class Customer {
  final int id;
  final String name;
  final String? phone;
  final String? email;

  Customer({
    required this.id,
    required this.name,
    this.phone,
    this.email,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: int.tryParse(json['id'].toString()) ?? 0,
      name: json['name'] ?? 'Unknown Customer',
      phone: json['phone']?.toString(),
      email: json['email']?.toString(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
    };
  }
}
