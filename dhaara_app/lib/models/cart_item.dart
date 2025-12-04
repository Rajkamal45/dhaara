class CartItem {
  final String id;
  final String name;
  final double price;
  final int pricePerQuantity;
  final String unit;
  final String? imageUrl;
  int quantity;
  final String regionId;

  CartItem({
    required this.id,
    required this.name,
    required this.price,
    this.pricePerQuantity = 1,
    required this.unit,
    this.imageUrl,
    required this.quantity,
    required this.regionId,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      id: json['id'],
      name: json['name'],
      price: (json['price'] ?? 0).toDouble(),
      pricePerQuantity: (json['price_per_quantity'] ?? 1).toInt(),
      unit: json['unit'] ?? 'unit',
      imageUrl: json['image_url'],
      quantity: (json['quantity'] ?? 1).toInt(),
      regionId: json['region_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'price': price,
      'price_per_quantity': pricePerQuantity,
      'unit': unit,
      'image_url': imageUrl,
      'quantity': quantity,
      'region_id': regionId,
    };
  }

  double get itemTotal => (price / pricePerQuantity) * quantity;

  CartItem copyWith({int? quantity}) {
    return CartItem(
      id: id,
      name: name,
      price: price,
      pricePerQuantity: pricePerQuantity,
      unit: unit,
      imageUrl: imageUrl,
      quantity: quantity ?? this.quantity,
      regionId: regionId,
    );
  }
}
