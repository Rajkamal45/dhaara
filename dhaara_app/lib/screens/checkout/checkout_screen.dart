import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/address_provider.dart';
import '../../models/saved_address.dart';
import '../../config/app_theme.dart';
import '../../widgets/map_location_picker.dart';
import '../../widgets/location_search_field.dart';
import '../profile/addresses_list_screen.dart';
import 'payment_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _streetAddressController = TextEditingController();
  final _notesController = TextEditingController();
  bool _showMap = false;
  bool _showNewAddressForm = false;
  double? _deliveryLatitude;
  double? _deliveryLongitude;
  String? _city;
  String? _state;
  String? _postalCode;
  bool _isLocationVerified = false;
  SavedAddress? _selectedAddress;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadSavedAddresses();
    });
  }

  void _loadSavedAddresses() async {
    final auth = context.read<AuthProvider>();
    if (auth.userProfile != null) {
      await context.read<AddressProvider>().loadAddresses(auth.userProfile!.id);
      _autoSelectDefaultAddress();
    }
  }

  void _autoSelectDefaultAddress() {
    final addressProvider = context.read<AddressProvider>();
    if (addressProvider.hasAddresses) {
      final defaultAddress = addressProvider.defaultAddress;
      if (defaultAddress != null) {
        _selectAddress(defaultAddress);
      }
    }
  }

  void _selectAddress(SavedAddress address) {
    setState(() {
      _selectedAddress = address;
      _streetAddressController.text = address.streetAddress;
      _deliveryLatitude = address.latitude;
      _deliveryLongitude = address.longitude;
      _city = address.city;
      _state = address.state;
      _postalCode = address.postalCode;
      _isLocationVerified = true;
      _showNewAddressForm = false;
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
      _selectedAddress = null;

      if (suggestion.street != null && _streetAddressController.text.isEmpty) {
        _streetAddressController.text = suggestion.street!;
      }
    });
  }

  void _onMapLocationSelected(LocationResult result) {
    setState(() {
      _deliveryLatitude = result.latitude;
      _deliveryLongitude = result.longitude;
      _selectedAddress = null;

      if (result.city != null && result.city!.isNotEmpty) {
        _city = result.city;
      }
      if (result.state != null && result.state!.isNotEmpty) {
        _state = result.state;
      }
      if (result.postalCode != null && result.postalCode!.isNotEmpty) {
        _postalCode = result.postalCode;
      }

      if (_city != null) {
        _isLocationVerified = true;
      }

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

  void _proceedToPayment() {
    if (!_formKey.currentState!.validate()) return;

    if (!_isLocationVerified) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Colors.white, size: 20),
              SizedBox(width: 12),
              Text('Please select a delivery address'),
            ],
          ),
          backgroundColor: AppTheme.warningColor,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PaymentScreen(
          deliveryAddress: _streetAddressController.text.trim(),
          deliveryCity: _city,
          deliveryState: _state,
          deliveryPincode: _postalCode,
          deliveryPhone: context.read<AuthProvider>().userProfile?.phone,
          deliveryLatitude: _deliveryLatitude,
          deliveryLongitude: _deliveryLongitude,
          notes: _notesController.text.trim().isEmpty
              ? null
              : _notesController.text.trim(),
        ),
      ),
    );
  }

  void _openAddressSelection() async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AddressesListScreen(
          selectionMode: true,
          onAddressSelected: (address) {
            _selectAddress(address);
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Checkout'),
        elevation: 0,
      ),
      body: Consumer2<CartProvider, AddressProvider>(
        builder: (context, cart, addressProvider, _) {
          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Delivery Address Section
                        _buildDeliverySection(addressProvider),

                        // Order Items Section
                        _buildOrderItemsSection(cart),

                        // Order Notes Section
                        _buildNotesSection(),

                        const SizedBox(height: 100),
                      ],
                    ),
                  ),
                ),
              ),

              // Bottom Payment Bar
              _buildBottomBar(cart),
            ],
          );
        },
      ),
    );
  }

  Widget _buildDeliverySection(AddressProvider addressProvider) {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
        boxShadow: AppTheme.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.primarySoft,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.location_on_rounded,
                    color: AppTheme.primaryColor,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Delivery Address',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Select or add delivery location',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                if (addressProvider.hasAddresses)
                  TextButton(
                    onPressed: _openAddressSelection,
                    child: const Text('Change'),
                  ),
              ],
            ),
          ),

          const Divider(height: 1),

          // Saved Addresses Quick Selection
          if (addressProvider.hasAddresses && !_showNewAddressForm) ...[
            _buildSavedAddressesSection(addressProvider),
          ],

          // New Address Form
          if (_showNewAddressForm || !addressProvider.hasAddresses) ...[
            _buildNewAddressForm(),
          ],

          // Toggle Button
          if (addressProvider.hasAddresses) ...[
            const Divider(height: 1),
            InkWell(
              onTap: () {
                setState(() {
                  _showNewAddressForm = !_showNewAddressForm;
                  if (_showNewAddressForm) {
                    _selectedAddress = null;
                    _isLocationVerified = false;
                    _streetAddressController.clear();
                  }
                });
              },
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      _showNewAddressForm
                          ? Icons.bookmark_rounded
                          : Icons.add_location_alt_rounded,
                      size: 18,
                      color: AppTheme.primaryColor,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _showNewAddressForm
                          ? 'Use Saved Address'
                          : 'Use Different Address',
                      style: const TextStyle(
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSavedAddressesSection(AddressProvider addressProvider) {
    return Column(
      children: [
        // Selected Address Display
        if (_selectedAddress != null)
          _buildSelectedAddressCard(_selectedAddress!)
        else
          _buildNoAddressSelected(),

        // Quick Select Other Addresses
        if (addressProvider.addresses.length > 1) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Text(
                  'Other saved addresses',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 80,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: addressProvider.addresses.length,
              itemBuilder: (context, index) {
                final address = addressProvider.addresses[index];
                if (address.id == _selectedAddress?.id) {
                  return const SizedBox.shrink();
                }
                return _buildQuickAddressChip(address);
              },
            ),
          ),
          const SizedBox(height: 8),
        ],
      ],
    );
  }

  Widget _buildSelectedAddressCard(SavedAddress address) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primarySoft,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              _getLabelIcon(address.label),
              color: AppTheme.primaryColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      address.label,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    if (address.isDefault) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'DEFAULT',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  address.fullAddress,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                    height: 1.4,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const Icon(
            Icons.check_circle_rounded,
            color: AppTheme.primaryColor,
            size: 22,
          ),
        ],
      ),
    );
  }

  Widget _buildNoAddressSelected() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.warningLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.warningColor.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline_rounded,
              color: AppTheme.warningColor, size: 24),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Please select a delivery address to continue',
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAddressChip(SavedAddress address) {
    return GestureDetector(
      onTap: () => _selectAddress(address),
      child: Container(
        width: 160,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Icon(
                  _getLabelIcon(address.label),
                  size: 16,
                  color: AppTheme.textSecondary,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    address.label,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              address.shortAddress,
              style: const TextStyle(
                fontSize: 11,
                color: AppTheme.textSecondary,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  IconData _getLabelIcon(String label) {
    switch (label.toLowerCase()) {
      case 'home':
        return Icons.home_rounded;
      case 'work':
      case 'office':
        return Icons.work_rounded;
      case 'shop':
      case 'store':
        return Icons.store_rounded;
      default:
        return Icons.location_on_rounded;
    }
  }

  Widget _buildNewAddressForm() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Location Search
          LocationSearchField(
            labelText: 'Search Delivery Area',
            hintText: 'Type area, locality or PIN code...',
            initialValue: _isLocationVerified && _city != null
                ? [_city, _state, _postalCode]
                    .where((e) => e != null)
                    .join(', ')
                : null,
            onLocationSelected: _onLocationSearchSelected,
            isRequired: true,
          ),
          const SizedBox(height: 12),

          // Map Toggle
          OutlinedButton.icon(
            onPressed: () {
              setState(() => _showMap = !_showMap);
            },
            icon: Icon(_showMap ? Icons.map_outlined : Icons.map, size: 18),
            label: Text(_showMap ? 'Hide Map' : 'Or Select on Map'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
              side: BorderSide(color: Colors.grey.shade300),
              foregroundColor: AppTheme.textSecondary,
            ),
          ),

          // Map Section
          if (_showMap) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: MapLocationPicker(
                initialLatitude: _deliveryLatitude,
                initialLongitude: _deliveryLongitude,
                height: 200,
                showSearchBar: false,
                onLocationSelected: _onMapLocationSelected,
              ),
            ),
          ],

          // Verified Location Display
          if (_isLocationVerified && _city != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.successLight,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle_rounded,
                      color: AppTheme.successColor, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Location Verified',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: AppTheme.successColor,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          [_city, _state, _postalCode]
                              .where((e) => e != null)
                              .join(', '),
                          style: const TextStyle(
                              fontSize: 12, color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 16),

          // Street Address
          TextFormField(
            controller: _streetAddressController,
            maxLines: 2,
            textCapitalization: TextCapitalization.words,
            decoration: InputDecoration(
              labelText: 'Street Address / Building',
              hintText: 'House No, Building Name, Street',
              prefixIcon: const Icon(Icons.home_outlined),
              alignLabelWithHint: true,
              filled: true,
              fillColor: Colors.grey.shade50,
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Street address is required';
              }
              if (value.trim().length < 10) {
                return 'Please enter complete address (min 10 characters)';
              }
              return null;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildOrderItemsSection(CartProvider cart) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
        boxShadow: AppTheme.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.accentSoft,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.shopping_bag_rounded,
                    color: AppTheme.accentColor,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Order Summary',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      Text(
                        '${cart.itemCount} item${cart.itemCount > 1 ? 's' : ''}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: cart.items.length,
            separatorBuilder: (_, __) => const Divider(height: 1, indent: 70),
            itemBuilder: (context, index) {
              final item = cart.items[index];
              return ListTile(
                dense: true,
                leading: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      '${item.quantity}x',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: AppTheme.primaryColor,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
                title: Text(
                  item.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w500,
                    fontSize: 14,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(
                  '${item.pricePerQuantity}/${item.unit}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                  ),
                ),
                trailing: Text(
                  '₹${item.itemTotal.toStringAsFixed(0)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildNotesSection() {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
        boxShadow: AppTheme.softShadow,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.note_alt_outlined,
                    color: Colors.grey.shade600, size: 20),
                const SizedBox(width: 8),
                const Text(
                  'Delivery Instructions',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'OPTIONAL',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _notesController,
              maxLines: 2,
              decoration: InputDecoration(
                hintText: 'Any special instructions for delivery?',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: Colors.grey.shade200),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: Colors.grey.shade200),
                ),
                filled: true,
                fillColor: Colors.grey.shade50,
                contentPadding: const EdgeInsets.all(14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomBar(CartProvider cart) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: AppTheme.navShadow,
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Total Amount',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '₹${cart.subtotal.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: ElevatedButton(
                onPressed: _isLocationVerified ? _proceedToPayment : null,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: _isLocationVerified
                      ? AppTheme.primaryColor
                      : Colors.grey.shade300,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _isLocationVerified ? 'Continue' : 'Select Address',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.arrow_forward_rounded, size: 18),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
