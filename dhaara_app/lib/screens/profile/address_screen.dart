import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../config/app_theme.dart';
import '../../widgets/map_location_picker.dart';
import '../../widgets/location_search_field.dart';

class AddressScreen extends StatefulWidget {
  const AddressScreen({super.key});

  @override
  State<AddressScreen> createState() => _AddressScreenState();
}

class _AddressScreenState extends State<AddressScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _streetAddressController;
  late TextEditingController _landmarkController;
  String? _city;
  String? _state;
  String? _postalCode;
  bool _isLoading = false;
  double? _latitude;
  double? _longitude;
  bool _showMap = false;
  bool _isLocationVerified = false;

  @override
  void initState() {
    super.initState();
    final profile = context.read<AuthProvider>().userProfile;
    _streetAddressController = TextEditingController(text: profile?.addressLine1 ?? '');
    _landmarkController = TextEditingController(text: profile?.addressLine2 ?? '');
    _city = profile?.city;
    _state = profile?.state;
    _postalCode = profile?.postalCode;
    _latitude = profile?.latitude;
    _longitude = profile?.longitude;

    // If we have existing location data, mark as verified
    if (_latitude != null && _longitude != null && _city != null) {
      _isLocationVerified = true;
    }
  }

  @override
  void dispose() {
    _streetAddressController.dispose();
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

      // Auto-fill street if available and empty
      if (suggestion.street != null && _streetAddressController.text.isEmpty) {
        _streetAddressController.text = suggestion.street!;
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

  Future<void> _saveAddress() async {
    if (!_formKey.currentState!.validate()) return;

    // Additional validation for verified location
    if (!_isLocationVerified) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please search and select a verified location'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.updateProfile(
      addressLine1: _streetAddressController.text.trim(),
      addressLine2: _landmarkController.text.trim(),
      city: _city,
      state: _state,
      postalCode: _postalCode,
      latitude: _latitude,
      longitude: _longitude,
    );

    setState(() => _isLoading = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Address updated successfully'),
            backgroundColor: AppTheme.successColor,
          ),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(authProvider.errorMessage ?? 'Failed to update address'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Delivery Address'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Info Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline, color: AppTheme.primaryColor),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Text(
                            'How Address Works',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    _buildInfoRow(Icons.search, 'Search & select location for authentic City, State, PIN'),
                    _buildInfoRow(Icons.home_outlined, 'Street address is mandatory (you enter this)'),
                    _buildInfoRow(Icons.verified_outlined, 'Location must be verified before saving'),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Location Search Field
              LocationSearchField(
                labelText: 'Search Your Area/Locality',
                hintText: 'Type area, locality or PIN code...',
                initialValue: _isLocationVerified && _city != null
                    ? [_city, _state, _postalCode].where((e) => e != null).join(', ')
                    : null,
                onLocationSelected: _onLocationSearchSelected,
                isRequired: true,
              ),
              const SizedBox(height: 16),

              // Or select on map
              Row(
                children: [
                  Expanded(child: Divider(color: Colors.grey.shade300)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text('OR', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                  ),
                  Expanded(child: Divider(color: Colors.grey.shade300)),
                ],
              ),
              const SizedBox(height: 12),

              // Map Toggle Button
              OutlinedButton.icon(
                onPressed: () {
                  setState(() => _showMap = !_showMap);
                },
                icon: Icon(_showMap ? Icons.map_outlined : Icons.map),
                label: Text(_showMap ? 'Hide Map' : 'Select Location on Map'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),

              // Map Section
              if (_showMap) ...[
                const SizedBox(height: 16),
                MapLocationPicker(
                  initialLatitude: _latitude,
                  initialLongitude: _longitude,
                  height: 280,
                  showSearchBar: false, // Using our own search
                  onLocationSelected: _onMapLocationSelected,
                ),
              ],

              const SizedBox(height: 24),

              // Verified Location Info (Read-Only - from authenticated source)
              if (_isLocationVerified && _city != null) ...[
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
                              'Verified Location (Auto-filled)',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: AppTheme.successColor,
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
                              'READ-ONLY',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.successColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'These fields are auto-filled from verified location data',
                        style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                      ),
                      const SizedBox(height: 8),
                      _buildLocationRow(Icons.location_city, 'City', _city ?? '-'),
                      _buildLocationRow(Icons.map_outlined, 'State', _state ?? '-'),
                      _buildLocationRow(Icons.pin_drop_outlined, 'PIN Code', _postalCode ?? '-'),
                      if (_latitude != null && _longitude != null)
                        _buildLocationRow(
                          Icons.gps_fixed,
                          'Coordinates',
                          '${_latitude!.toStringAsFixed(4)}, ${_longitude!.toStringAsFixed(4)}',
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Street Address Section Title
              Text(
                'Street Address Details',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Enter your building, street, and floor details',
                style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
              ),
              const SizedBox(height: 12),

              // Street Address (user can edit - MANDATORY)
              TextFormField(
                controller: _streetAddressController,
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(
                  labelText: 'Building / Street Address *',
                  prefixIcon: const Icon(Icons.home_outlined),
                  hintText: 'House No, Building Name, Street',
                  helperText: 'Enter your complete street address (min 10 characters)',
                  helperStyle: TextStyle(color: Colors.grey.shade600, fontSize: 11),
                ),
                maxLines: 2,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Street address is required';
                  }
                  if (value.trim().length < 10) {
                    return 'Please enter a complete street address (min 10 characters)';
                  }
                  // Check for at least some alphanumeric content
                  if (!RegExp(r'[a-zA-Z0-9]').hasMatch(value)) {
                    return 'Please enter a valid street address';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Landmark (optional)
              TextFormField(
                controller: _landmarkController,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Landmark (Optional)',
                  prefixIcon: Icon(Icons.location_city_outlined),
                  hintText: 'Near school, temple, etc.',
                ),
              ),

              const SizedBox(height: 32),

              // Save Button
              ElevatedButton(
                onPressed: _isLoading ? null : _saveAddress,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: _isLocationVerified ? AppTheme.primaryColor : Colors.grey,
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
                          Text(_isLocationVerified ? 'Save Address' : 'Verify Location First'),
                        ],
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
                          'Please search and select a location from suggestions or use the map to verify your location.',
                          style: TextStyle(fontSize: 12, color: AppTheme.warningColor),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLocationRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey.shade600),
          const SizedBox(width: 8),
          Text('$label: ', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppTheme.primaryColor),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
            ),
          ),
        ],
      ),
    );
  }
}
