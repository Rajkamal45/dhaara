import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/saved_address.dart';

class AddressService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // Table name matches web app
  static const String _tableName = 'saved_addresses';

  Future<List<SavedAddress>> getAddresses(String userId) async {
    try {
      final response = await _supabase
          .from(_tableName)
          .select()
          .eq('user_id', userId)
          .order('is_default', ascending: false)
          .order('created_at', ascending: false);

      return (response as List)
          .map((data) => SavedAddress.fromJson(data))
          .toList();
    } on PostgrestException catch (e) {
      print('Database error fetching addresses: ${e.message}');
      print('Error code: ${e.code}');
      return [];
    } catch (e) {
      print('Error fetching addresses: $e');
      return [];
    }
  }

  Future<SavedAddress?> getDefaultAddress(String userId) async {
    try {
      final response = await _supabase
          .from(_tableName)
          .select()
          .eq('user_id', userId)
          .eq('is_default', true)
          .maybeSingle();

      if (response != null) {
        return SavedAddress.fromJson(response);
      }

      // If no default, get the first address
      final firstResponse = await _supabase
          .from(_tableName)
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(1)
          .maybeSingle();

      if (firstResponse != null) {
        return SavedAddress.fromJson(firstResponse);
      }

      return null;
    } on PostgrestException catch (e) {
      print('Database error fetching default address: ${e.message}');
      return null;
    } catch (e) {
      print('Error fetching default address: $e');
      return null;
    }
  }

  Future<SavedAddress?> addAddress({
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
    try {
      // If setting as default, unset other defaults first
      if (isDefault) {
        await _supabase
            .from(_tableName)
            .update({'is_default': false})
            .eq('user_id', userId);
      }

      // Field names match web app's saved_addresses table
      final insertData = {
        'user_id': userId,
        'label': label,
        'address': streetAddress,  // 'address' not 'street_address'
        'city': city,
        'state': state,
        'pincode': postalCode,     // 'pincode' not 'postal_code'
        'lat': latitude,           // 'lat' not 'latitude'
        'lng': longitude,          // 'lng' not 'longitude'
        'is_default': isDefault,
      };

      // Only add phone if available (web app has this field)
      if (landmark != null && landmark.isNotEmpty) {
        insertData['phone'] = landmark; // Using landmark as phone for now
      }

      print('Adding address with data: $insertData');

      final response = await _supabase
          .from(_tableName)
          .insert(insertData)
          .select()
          .single();

      print('Address added successfully: ${response['id']}');
      return SavedAddress.fromJson(response);
    } on PostgrestException catch (e) {
      print('Database error adding address: ${e.message}');
      print('Error code: ${e.code}');
      print('Details: ${e.details}');
      print('Hint: ${e.hint}');
      return null;
    } catch (e) {
      print('Error adding address: $e');
      return null;
    }
  }

  Future<SavedAddress?> updateAddress({
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
    try {
      // If setting as default, unset other defaults first
      if (isDefault == true) {
        await _supabase
            .from(_tableName)
            .update({'is_default': false})
            .eq('user_id', userId);
      }

      final updateData = <String, dynamic>{};
      if (label != null) updateData['label'] = label;
      if (streetAddress != null) updateData['address'] = streetAddress;
      if (landmark != null) updateData['phone'] = landmark;
      if (city != null) updateData['city'] = city;
      if (state != null) updateData['state'] = state;
      if (postalCode != null) updateData['pincode'] = postalCode;
      if (latitude != null) updateData['lat'] = latitude;
      if (longitude != null) updateData['lng'] = longitude;
      if (isDefault != null) updateData['is_default'] = isDefault;

      final response = await _supabase
          .from(_tableName)
          .update(updateData)
          .eq('id', addressId)
          .eq('user_id', userId)
          .select()
          .single();

      return SavedAddress.fromJson(response);
    } on PostgrestException catch (e) {
      print('Database error updating address: ${e.message}');
      print('Error code: ${e.code}');
      return null;
    } catch (e) {
      print('Error updating address: $e');
      return null;
    }
  }

  Future<bool> deleteAddress(String addressId, String userId) async {
    try {
      await _supabase
          .from(_tableName)
          .delete()
          .eq('id', addressId)
          .eq('user_id', userId);
      return true;
    } on PostgrestException catch (e) {
      print('Database error deleting address: ${e.message}');
      return false;
    } catch (e) {
      print('Error deleting address: $e');
      return false;
    }
  }

  Future<bool> setDefaultAddress(String addressId, String userId) async {
    try {
      // Unset all defaults
      await _supabase
          .from(_tableName)
          .update({'is_default': false})
          .eq('user_id', userId);

      // Set new default
      await _supabase
          .from(_tableName)
          .update({'is_default': true})
          .eq('id', addressId)
          .eq('user_id', userId);

      return true;
    } on PostgrestException catch (e) {
      print('Database error setting default address: ${e.message}');
      return false;
    } catch (e) {
      print('Error setting default address: $e');
      return false;
    }
  }
}
