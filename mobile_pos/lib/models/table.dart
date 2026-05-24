class TableModel {
  final int id;
  final String name;

  TableModel({
    required this.id,
    required this.name,
  });

  factory TableModel.fromJson(Map<String, dynamic> json) {
    return TableModel(
      id: int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name'] ?? 'Unknown Table',
    );
  }
}
