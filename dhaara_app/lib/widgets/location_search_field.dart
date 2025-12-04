import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/app_theme.dart';

class LocationSuggestion {
  final String displayName;
  final String? street;
  final String? city;
  final String? state;
  final String? postalCode;
  final String? country;
  final double latitude;
  final double longitude;

  LocationSuggestion({
    required this.displayName,
    this.street,
    this.city,
    this.state,
    this.postalCode,
    this.country,
    required this.latitude,
    required this.longitude,
  });

  factory LocationSuggestion.fromNominatim(Map<String, dynamic> json) {
    final address = json['address'] as Map<String, dynamic>? ?? {};

    // Build street from various components
    String? street;
    final streetParts = <String>[];
    if (address['house_number'] != null) streetParts.add(address['house_number']);
    if (address['road'] != null) streetParts.add(address['road']);
    if (address['neighbourhood'] != null) streetParts.add(address['neighbourhood']);
    if (address['suburb'] != null) streetParts.add(address['suburb']);
    if (streetParts.isNotEmpty) {
      street = streetParts.join(', ');
    }

    // Get city from various possible fields
    final city = address['city'] ??
                 address['town'] ??
                 address['village'] ??
                 address['municipality'] ??
                 address['county'];

    // Get state
    final state = address['state'] ?? address['state_district'];

    return LocationSuggestion(
      displayName: json['display_name'] ?? '',
      street: street,
      city: city,
      state: state,
      postalCode: address['postcode'],
      country: address['country'],
      latitude: double.tryParse(json['lat']?.toString() ?? '') ?? 0,
      longitude: double.tryParse(json['lon']?.toString() ?? '') ?? 0,
    );
  }
}

class LocationSearchField extends StatefulWidget {
  final Function(LocationSuggestion) onLocationSelected;
  final String? initialValue;
  final String labelText;
  final String hintText;
  final bool isRequired;
  final String? Function(String?)? additionalValidator;

  const LocationSearchField({
    super.key,
    required this.onLocationSelected,
    this.initialValue,
    this.labelText = 'Search Location',
    this.hintText = 'Type to search location...',
    this.isRequired = true,
    this.additionalValidator,
  });

  @override
  State<LocationSearchField> createState() => _LocationSearchFieldState();
}

