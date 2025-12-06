import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/cart_item.dart';

class OrderService {
  final SupabaseClient _supabase = Supabase.instance.client;

  Future<String?> placeOrder({
    required String userId,
    required List<CartItem> items,
    required double subtotal,
    required String deliveryAddress,
    String? deliveryCity,
    String? deliveryState,
    String? deliveryPincode,
    String? deliveryPhone,
    String? notes,
    double? deliveryLatitude,
    double? deliveryLongitude,
  }) async {
    try {
      if (items.isEmpty) {
        print('Error: Cart is empty');
        return null;
      }

      // Get region ID from first item, with fallback
      final regionId = items.first.regionId;

      // Generate order number (matching web app format)
      final now = DateTime.now();
      final random = (now.millisecondsSinceEpoch % 10000).toString().padLeft(4, '0');
      final orderNumber = 'ORD${now.year.toString().substring(2)}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}$random';

      // Create order matching web app schema exactly
      final orderData = <String, dynamic>{
        'order_number': orderNumber,
        'user_id': userId,
        'status': 'pending',
        'payment_status': 'pending',
        'payment_method': 'cod',
        'subtotal': subtotal,
        'total_amount': subtotal,
        'delivery_address': deliveryAddress,
        'delivery_city': deliveryCity ?? '',
        'delivery_state': deliveryState ?? '',
        'delivery_pincode': deliveryPincode ?? '',
        'delivery_phone': deliveryPhone ?? '',
        'delivery_lat': deliveryLatitude,
        'delivery_lng': deliveryLongitude,
        'notes': notes ?? '',
      };

      // Only add region_id if not empty
      if (regionId.isNotEmpty) {
        orderData['region_id'] = regionId;
      }

      print('Creating order with data: $orderData');

      final orderResponse = await _supabase
          .from('orders')
          .insert(orderData)
          .select('id, order_number')
          .single();

      final orderId = orderResponse['id'] as String;
      final createdOrderNumber = orderResponse['order_number'];
      print('Order created with ID: $orderId, Order Number: $createdOrderNumber');

      // Create order items matching web app schema exactly
      // Web app only uses: order_id, product_id, quantity, price, price_per_quantity, unit, total
      final orderItems = items.map((item) {
        final itemPrice = item.price;
        final itemPricePerQty = item.pricePerQuantity > 0 ? item.pricePerQuantity : 1;
        final itemTotal = (itemPrice / itemPricePerQty) * item.quantity;
        return {
          'order_id': orderId,
          'product_id': item.id,
          'quantity': item.quantity,
          'price': itemPrice,
          'price_per_quantity': itemPricePerQty,
          'unit': item.unit,
          'total': itemTotal,
        };
      }).toList();

      print('Inserting order items: $orderItems');

      await _supabase.from('order_items').insert(orderItems);
      print('Order items inserted successfully');

      return orderId;
    } on PostgrestException catch (e) {
      print('Database error placing order: ${e.message}');
      print('Error code: ${e.code}');
      print('Details: ${e.details}');
      return null;
    } catch (e, stackTrace) {
      print('Error placing order: $e');
      print('Stack trace: $stackTrace');
      return null;
    }
  }

  Future<List<Map<String, dynamic>>> getOrders(String userId) async {
    try {
      // Match web app query exactly with product join
      final response = await _supabase
          .from('orders')
          .select('''
            *,
            order_items (
              *,
              product:products (name, image_url)
            )
          ''')
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      return List<Map<String, dynamic>>.from(response);
    } on PostgrestException catch (e) {
      print('Error fetching orders: ${e.message}');
      print('Code: ${e.code}, Details: ${e.details}');
      // Fallback: try without product join
      try {
        final response = await _supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('user_id', userId)
            .order('created_at', ascending: false);
        return List<Map<String, dynamic>>.from(response);
      } catch (e2) {
        print('Fallback also failed: $e2');
        return [];
      }
    } catch (e) {
      print('Error fetching orders: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>?> getOrderById(String orderId) async {
    try {
      final response = await _supabase
          .from('orders')
          .select('''
            *,
            order_items (
              *,
              product:products (name, image_url)
            )
          ''')
          .eq('id', orderId)
          .single();

      return response;
    } on PostgrestException catch (e) {
      print('Error fetching order: ${e.message}');
      // Fallback without product join
      try {
        final response = await _supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderId)
            .single();
        return response;
      } catch (e2) {
        print('Fallback also failed: $e2');
        return null;
      }
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
