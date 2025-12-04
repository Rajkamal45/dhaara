import 'package:flutter/material.dart';
import '../models/order.dart';
import '../services/order_service.dart';

class OrderProvider extends ChangeNotifier {
  final OrderService _orderService = OrderService();

  List<Order> _orders = [];
  bool _isLoading = false;
  String? _error;
  Order? _selectedOrder;

  List<Order> get orders => _orders;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Order? get selectedOrder => _selectedOrder;

  // Get orders filtered by status
  List<Order> get pendingOrders =>
      _orders.where((o) => o.status == OrderStatus.pending).toList();
  List<Order> get activeOrders => _orders
      .where((o) =>
          o.status != OrderStatus.delivered &&
          o.status != OrderStatus.cancelled)
      .toList();
  List<Order> get completedOrders =>
      _orders.where((o) => o.status == OrderStatus.delivered).toList();
  List<Order> get cancelledOrders =>
      _orders.where((o) => o.status == OrderStatus.cancelled).toList();

  Future<void> loadOrders(String userId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final ordersData = await _orderService.getOrders(userId);
      _orders = ordersData.map((data) => Order.fromJson(data)).toList();
      _error = null;
    } catch (e) {
      _error = 'Failed to load orders: $e';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> refreshOrders(String userId) async {
    await loadOrders(userId);
  }

  Future<Order?> getOrderDetails(String orderId) async {
    try {
      final orderData = await _orderService.getOrderById(orderId);
      if (orderData != null) {
        _selectedOrder = Order.fromJson(orderData);
        notifyListeners();
        return _selectedOrder;
      }
    } catch (e) {
      _error = 'Failed to load order details: $e';
      notifyListeners();
    }
    return null;
  }

  Future<bool> cancelOrder(String orderId, String userId) async {
    try {
      final success = await _orderService.cancelOrder(orderId);
      if (success) {
        // Update local state
        final index = _orders.indexWhere((o) => o.id == orderId);
        if (index != -1) {
          // Reload orders to get updated data
          await loadOrders(userId);
        }
        return true;
      }
    } catch (e) {
      _error = 'Failed to cancel order: $e';
      notifyListeners();
    }
    return false;
  }

  void clearSelectedOrder() {
    _selectedOrder = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
