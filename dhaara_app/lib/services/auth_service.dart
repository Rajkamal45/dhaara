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
  }) async {
    final user = currentUser;
    if (user == null) return null;

    final updates = <String, dynamic>{};
    if (fullName != null) updates['full_name'] = fullName;
    if (phone != null) updates['phone'] = phone;
    if (businessName != null) updates['business_name'] = businessName;
    if (businessType != null) updates['business_type'] = businessType;
    if (gstin != null) updates['gstin'] = gstin;
    if (addressLine1 != null) updates['address_line1'] = addressLine1;
    if (addressLine2 != null) updates['address_line2'] = addressLine2;
    if (city != null) updates['city'] = city;
    if (state != null) updates['state'] = state;
    if (postalCode != null) updates['postal_code'] = postalCode;
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
      rethrow;
    }
  }
}
