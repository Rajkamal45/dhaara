import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user_profile.dart';

class AuthService {
  final SupabaseClient _supabase = Supabase.instance.client;

  User? get currentUser => _supabase.auth.currentUser;

  Stream<AuthState> get authStateChanges => _supabase.auth.onAuthStateChange;

  Future<AuthResponse> signInWithEmail({
    required String email,
    required String password,
  }) async {
    return await _supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  Future<AuthResponse> signUpWithEmail({
    required String email,
    required String password,
    String? phone,
    String? fullName,
    String? businessName,
  }) async {
    final response = await _supabase.auth.signUp(
      email: email,
      password: password,
      data: {
        'phone': phone,
        'full_name': fullName,
        'business_name': businessName,
      },
    );
    return response;
  }

  Future<void> signOut() async {
    await _supabase.auth.signOut();
  }

  Future<void> resetPassword(String email) async {
    await _supabase.auth.resetPasswordForEmail(email);
  }

  Future<UserProfile?> getUserProfile() async {
    final user = currentUser;
    if (user == null) return null;

    try {
      final response = await _supabase
          .from('profiles')
          .select('*, region:regions(*)')
          .eq('id', user.id)
          .single();

      return UserProfile.fromJson(response);
    } catch (e) {
      return null;
    }
  }

  Future<UserProfile?> updateUserProfile({
    String? fullName,
    String? phone,
    String? businessName,
    String? businessType,
    String? gstin,
    String? addressLine1,
    String? addressLine2,
    String? city,
    String? state,
    String? postalCode,
    double? latitude,
    double? longitude,
  }) async {
    final user = currentUser;
    if (user == null) return null;

    final updates = <String, dynamic>{};

    // Only add non-null and non-empty values to updates
    if (fullName != null && fullName.isNotEmpty) {
      updates['full_name'] = fullName;
    }
    if (phone != null && phone.isNotEmpty) {
      updates['phone'] = phone;
    }
    if (businessName != null && businessName.isNotEmpty) {
      updates['business_name'] = businessName;
    }
    if (businessType != null && businessType.isNotEmpty) {
      updates['business_type'] = businessType;
    }
    if (gstin != null) {
      // GSTIN can be empty (to clear it)
      updates['gstin'] = gstin.isEmpty ? null : gstin;
    }
    if (addressLine1 != null && addressLine1.isNotEmpty) {
      updates['address_line1'] = addressLine1;
    }
    if (addressLine2 != null) {
      // Address line 2 is optional, can be empty
      updates['address_line2'] = addressLine2.isEmpty ? null : addressLine2;
    }
    if (city != null && city.isNotEmpty) {
      updates['city'] = city;
    }
    if (state != null && state.isNotEmpty) {
      updates['state'] = state;
    }
    if (postalCode != null && postalCode.isNotEmpty) {
      updates['postal_code'] = postalCode;
    }
    if (latitude != null) {
      updates['latitude'] = latitude;
    }
    if (longitude != null) {
      updates['longitude'] = longitude;
    }

    // Only proceed if there are actual updates
    if (updates.isEmpty) {
      // No changes to save, return current profile
      return await getUserProfile();
    }

    updates['updated_at'] = DateTime.now().toIso8601String();

    try {
      final response = await _supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
          .select('*, region:regions(*)')
          .single();

      return UserProfile.fromJson(response);
    } catch (e) {
      print('Error updating profile: $e');
      rethrow;
    }
  }
}
