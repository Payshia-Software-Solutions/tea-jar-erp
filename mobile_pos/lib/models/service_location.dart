class ServiceLocation {
  final int id;
  final String name;
  final String locationType;
  final bool allowDineIn;
  final bool allowTakeAway;
  final bool allowRetail;
  final bool allowServiceCharge;
  final double serviceChargeRate;
  final String? allowedTaxesJson;

  ServiceLocation({
    required this.id,
    required this.name,
    required this.locationType,
    this.allowDineIn = true,
    this.allowTakeAway = true,
    this.allowRetail = true,
    this.allowServiceCharge = false,
    this.serviceChargeRate = 0.0,
    this.allowedTaxesJson,
  });

  factory ServiceLocation.fromJson(Map<String, dynamic> json) {
    return ServiceLocation(
      id: int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name'] ?? 'Unknown Location',
      locationType: json['location_type'] ?? 'service',
      allowDineIn: (json['allow_dine_in']?.toString() == '1' || json['allow_dine_in'] == true),
      allowTakeAway: (json['allow_take_away']?.toString() == '1' || json['allow_take_away'] == true),
      allowRetail: (json['allow_retail']?.toString() == '1' || json['allow_retail'] == true),
      allowServiceCharge: (json['allow_service_charge']?.toString() == '1' || json['allow_service_charge'] == true),
      serviceChargeRate: double.tryParse(json['service_charge_rate']?.toString() ?? '0') ?? 0.0,
      allowedTaxesJson: json['allowed_taxes_json']?.toString(),
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
      'allow_service_charge': allowServiceCharge ? 1 : 0,
      'service_charge_rate': serviceChargeRate,
      'allowed_taxes_json': allowedTaxesJson,
    };
  }
}
