import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/cart_item.dart';

class OrderService {
  final SupabaseClient _supabase = Supabase.instance.client;

  Future<String?> placeOrder({
    required String userId,
    required List<CartItem> items,
    required double subtotal,
    required String deliveryAddress,
    String? notes,
  }) async {
    try {
      // Create order
      final orderResponse = await _supabase.from('orders').insert({
        'user_id': userId,
        'status': 'pending',
        'subtotal': subtotal,
        'delivery_fee': 0,
        'total': subtotal,
        'delivery_address': deliveryAddress,
        'notes': notes,
        'region_id': items.first.regionId,
      }).select('id').single();

      final orderId = orderResponse['id'];

      // Create order items
      final orderItems = items.map((item) => {
        'order_id': orderId,
        'product_id': item.id,
        'product_name': item.name,
        'quantity': item.quantity,
        'unit_price': item.price / item.pricePerQuantity,
        'total_price': item.itemTotal,
        'unit': item.unit,
      }).toList();

      await _supabase.from('order_items').insert(orderItems);

      return orderId;
    } catch (e) {
      print('Error placing order: $e');
      return null;
    }
  }

  Future<List<Map<String, dynamic>>> getOrders(String userId) async {
    try {
      final response = await _supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      print('Error fetching orders: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>?> getOrderById(String orderId) async {
    try {
      final response = await _supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', orderId)
          .single();

      return response;
    } catch (e) {
      print('Error fetching order: $e');
      return null;
    }
  }

  Future<bool> cancelOrder(String orderId) async {
    try {
      await _supabase
          .from('orders')
          .update({
            'status': 'cancelled',
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', orderId)
          .inFilter('status', ['pending', 'confirmed']);

      return true;
    } catch (e) {
      print('Error cancelling order: $e');
      return false;
    }
  }

  Future<bool> updateOrderStatus(String orderId, String status) async {
    try {
      await _supabase.from('orders').update({
        'status': status,
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', orderId);

      return true;
    } catch (e) {
      print('Error updating order status: $e');
      return false;
    }
  }
}
