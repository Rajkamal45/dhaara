class OrderItem {
  final String id;
  final String orderId;
  final String productId;
  final String productName;
  final String? imageUrl;
  final int quantity;
  final double price;
  final int pricePerQuantity;
  final double total;
  final String unit;
  final DateTime? createdAt;

  OrderItem({
    required this.id,
    required this.orderId,
    required this.productId,
    required this.productName,
    this.imageUrl,
    required this.quantity,
    required this.price,
    this.pricePerQuantity = 1,
    required this.total,
    required this.unit,
    this.createdAt,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    // Try to get product info from nested product object or direct fields
    final product = json['product'] as Map<String, dynamic>?;

    return OrderItem(
      id: json['id']?.toString() ?? '',
      orderId: json['order_id']?.toString() ?? '',
      productId: json['product_id']?.toString() ?? '',
      productName: json['product_name']?.toString() ??
                   product?['name']?.toString() ??
                   'Unknown Product',
      imageUrl: json['image_url']?.toString() ??
                product?['image_url']?.toString(),
      quantity: _toInt(json['quantity']),
      price: _toDouble(json['price'] ?? json['unit_price']),
      pricePerQuantity: _toInt(json['price_per_quantity'] ?? 1),
      total: _toDouble(json['total'] ?? json['total_price']),
      unit: json['unit']?.toString() ?? 'unit',
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
    );
  }

  static int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  static double _toDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  double get unitPrice => pricePerQuantity > 0 ? price / pricePerQuantity : price;
  double get totalPrice => total;
}

enum OrderStatus {
  pending,
  confirmed,
  processing,
  shipped,
  outForDelivery,
  delivered,
  cancelled;

  static OrderStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return OrderStatus.pending;
      case 'confirmed':
        return OrderStatus.confirmed;
      case 'processing':
        return OrderStatus.processing;
      case 'shipped':
        return OrderStatus.shipped;
      case 'out_for_delivery':
        return OrderStatus.outForDelivery;
      case 'delivered':
        return OrderStatus.delivered;
      case 'cancelled':
        return OrderStatus.cancelled;
      default:
        return OrderStatus.pending;
    }
  }

  String get displayName {
    switch (this) {
      case OrderStatus.pending:
        return 'Pending';
      case OrderStatus.confirmed:
        return 'Confirmed';
      case OrderStatus.processing:
        return 'Processing';
      case OrderStatus.shipped:
        return 'Shipped';
      case OrderStatus.outForDelivery:
        return 'Out for Delivery';
      case OrderStatus.delivered:
        return 'Delivered';
      case OrderStatus.cancelled:
        return 'Cancelled';
    }
  }

  String get description {
    switch (this) {
      case OrderStatus.pending:
        return 'Your order is awaiting confirmation';
      case OrderStatus.confirmed:
        return 'Your order has been confirmed';
      case OrderStatus.processing:
        return 'Your order is being prepared';
      case OrderStatus.shipped:
        return 'Your order has been shipped';
      case OrderStatus.outForDelivery:
        return 'Your order is out for delivery';
      case OrderStatus.delivered:
        return 'Your order has been delivered';
      case OrderStatus.cancelled:
        return 'Your order has been cancelled';
    }
  }

  bool get canCancel {
    return this == OrderStatus.pending || this == OrderStatus.confirmed;
  }
}

class Order {
  final String id;
  final String? orderNumber;
  final String userId;
  final OrderStatus status;
  final double subtotal;
  final double taxAmount;
  final double deliveryFee;
  final double discountAmount;
  final double total;
  final String deliveryAddress;
  final double? deliveryLatitude;
  final double? deliveryLongitude;
  final String? notes;
  final String? regionId;
  final String paymentStatus;
  final String? paymentMethod;
  final List<OrderItem> items;
  final DateTime createdAt;
  final DateTime updatedAt;

  Order({
    required this.id,
    this.orderNumber,
    required this.userId,
    required this.status,
    required this.subtotal,
    this.taxAmount = 0,
    required this.deliveryFee,
    this.discountAmount = 0,
    required this.total,
    required this.deliveryAddress,
    this.deliveryLatitude,
    this.deliveryLongitude,
    this.notes,
    this.regionId,
    this.paymentStatus = 'pending',
    this.paymentMethod,
    required this.items,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    final itemsList = json['order_items'] as List<dynamic>? ?? [];

    // Parse delivery_address - can be JSON object or string
    String deliveryAddressStr = '';
    double? deliveryLat;
    double? deliveryLng;

    final deliveryAddr = json['delivery_address'];
    if (deliveryAddr is Map<String, dynamic>) {
      deliveryAddressStr = deliveryAddr['address'] ?? '';
      deliveryLat = deliveryAddr['latitude']?.toDouble();
      deliveryLng = deliveryAddr['longitude']?.toDouble();
    } else if (deliveryAddr is String) {
      deliveryAddressStr = deliveryAddr;
    }

    return Order(
      id: json['id'] ?? '',
      orderNumber: json['order_number'],
      userId: json['user_id'] ?? '',
      status: OrderStatus.fromString(json['status'] ?? 'pending'),
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      taxAmount: (json['tax_amount'] ?? 0).toDouble(),
      deliveryFee: (json['delivery_fee'] ?? 0).toDouble(),
      discountAmount: (json['discount_amount'] ?? 0).toDouble(),
      total: (json['total_amount'] ?? json['total'] ?? 0).toDouble(),
      deliveryAddress: deliveryAddressStr,
      deliveryLatitude: deliveryLat,
      deliveryLongitude: deliveryLng,
      notes: json['notes'],
      regionId: json['region_id'],
      paymentStatus: json['payment_status'] ?? 'pending',
      paymentMethod: json['payment_method'],
      items: itemsList.map((item) => OrderItem.fromJson(item)).toList(),
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : DateTime.now(),
    );
  }

  String get shortId {
    if (orderNumber != null && orderNumber!.isNotEmpty) {
      return orderNumber!;
    }
    return id.length > 8 ? id.substring(0, 8).toUpperCase() : id.toUpperCase();
  }

  int get totalItems => items.fold(0, (sum, item) => sum + item.quantity);
}
