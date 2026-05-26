class Tax {
  final int id;
  final String name;
  final String code;
  final double ratePercent;
  final String applyOn;
  final int sortOrder;
  final bool isActive;

  Tax({
    required this.id,
    required this.name,
    required this.code,
    required this.ratePercent,
    required this.applyOn,
    required this.sortOrder,
    required this.isActive,
  });

  factory Tax.fromJson(Map<String, dynamic> json) {
    return Tax(
      id: int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name']?.toString() ?? '',
      code: json['code']?.toString() ?? '',
      ratePercent: double.tryParse(json['rate_percent']?.toString() ?? '0') ?? 0.0,
      applyOn: json['apply_on']?.toString() ?? 'base',
      sortOrder: int.tryParse(json['sort_order']?.toString() ?? '0') ?? 0,
      isActive: json['is_active'] == 1 || json['is_active'] == true || json['is_active'] == '1',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'code': code,
      'rate_percent': ratePercent,
      'apply_on': applyOn,
      'sort_order': sortOrder,
      'is_active': isActive ? 1 : 0,
    };
  }
}
