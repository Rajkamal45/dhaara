import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/product.dart';

class ProductService {
  final SupabaseClient _supabase = Supabase.instance.client;

  Future<List<Product>> getProducts({
    String? regionId,
    String? category,
    bool? featuredOnly,
    String? searchQuery,
    int limit = 20,
    int offset = 0,
  }) async {
    var query = _supabase
        .from('products')
        .select('*, region:regions(name)')
        .eq('is_active', true);

    if (regionId != null) {
      query = query.eq('region_id', regionId);
    }

    if (category != null) {
      query = query.eq('category', category);
    }

    if (featuredOnly == true) {
      query = query.eq('is_featured', true);
    }

    if (searchQuery != null && searchQuery.isNotEmpty) {
      query = query.ilike('name', '%$searchQuery%');
    }

    final response = await query
        .order('created_at', ascending: false)
        .range(offset, offset + limit - 1);

    return (response as List).map((json) => Product.fromJson(json)).toList();
  }

  Future<Product?> getProductById(String id) async {
    try {
      final response = await _supabase
          .from('products')
          .select('*, region:regions(name)')
          .eq('id', id)
          .single();

      return Product.fromJson(response);
    } catch (e) {
      return null;
    }
  }

  Future<List<String>> getCategories({String? regionId}) async {
    var query = _supabase
        .from('products')
        .select('category')
        .eq('is_active', true)
        .not('category', 'is', null);

    if (regionId != null) {
      query = query.eq('region_id', regionId);
    }

    final response = await query;
    final categories = (response as List)
        .map((e) => e['category'] as String?)
        .where((c) => c != null)
        .cast<String>()
        .toSet()
        .toList();

    return categories;
  }

  Future<List<Product>> getFeaturedProducts({String? regionId}) async {
    return getProducts(regionId: regionId, featuredOnly: true, limit: 10);
  }

  Future<List<Product>> searchProducts(String query, {String? regionId}) async {
    return getProducts(searchQuery: query, regionId: regionId);
  }
}
