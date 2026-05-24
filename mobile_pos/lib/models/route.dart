class DeliveryRoute {
  final int id;
  final String name;

  DeliveryRoute({
    required this.id,
    required this.name,
  });

  factory DeliveryRoute.fromJson(Map<String, dynamic> json) {
    return DeliveryRoute(
      id: int.tryParse(json['id'].toString()) ?? 0,
      name: json['name'] ?? 'Unknown',
    );
  }
}
