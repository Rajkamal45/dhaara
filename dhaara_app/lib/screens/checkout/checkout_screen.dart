import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/order_service.dart';
import '../../config/app_theme.dart';
import '../../widgets/map_location_picker.dart';
import '../../widgets/location_search_field.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _streetAddressController = TextEditingController();
  final _notesController = TextEditingController();
  final _orderService = OrderService();
  bool _isLoading = false;
  bool _showMap = false;
  double? _deliveryLatitude;
  double? _deliveryLongitude;
  String? _city;
  String? _state;
  String? _postalCode;
  bool _isLocationVerified = false;

  @override
  void initState() {
    super.initState();
    // Pre-fill address from user profile
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final userProfile = context.read<AuthProvider>().userProfile;
      if (userProfile != null) {
        // Load saved street address
        _streetAddressController.text = userProfile.addressLine1 ?? '';

        // Load saved location data
        _deliveryLatitude = userProfile.latitude;
        _deliveryLongitude = userProfile.longitude;
        _city = userProfile.city;
        _state = userProfile.state;
        _postalCode = userProfile.postalCode;

        // Mark as verified if we have location data
        if (_deliveryLatitude != null && _deliveryLongitude != null && _city != null) {
          _isLocationVerified = true;
        }

        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _streetAddressController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _onLocationSearchSelected(LocationSuggestion suggestion) {
    setState(() {
      _deliveryLatitude = suggestion.latitude;
      _deliveryLongitude = suggestion.longitude;
      _city = suggestion.city;
      _state = suggestion.state;
      _postalCode = suggestion.postalCode;
      _isLocationVerified = true;

      // Auto-fill street if available and empty
      if (suggestion.street != null && _streetAddressController.text.isEmpty) {
        _streetAddressController.text = suggestion.street!;
      }
    });
  }

  void _onMapLocationSelected(LocationResult result) {
    setState(() {
      _deliveryLatitude = result.latitude;
      _deliveryLongitude = result.longitude;

      if (result.city != null && result.city!.isNotEmpty) {
        _city = result.city;
      }
      if (result.state != null && result.state!.isNotEmpty) {
        _state = result.state;
      }
      if (result.postalCode != null && result.postalCode!.isNotEmpty) {
        _postalCode = result.postalCode;
      }

      // Mark as verified if we got city info
      if (_city != null) {
        _isLocationVerified = true;
      }

      // Auto-fill street if available and empty
      if (result.address != null && _streetAddressController.text.isEmpty) {
        _streetAddressController.text = result.address!;
      }
    });
  }

  String _buildFullAddress() {
    final parts = <String>[];
    if (_streetAddressController.text.trim().isNotEmpty) {
      parts.add(_streetAddressController.text.trim());
    }
    if (_city != null) parts.add(_city!);
    if (_state != null) parts.add(_state!);
    if (_postalCode != null) parts.add(_postalCode!);
    return parts.join(', ');
  }

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) return;

    // Validate location
    if (!_isLocationVerified) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please verify your delivery location'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final cart = context.read<CartProvider>();
    final auth = context.read<AuthProvider>();

    final orderId = await _orderService.placeOrder(
      userId: auth.userProfile!.id,
      items: cart.items,
      subtotal: cart.subtotal,
      deliveryAddress: _buildFullAddress(),
      notes: _notesController.text.trim().isEmpty
          ? null
          : _notesController.text.trim(),
      deliveryLatitude: _deliveryLatitude,
      deliveryLongitude: _deliveryLongitude,
    );

    setState(() => _isLoading = false);

    if (orderId != null && mounted) {
      cart.clear();
      _showSuccessDialog(orderId);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to place order. Please try again.'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  void _showSuccessDialog(String orderId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        icon: const Icon(
          Icons.check_circle,
          color: AppTheme.successColor,
          size: 64,
        ),
        title: const Text('Order Placed!'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Your order has been placed successfully.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Order ID: ${orderId.substring(0, 8)}...',
              style: const TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 12,
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Go back to cart
              Navigator.pop(context); // Go back to home
            },
            child: const Text('Continue Shopping'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout'),
      ),
      body: Consumer<CartProvider>(
        builder: (context, cart, _) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Order Summary
                  Text(
                    'Order Summary',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          ...cart.items.map((item) => Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        '${item.name} x${item.quantity}',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    Text(
                                      '₹${item.itemTotal.toStringAsFixed(2)}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              )),
                          const Divider(),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Subtotal',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                              Text(
                                '₹${cart.subtotal.toStringAsFixed(2)}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                  color: AppTheme.primaryColor,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Delivery Location Section
                  Text(
                    'Delivery Location',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),

                  // Location Search Field
                  LocationSearchField(
                    labelText: 'Search Delivery Area',
                    hintText: 'Type area, locality or PIN code...',
                    initialValue: _isLocationVerified && _city != null
                        ? [_city, _state, _postalCode].where((e) => e != null).join(', ')
                        : null,
                    onLocationSelected: _onLocationSearchSelected,
                    isRequired: true,
                  ),
                  const SizedBox(height: 12),

                  // Map Toggle Button
                  OutlinedButton.icon(
                    onPressed: () {
                      setState(() => _showMap = !_showMap);
                    },
                    icon: Icon(_showMap ? Icons.map_outlined : Icons.map, size: 18),
                    label: Text(_showMap ? 'Hide Map' : 'Or Select on Map'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                    ),
                  ),

                  // Map Section
                  if (_showMap) ...[
                    const SizedBox(height: 12),
                    MapLocationPicker(
                      initialLatitude: _deliveryLatitude,
                      initialLongitude: _deliveryLongitude,
                      height: 220,
                      showSearchBar: false,
                      onLocationSelected: _onMapLocationSelected,
                    ),
                  ],

                  // Verified Location Display (Read-Only from authenticated source)
                  if (_isLocationVerified && _city != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.successColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.successColor.withOpacity(0.3)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.verified, color: AppTheme.successColor, size: 20),
                              const SizedBox(width: 8),
                              const Expanded(
                                child: Text(
                                  'Verified Delivery Area',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.successColor,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.successColor.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  'AUTHENTIC',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.successColor,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            [_city, _state, _postalCode]
                                .where((e) => e != null)
                                .join(', '),
                            style: const TextStyle(fontSize: 13),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'City, State & PIN auto-filled from verified location',
                            style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 16),

                  // Street Address (MANDATORY - user input)
                  TextFormField(
                    controller: _streetAddressController,
                    maxLines: 2,
                    textCapitalization: TextCapitalization.words,
                    decoration: InputDecoration(
                      labelText: 'Street Address / Building *',
                      hintText: 'House No, Building Name, Street',
                      prefixIcon: const Icon(Icons.home_outlined),
                      alignLabelWithHint: true,
                      helperText: 'Enter complete street address (min 10 characters)',
                      helperStyle: TextStyle(color: Colors.grey.shade600, fontSize: 10),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Street address is required';
                      }
                      if (value.trim().length < 10) {
                        return 'Please enter complete address (min 10 characters)';
                      }
                      if (!RegExp(r'[a-zA-Z0-9]').hasMatch(value)) {
                        return 'Please enter a valid street address';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Order Notes
                  Text(
                    'Order Notes (Optional)',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _notesController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      hintText: 'Any special instructions?',
                      prefixIcon: Icon(Icons.note_outlined),
                      alignLabelWithHint: true,
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Place Order Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _placeOrder,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: _isLocationVerified
                            ? AppTheme.primaryColor
                            : Colors.grey,
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                if (_isLocationVerified)
                                  const Icon(Icons.check, size: 20)
                                else
                                  const Icon(Icons.warning_amber, size: 20),
                                const SizedBox(width: 8),
                                Text(
                                  _isLocationVerified
                                      ? 'Place Order - ₹${cart.subtotal.toStringAsFixed(2)}'
                                      : 'Verify Location First',
                                  style: const TextStyle(fontSize: 16),
                                ),
                              ],
                            ),
                    ),
                  ),

                  if (!_isLocationVerified) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.warningColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.info_outline, color: AppTheme.warningColor, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Please search and select a delivery location from suggestions to verify.',
                              style: TextStyle(fontSize: 12, color: AppTheme.warningColor),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 16),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
