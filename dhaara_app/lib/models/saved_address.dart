class SavedAddress {
  final String id;
  final String userId;
  final String label;
  final String streetAddress;  // Maps to 'address' in DB
  final String? phone;         // Maps to 'phone' in DB (web uses this instead of landmark)
  final String city;
  final String state;
  final String postalCode;     // Maps to 'pincode' in DB
  final double latitude;       // Maps to 'lat' in DB
  final double longitude;      // Maps to 'lng' in DB
  final bool isDefault;
  final DateTime createdAt;

  SavedAddress({
    required this.id,
    required this.userId,
    required this.label,
    required this.streetAddress,
    this.phone,
    required this.city,
    required this.state,
    required this.postalCode,
    required this.latitude,
    required this.longitude,
    this.isDefault = false,
    required this.createdAt,
  });

  // Alias for backward compatibility
  String? get landmark => phone;

  factory SavedAddress.fromJson(Map<String, dynamic> json) {
    return SavedAddress(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      label: json['label'] ?? 'Home',
      // Support both field names for compatibility
      streetAddress: json['address'] ?? json['street_address'] ?? '',
      phone: json['phone'],
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      // Support both field names
      postalCode: json['pincode'] ?? json['postal_code'] ?? '',
      // Support both field names
      latitude: (json['lat'] ?? json['latitude'] ?? 0).toDouble(),
      longitude: (json['lng'] ?? json['longitude'] ?? 0).toDouble(),
      isDefault: json['is_default'] ?? false,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'label': label,
      'address': streetAddress,
      'phone': phone,
      'city': city,
      'state': state,
      'pincode': postalCode,
      'lat': latitude,
      'lng': longitude,
      'is_default': isDefault,
    };
  }

  String get fullAddress {
    final parts = <String>[streetAddress];
    parts.add(city);
    if (state.isNotEmpty) parts.add(state);
    parts.add(postalCode);
    return parts.join(', ');
  }

  String get shortAddress {
    return '$streetAddress, $city';
  }

  SavedAddress copyWith({
    String? label,
    String? streetAddress,
    String? phone,
    String? city,
    String? state,
    String? postalCode,
    double? latitude,
    double? longitude,
    bool? isDefault,
  }) {
    return SavedAddress(
      id: id,
      userId: userId,
      label: label ?? this.label,
      streetAddress: streetAddress ?? this.streetAddress,
      phone: phone ?? this.phone,
      city: city ?? this.city,
      state: state ?? this.state,
      postalCode: postalCode ?? this.postalCode,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      isDefault: isDefault ?? this.isDefault,
      createdAt: createdAt,
    );
  }
}
