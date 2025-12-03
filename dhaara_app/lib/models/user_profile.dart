import 'region.dart';

class UserProfile {
  final String id;
  final String email;
  final String? phone;
  final String? fullName;
  final String? avatarUrl;
  final String role;
  final String? regionId;
  final Region? region;
  final String? businessName;
  final String? businessType;
  final String? gstin;
  final String? addressLine1;
  final String? addressLine2;
  final String? city;
  final String? state;
  final String? postalCode;
  final String country;
  final double? latitude;
  final double? longitude;
  final String kycStatus;
  final bool isActive;

  UserProfile({
    required this.id,
    required this.email,
    this.phone,
    this.fullName,
    this.avatarUrl,
    required this.role,
    this.regionId,
    this.region,
    this.businessName,
    this.businessType,
    this.gstin,
    this.addressLine1,
    this.addressLine2,
    this.city,
    this.state,
    this.postalCode,
    required this.country,
    this.latitude,
    this.longitude,
    required this.kycStatus,
    required this.isActive,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'],
      email: json['email'],
      phone: json['phone'],
      fullName: json['full_name'],
      avatarUrl: json['avatar_url'],
      role: json['role'] ?? 'user',
      regionId: json['region_id'],
      region: json['region'] != null ? Region.fromJson(json['region']) : null,
      businessName: json['business_name'],
      businessType: json['business_type'],
      gstin: json['gstin'],
      addressLine1: json['address_line1'],
      addressLine2: json['address_line2'],
      city: json['city'],
      state: json['state'],
      postalCode: json['postal_code'],
      country: json['country'] ?? 'India',
      latitude: json['latitude']?.toDouble(),
      longitude: json['longitude']?.toDouble(),
      kycStatus: json['kyc_status'] ?? 'pending',
      isActive: json['is_active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'phone': phone,
      'full_name': fullName,
      'avatar_url': avatarUrl,
      'role': role,
      'region_id': regionId,
      'business_name': businessName,
      'business_type': businessType,
      'gstin': gstin,
      'address_line1': addressLine1,
      'address_line2': addressLine2,
      'city': city,
      'state': state,
      'postal_code': postalCode,
      'country': country,
      'latitude': latitude,
      'longitude': longitude,
      'kyc_status': kycStatus,
      'is_active': isActive,
    };
  }

  String get displayName => fullName ?? businessName ?? email;

  String get fullAddress {
    final parts = <String>[];
    if (addressLine1 != null) parts.add(addressLine1!);
    if (addressLine2 != null) parts.add(addressLine2!);
    if (city != null) parts.add(city!);
    if (state != null) parts.add(state!);
    if (postalCode != null) parts.add(postalCode!);
    return parts.join(', ');
  }

  bool get isKycApproved => kycStatus == 'approved';
}
