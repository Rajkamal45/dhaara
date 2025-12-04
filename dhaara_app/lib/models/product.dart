class Product {
  final String id;
  final String name;
  final String? description;
  final String? sku;
  final double price;
  final double? mrp;
  final int pricePerQuantity;
  final String unit;
  final String? imageUrl;
  final List<String>? galleryUrls;
  final int stockQuantity;
  final int? minOrderQuantity;
  final String? category;
  final String regionId;
  final String? regionName;
  final bool isActive;
  final bool isFeatured;

  Product({
    required this.id,
    required this.name,
    this.description,
    this.sku,
    required this.price,
    this.mrp,
    this.pricePerQuantity = 1,
    required this.unit,
    this.imageUrl,
    this.galleryUrls,
    required this.stockQuantity,
    this.minOrderQuantity,
    this.category,
    required this.regionId,
    this.regionName,
    required this.isActive,
    this.isFeatured = false,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      sku: json['sku'],
      price: (json['price'] ?? json['base_price'] ?? 0).toDouble(),
      mrp: json['mrp']?.toDouble(),
      pricePerQuantity: (json['price_per_quantity'] ?? 1).toInt(),
      unit: json['unit'] ?? 'unit',
      imageUrl: json['image_url'],
      galleryUrls: json['gallery_urls'] != null
          ? List<String>.from(json['gallery_urls'])
          : null,
      stockQuantity: (json['stock_quantity'] ?? 0).toInt(),
      minOrderQuantity: json['min_order_quantity']?.toInt(),
      category: json['category'],
      regionId: json['region_id'],
      regionName: json['region']?['name'],
      isActive: json['is_active'] ?? true,
      isFeatured: json['is_featured'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'sku': sku,
      'price': price,
      'mrp': mrp,
      'price_per_quantity': pricePerQuantity,
      'unit': unit,
      'image_url': imageUrl,
      'gallery_urls': galleryUrls,
      'stock_quantity': stockQuantity,
      'min_order_quantity': minOrderQuantity,
      'category': category,
      'region_id': regionId,
      'is_active': isActive,
      'is_featured': isFeatured,
    };
  }

  bool get isOutOfStock => stockQuantity <= 0;

  int get discount {
    if (mrp != null && mrp! > price) {
      return ((mrp! - price) / mrp! * 100).round();
    }
    return 0;
  }

  String get displayPrice {
    if (pricePerQuantity > 1) {
      return 'Rs. ${price.toStringAsFixed(0)}/$pricePerQuantity $unit';
    }
    return 'Rs. ${price.toStringAsFixed(0)}/$unit';
  }
}