class _LocationSearchFieldState extends State<LocationSearchField> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  final LayerLink _layerLink = LayerLink();

  OverlayEntry? _overlayEntry;
  List<LocationSuggestion> _suggestions = [];
  bool _isLoading = false;
  Timer? _debounce;
  bool _isLocationVerified = false;
  LocationSuggestion? _selectedLocation;

  @override
  void initState() {
    super.initState();
    if (widget.initialValue != null) {
      _controller.text = widget.initialValue!;
    }
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    _debounce?.cancel();
    _removeOverlay();
    super.dispose();
  }

  void _onFocusChange() {
    if (!_focusNode.hasFocus) {
      _removeOverlay();
    }
  }

  void _removeOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  void _showOverlay() {
    _removeOverlay();

    final overlay = Overlay.of(context);
    final renderBox = context.findRenderObject() as RenderBox;
    final size = renderBox.size;

    _overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        width: size.width,
        child: CompositedTransformFollower(
          link: _layerLink,
          showWhenUnlinked: false,
          offset: Offset(0, size.height + 4),
          child: Material(
            elevation: 4,
            borderRadius: BorderRadius.circular(8),
            child: Container(
              constraints: const BoxConstraints(maxHeight: 250),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: _buildSuggestionsList(),
            ),
          ),
        ),
      ),
    );

    overlay.insert(_overlayEntry!);
  }

  Widget _buildSuggestionsList() {
    if (_isLoading) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Center(
          child: SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );
    }

    if (_suggestions.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Text(
          _controller.text.length < 3
              ? 'Type at least 3 characters to search'
              : 'No locations found',
          style: TextStyle(color: Colors.grey.shade600),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      padding: EdgeInsets.zero,
      itemCount: _suggestions.length,
      itemBuilder: (context, index) {
        final suggestion = _suggestions[index];
        return InkWell(
          onTap: () => _selectLocation(suggestion),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                const Icon(Icons.location_on, color: AppTheme.primaryColor, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _getShortDisplayName(suggestion),
                        style: const TextStyle(fontWeight: FontWeight.w500),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (suggestion.city != null || suggestion.state != null)
                        Text(
                          [suggestion.city, suggestion.state, suggestion.postalCode]
                              .where((e) => e != null)
                              .join(', '),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _getShortDisplayName(LocationSuggestion suggestion) {
    final parts = suggestion.displayName.split(',');
    if (parts.length > 3) {
      return parts.take(3).join(',');
    }
    return suggestion.displayName;
  }

  void _selectLocation(LocationSuggestion suggestion) {
    setState(() {
      _selectedLocation = suggestion;
      _isLocationVerified = true;
      _controller.text = _getShortDisplayName(suggestion);
    });
    _removeOverlay();
    widget.onLocationSelected(suggestion);
  }

  Future<void> _searchLocations(String query) async {
    if (query.length < 3) {
      setState(() {
        _suggestions = [];
        _isLoading = false;
      });
      if (_overlayEntry != null) {
        _overlayEntry!.markNeedsBuild();
      }
      return;
    }

    setState(() => _isLoading = true);
    if (_overlayEntry != null) {
      _overlayEntry!.markNeedsBuild();
    }

    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      final response = await http.get(
        Uri.parse(
          'https://nominatim.openstreetmap.org/search?'
          'q=${Uri.encodeComponent(query)}'
          '&format=json'
          '&addressdetails=1'
          '&limit=5'
          '&countrycodes=in', // Restrict to India
        ),
        headers: {
          'User-Agent': 'DhaaraApp/1.0',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        setState(() {
          _suggestions = data
              .map((item) => LocationSuggestion.fromNominatim(item))
              .toList();
          _isLoading = false;
        });
      } else {
        setState(() {
          _suggestions = [];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _suggestions = [];
        _isLoading = false;
      });
    }

    if (_overlayEntry != null) {
      _overlayEntry!.markNeedsBuild();
    }
  }

  void _onTextChanged(String value) {
    // Reset verification when text changes manually
    if (_selectedLocation != null &&
        value != _getShortDisplayName(_selectedLocation!)) {
      setState(() {
        _isLocationVerified = false;
        _selectedLocation = null;
      });
    }

    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      _searchLocations(value);
    });

    if (_overlayEntry == null && _focusNode.hasFocus) {
      _showOverlay();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CompositedTransformTarget(
          link: _layerLink,
          child: TextFormField(
            controller: _controller,
            focusNode: _focusNode,
            decoration: InputDecoration(
              labelText: widget.labelText,
              hintText: widget.hintText,
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _isLocationVerified
                  ? const Icon(Icons.verified, color: AppTheme.successColor)
                  : _controller.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _controller.clear();
                            setState(() {
                              _isLocationVerified = false;
                              _selectedLocation = null;
                              _suggestions = [];
                            });
                            _removeOverlay();
                          },
                        )
                      : null,
            ),
            onChanged: _onTextChanged,
            onTap: () {
              if (_controller.text.length >= 3) {
                _showOverlay();
              }
            },
            validator: (value) {
              if (widget.isRequired) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please search and select a location';
                }
                if (!_isLocationVerified) {
                  return 'Please select a location from the suggestions';
                }
              }
              if (widget.additionalValidator != null) {
                return widget.additionalValidator!(value);
              }
              return null;
            },
          ),
        ),
        if (!_isLocationVerified && _controller.text.isNotEmpty) ...[
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.info_outline, size: 14, color: Colors.orange.shade700),
              const SizedBox(width: 4),
              Text(
                'Select a location from suggestions to verify',
                style: TextStyle(fontSize: 11, color: Colors.orange.shade700),
              ),
            ],
          ),
        ],
        if (_isLocationVerified && _selectedLocation != null) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.successColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.successColor.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.check_circle, color: AppTheme.successColor, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Verified Location',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.successColor,
                        ),
                      ),
                      Text(
                        [
                          _selectedLocation!.city,
                          _selectedLocation!.state,
                          _selectedLocation!.postalCode,
                        ].where((e) => e != null).join(', '),
                        style: const TextStyle(fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
