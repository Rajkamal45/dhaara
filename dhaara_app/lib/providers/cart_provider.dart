import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/cart_item.dart';
import '../models/product.dart';

class CartProvider extends ChangeNotifier {
  static const String _cartKey = 'cart_items';
  final Map<String, CartItem> _items = {};
  String? _regionId;

  CartProvider() {
    _loadCart();
  }

  List<CartItem> get items => _items.values.toList();
  int get itemCount => _items.length;
  bool get isEmpty => _items.isEmpty;

  double get subtotal {
    return _items.values.fold(0, (sum, item) => sum + item.itemTotal);
  }

  int get totalQuantity {
    return _items.values.fold(0, (sum, item) => sum + item.quantity);
  }

  void setRegion(String? regionId) {
    if (_regionId != regionId) {
      _regionId = regionId;
      // Clear cart when region changes
      _items.clear();
      notifyListeners();
    }
  }

  void addItem(Product product, {int quantity = 1}) {
    if (_items.containsKey(product.id)) {
      _items[product.id] = _items[product.id]!.copyWith(
        quantity: _items[product.id]!.quantity + quantity,
      );
    } else {
      _items[product.id] = CartItem(
        id: product.id,
        name: product.name,
        price: product.price,
        pricePerQuantity: product.pricePerQuantity,
        unit: product.unit,
        imageUrl: product.imageUrl,
        quantity: quantity,
        regionId: product.regionId,
      );
    }
    _saveCart();
    notifyListeners();
  }

  void removeItem(String productId) {
    _items.remove(productId);
    _saveCart();
    notifyListeners();
  }

  void updateQuantity(String productId, int quantity) {
    if (_items.containsKey(productId)) {
      if (quantity <= 0) {
        _items.remove(productId);
      } else {
        _items[productId] = _items[productId]!.copyWith(quantity: quantity);
      }
      _saveCart();
      notifyListeners();
    }
  }

  void incrementQuantity(String productId) {
    if (_items.containsKey(productId)) {
      _items[productId] = _items[productId]!.copyWith(
        quantity: _items[productId]!.quantity + 1,
      );
      _saveCart();
      notifyListeners();
    }
  }

  void decrementQuantity(String productId) {
    if (_items.containsKey(productId)) {
      final currentQty = _items[productId]!.quantity;
      if (currentQty <= 1) {
        _items.remove(productId);
      } else {
        _items[productId] = _items[productId]!.copyWith(
          quantity: currentQty - 1,
        );
      }
      _saveCart();
      notifyListeners();
    }
  }

  int getItemQuantity(String productId) {
    return _items[productId]?.quantity ?? 0;
  }

  bool isInCart(String productId) {
    return _items.containsKey(productId);
  }

  void clear() {
    _items.clear();
    _saveCart();
    notifyListeners();
  }

  Future<void> _loadCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartJson = prefs.getString(_cartKey);
      if (cartJson != null) {
        final List<dynamic> cartList = json.decode(cartJson);
        _items.clear();
        for (var item in cartList) {
          final cartItem = CartItem.fromJson(item);
          _items[cartItem.id] = cartItem;
        }
        notifyListeners();
      }
    } catch (e) {
      print('Error loading cart: $e');
    }
  }

  Future<void> _saveCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartList = _items.values.map((item) => item.toJson()).toList();
      await prefs.setString(_cartKey, json.encode(cartList));
    } catch (e) {
      print('Error saving cart: $e');
    }
  }
}
