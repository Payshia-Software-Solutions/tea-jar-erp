class Steward {
  final int id;
  final String name;

  Steward({
    required this.id,
    required this.name,
  });

  factory Steward.fromJson(Map<String, dynamic> json) {
    return Steward(
      id: int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name'] ?? 'Unknown Steward',
    );
  }
}
