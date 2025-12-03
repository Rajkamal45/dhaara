class Region {
  final String id;
  final String name;
  final String code;
  final bool isActive;
  final double minOrderAmount;
  final double deliveryFee;
  final double? freeDeliveryAbove;

  Region({
    required this.id,
    required this.name,
    required this.code,
    required this.isActive,
    required this.minOrderAmount,
    required this.deliveryFee,
    this.freeDeliveryAbove,
  });

  factory Region.fromJson(Map<String, dynamic> json) {
    return Region(
      id: json['id'],
      name: json['name'],
      code: json['code'],
      isActive: json['is_active'] ?? true,
      minOrderAmount: (json['min_order_amount'] ?? 0).toDouble(),
      deliveryFee: (json['delivery_fee'] ?? 0).toDouble(),
      freeDeliveryAbove: json['free_delivery_above']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'code': code,
      'is_active': isActive,
      'min_order_amount': minOrderAmount,
      'delivery_fee': deliveryFee,
      'free_delivery_above': freeDeliveryAbove,
    };
  }
}
