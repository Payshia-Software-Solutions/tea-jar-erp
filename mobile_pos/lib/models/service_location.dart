class ServiceLocation {
  final int id;
  final String name;
  final String locationType;
  final bool allowDineIn;
  final bool allowTakeAway;
  final bool allowRetail;

  ServiceLocation({
    required this.id,
    required this.name,
    required this.locationType,
    this.allowDineIn = true,
    this.allowTakeAway = true,
    this.allowRetail = true,
  });

  factory ServiceLocation.fromJson(Map<String, dynamic> json) {
    return ServiceLocation(
      id: int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name'] ?? 'Unknown Location',
      locationType: json['location_type'] ?? 'service',
      allowDineIn: (json['allow_dine_in']?.toString() == '1' || json['allow_dine_in'] == true),
      allowTakeAway: (json['allow_take_away']?.toString() == '1' || json['allow_take_away'] == true),
      allowRetail: (json['allow_retail']?.toString() == '1' || json['allow_retail'] == true),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'location_type': locationType,
      'allow_dine_in': allowDineIn ? 1 : 0,
      'allow_take_away': allowTakeAway ? 1 : 0,
      'allow_retail': allowRetail ? 1 : 0,
    };
  }
}
