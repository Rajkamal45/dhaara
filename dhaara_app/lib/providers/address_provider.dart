import 'package:flutter/material.dart';
import '../models/saved_address.dart';
import '../services/address_service.dart';

class AddressProvider extends ChangeNotifier {
  final AddressService _addressService = AddressService();

  List<SavedAddress> _addresses = [];
  SavedAddress? _defaultAddress;
  bool _isLoading = false;
  String? _error;

  List<SavedAddress> get addresses => _addresses;
  SavedAddress? get defaultAddress => _defaultAddress;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasAddresses => _addresses.isNotEmpty;

  Future<void> loadAddresses(String userId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _addresses = await _addressService.getAddresses(userId);
      if (_addresses.isEmpty) {
        _defaultAddress = null;
      } else {
        _defaultAddress = _addresses.firstWhere(
          (a) => a.isDefault,
          orElse: () => _addresses.first,
        );
      }
    } catch (e) {
      _error = 'Failed to load addresses: $e';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> addAddress({
    required String userId,
    required String label,
    required String streetAddress,
    String? landmark,
    required String city,
    required String state,
    required String postalCode,
    required double latitude,
    required double longitude,
    bool isDefault = false,
  }) async {
    _error = null;

    // If this is the first address, make it default
    final shouldBeDefault = isDefault || _addresses.isEmpty;

    final newAddress = await _addressService.addAddress(
      userId: userId,
      label: label,
      streetAddress: streetAddress,
      landmark: landmark,
      city: city,
      state: state,
      postalCode: postalCode,
      latitude: latitude,
      longitude: longitude,
      isDefault: shouldBeDefault,
    );

    if (newAddress != null) {
      await loadAddresses(userId);
      return true;
    }

    _error = 'Failed to add address';
    notifyListeners();
    return false;
  }

  Future<bool> updateAddress({
    required String addressId,
    required String userId,
    String? label,
    String? streetAddress,
    String? landmark,
    String? city,
    String? state,
    String? postalCode,
    double? latitude,
    double? longitude,
    bool? isDefault,
  }) async {
    _error = null;

    final updatedAddress = await _addressService.updateAddress(
      addressId: addressId,
      userId: userId,
      label: label,
      streetAddress: streetAddress,
      landmark: landmark,
      city: city,
      state: state,
      postalCode: postalCode,
      latitude: latitude,
      longitude: longitude,
      isDefault: isDefault,
    );

    if (updatedAddress != null) {
      await loadAddresses(userId);
      return true;
    }

    _error = 'Failed to update address';
    notifyListeners();
    return false;
  }

  Future<bool> deleteAddress(String addressId, String userId) async {
    _error = null;

    final success = await _addressService.deleteAddress(addressId, userId);

    if (success) {
      await loadAddresses(userId);
      return true;
    }

    _error = 'Failed to delete address';
    notifyListeners();
    return false;
  }

  Future<bool> setDefaultAddress(String addressId, String userId) async {
    _error = null;

    final success = await _addressService.setDefaultAddress(addressId, userId);

    if (success) {
      await loadAddresses(userId);
      return true;
    }

    _error = 'Failed to set default address';
    notifyListeners();
    return false;
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
