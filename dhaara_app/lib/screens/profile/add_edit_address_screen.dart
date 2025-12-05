import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/address_provider.dart';
import '../../models/saved_address.dart';
import '../../config/app_theme.dart';
import '../../widgets/map_location_picker.dart';
import '../../widgets/location_search_field.dart';

class AddEditAddressScreen extends StatefulWidget {
  final SavedAddress? address;

  const AddEditAddressScreen({super.key, this.address});

  @override
  State<AddEditAddressScreen> createState() => _AddEditAddressScreenState();
}

class _AddEditAddressScreenState extends State<AddEditAddressScreen> {
  final _formKey = GlobalKey<FormState>();
  final _labelController = TextEditingController();
  final _streetController = TextEditingController();
  final _landmarkController = TextEditingController();

  bool _isLoading = false;
  bool _showMap = false;
  bool _isDefault = false;
  double? _latitude;
  double? _longitude;
  String? _city;
  String? _state;
  String? _postalCode;
  bool _isLocationVerified = false;

  bool get _isEditing => widget.address != null;

  final List<String> _labelOptions = ['Home', 'Work', 'Office', 'Shop', 'Other'];
  String _selectedLabel = 'Home';

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _populateFields();
    }
  }

  void _populateFields() {
    final address = widget.address!;
    _selectedLabel = address.label;
    if (!_labelOptions.contains(_selectedLabel)) {
      _labelOptions.add(_selectedLabel);
    }
    _labelController.text = address.label;
    _streetController.text = address.streetAddress;
    _landmarkController.text = address.landmark ?? '';
    _latitude = address.latitude;
    _longitude = address.longitude;
    _city = address.city;
    _state = address.state;
    _postalCode = address.postalCode;
    _isDefault = address.isDefault;
    _isLocationVerified = true;
  }

  @override
  void dispose() {
    _labelController.dispose();
    _streetController.dispose();
    _landmarkController.dispose();
    super.dispose();
  }

  void _onLocationSearchSelected(LocationSuggestion suggestion) {
    setState(() {
      _latitude = suggestion.latitude;
      _longitude = suggestion.longitude;
      _city = suggestion.city;
      _state = suggestion.state;
      _postalCode = suggestion.postalCode;
      _isLocationVerified = true;

      if (suggestion.street != null && _streetController.text.isEmpty) {
        _streetController.text = suggestion.street!;
      }
    });
  }

  void _onMapLocationSelected(LocationResult result) {
    setState(() {
      _latitude = result.latitude;
      _longitude = result.longitude;

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

      if (result.address != null && _streetController.text.isEmpty) {
        _streetController.text = result.address!;
      }
    });
  }

  Future<void> _saveAddress() async {
    if (!_formKey.currentState!.validate()) return;

    if (!_isLocationVerified || _city == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please verify your location'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final auth = context.read<AuthProvider>();
    final addressProvider = context.read<AddressProvider>();
    bool success;

    if (_isEditing) {
      success = await addressProvider.updateAddress(
        addressId: widget.address!.id,
        userId: auth.userProfile!.id,
        label: _selectedLabel,
        streetAddress: _streetController.text.trim(),
        landmark: _landmarkController.text.trim().isEmpty
            ? null
            : _landmarkController.text.trim(),
        city: _city!,
        state: _state!,
        postalCode: _postalCode!,
        latitude: _latitude!,
        longitude: _longitude!,
        isDefault: _isDefault,
      );
    } else {
      success = await addressProvider.addAddress(
        userId: auth.userProfile!.id,
        label: _selectedLabel,
        streetAddress: _streetController.text.trim(),
        landmark: _landmarkController.text.trim().isEmpty
            ? null
            : _landmarkController.text.trim(),
        city: _city!,
        state: _state!,
        postalCode: _postalCode!,
        latitude: _latitude!,
        longitude: _longitude!,
        isDefault: _isDefault,
      );
    }

    setState(() => _isLoading = false);

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_isEditing ? 'Address updated' : 'Address added'),
          backgroundColor: AppTheme.successColor,
        ),
      );
      Navigator.pop(context);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_isEditing ? 'Failed to update address' : 'Failed to add address'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Address' : 'Add Address'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Address Label
              Text(
                'Address Label',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _labelOptions.map((label) {
                  final isSelected = _selectedLabel == label;
                  return ChoiceChip(
                    label: Text(label),
                    selected: isSelected,
                    onSelected: (selected) {
                      if (selected) {
                        setState(() => _selectedLabel = label);
                      }
                    },
                    selectedColor: AppTheme.primaryColor.withOpacity(0.2),
                    labelStyle: TextStyle(
                      color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),

              // Location Section
              Text(
                'Location',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),

              // Location Search Field
              LocationSearchField(
                labelText: 'Search Area',
                hintText: 'Type area, locality or PIN code...',
                initialValue: _isLocationVerified && _city != null
                    ? [_city, _state, _postalCode].where((e) => e != null).join(', ')
                    : null,
                onLocationSelected: _onLocationSearchSelected,
                isRequired: true,
              ),
              const SizedBox(height: 12),

              // Map Toggle
              OutlinedButton.icon(
                onPressed: () => setState(() => _showMap = !_showMap),
                icon: Icon(_showMap ? Icons.map_outlined : Icons.map, size: 18),
                label: Text(_showMap ? 'Hide Map' : 'Select on Map'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                ),
              ),

              // Map
              if (_showMap) ...[
                const SizedBox(height: 12),
                MapLocationPicker(
                  initialLatitude: _latitude,
                  initialLongitude: _longitude,
                  height: 200,
                  showSearchBar: false,
                  onLocationSelected: _onMapLocationSelected,
                ),
              ],

              // Verified Location Display
              if (_isLocationVerified && _city != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.successColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.successColor.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.verified, color: AppTheme.successColor, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          [_city, _state, _postalCode]
                              .where((e) => e != null)
                              .join(', '),
                          style: const TextStyle(fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),

              // Street Address
              Text(
                'Address Details',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _streetController,
                maxLines: 2,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Street Address *',
                  hintText: 'House No, Building Name, Street',
                  prefixIcon: Icon(Icons.home_outlined),
                  alignLabelWithHint: true,
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
              const SizedBox(height: 16),

              // Landmark
              TextFormField(
                controller: _landmarkController,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Landmark (Optional)',
                  hintText: 'Near park, temple, etc.',
                  prefixIcon: Icon(Icons.place_outlined),
                ),
              ),
              const SizedBox(height: 24),

              // Set as Default
              SwitchListTile(
                title: const Text('Set as Default Address'),
                subtitle: const Text('Use this address for quick checkout'),
                value: _isDefault,
                onChanged: (value) => setState(() => _isDefault = value),
                activeColor: AppTheme.primaryColor,
                contentPadding: EdgeInsets.zero,
              ),
              const SizedBox(height: 32),

              // Save Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveAddress,
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
                            Icon(_isEditing ? Icons.check : Icons.add, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              _isEditing ? 'Update Address' : 'Save Address',
                              style: const TextStyle(fontSize: 16),
                            ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
