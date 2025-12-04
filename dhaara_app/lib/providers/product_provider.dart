import 'package:flutter/material.dart';
import '../models/product.dart';
import '../services/product_service.dart';

class ProductProvider extends ChangeNotifier {
  final ProductService _productService = ProductService();

  List<Product> _products = [];
  List<Product> _featuredProducts = [];
  List<String> _categories = [];
  bool _isLoading = false;
  String? _error;
  String? _currentCategory;
  String? _searchQuery;
  String? _regionId;

  List<Product> get products => _products;
  List<Product> get featuredProducts => _featuredProducts;
  List<String> get categories => _categories;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get currentCategory => _currentCategory;

  void setRegion(String? regionId) {
    if (_regionId != regionId) {
      _regionId = regionId;
      loadProducts();
    }
  }

  Future<void> loadProducts({bool refresh = false}) async {
    if (_isLoading && !refresh) return;

    _isLoading = true;
    _error = null;
    if (refresh) {
      _products = [];
    }
    notifyListeners();

    try {
      _products = await _productService.getProducts(
        regionId: _regionId,
        category: _currentCategory,
        searchQuery: _searchQuery,
      );
      _error = null;
    } catch (e) {
      _error = 'Failed to load products: ${e.toString()}';
      print('ProductProvider error: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadFeaturedProducts() async {
    try {
      _featuredProducts = await _productService.getFeaturedProducts(
        regionId: _regionId,
      );
      notifyListeners();
    } catch (e) {
      // Silent fail for featured products
    }
  }

  Future<void> loadCategories() async {
    try {
      _categories = await _productService.getCategories(regionId: _regionId);
      notifyListeners();
    } catch (e) {
      // Silent fail for categories
    }
  }

  void setCategory(String? category) {
    if (_currentCategory != category) {
      _currentCategory = category;
      loadProducts(refresh: true);
    }
  }

  Future<void> search(String query) async {
    _searchQuery = query.isEmpty ? null : query;
    await loadProducts(refresh: true);
  }

  void clearFilters() {
    _currentCategory = null;
    _searchQuery = null;
    loadProducts(refresh: true);
  }

  Future<Product?> getProductById(String id) async {
    return await _productService.getProductById(id);
  }

  Future<void> refresh() async {
    await Future.wait([
      loadProducts(refresh: true),
      loadFeaturedProducts(),
      loadCategories(),
    ]);
  }
}
