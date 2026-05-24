class Item {
  final int id;
  final String name;
  final double price;
  final double stockLevel;
  final String? imageUrl;
  final String? sku;
  final String? itemType;

  Item({
    required this.id,
    required this.name,
    required this.price,
    required this.stockLevel,
    this.imageUrl,
    this.sku,
    this.itemType,
  });

  factory Item.fromJson(Map<String, dynamic> json) {
    String? rawImage = json['image_filename'] ?? json['image_url'] ?? json['image'] ?? json['photo'] ?? json['picture'];
    
    // Normalize relative URLs to point to the server
    if (rawImage != null && rawImage.isNotEmpty && !rawImage.startsWith('http')) {
      if (rawImage.startsWith('/')) {
        rawImage = 'https://server-kdu-service.payshia.com$rawImage';
      } else {
        rawImage = 'https://server-kdu-service.payshia.com/$rawImage';
      }
    }

    return Item(
      id: int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['part_name'] ?? json['name'] ?? 'Unnamed Product',
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      stockLevel: double.tryParse(json['stock_quantity']?.toString() ?? json['stock_level']?.toString() ?? '0') ?? 0.0,
      imageUrl: (rawImage != null && rawImage.isNotEmpty) ? rawImage : null,
      sku: json['sku']?.toString(),
      itemType: json['item_type']?.toString(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'price': price,
      'stock_level': stockLevel,
      'image_url': imageUrl,
    };
  }
}
