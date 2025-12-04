import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../config/app_theme.dart';

class BusinessDetailsScreen extends StatefulWidget {
  const BusinessDetailsScreen({super.key});

  @override
  State<BusinessDetailsScreen> createState() => _BusinessDetailsScreenState();
}

class _BusinessDetailsScreenState extends State<BusinessDetailsScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _businessNameController;
  late TextEditingController _gstinController;
  String? _selectedBusinessType;
  bool _isLoading = false;

  final List<String> _businessTypes = [
    'Retailer',
    'Wholesaler',
    'Distributor',
    'Restaurant',
    'Hotel',
    'Caterer',
    'Other',
  ];

  /// Finds matching business type from list (case-insensitive)
  String? _findMatchingBusinessType(String? storedValue) {
    if (storedValue == null || storedValue.isEmpty) return null;

    // Try exact match first
    if (_businessTypes.contains(storedValue)) return storedValue;

    // Try case-insensitive match
    final lowerValue = storedValue.toLowerCase();
    for (final type in _businessTypes) {
      if (type.toLowerCase() == lowerValue) {
        return type;
      }
    }

    // No match found - return null to avoid dropdown error
    return null;
  }

  @override
  void initState() {
    super.initState();
    final profile = context.read<AuthProvider>().userProfile;
    _businessNameController = TextEditingController(text: profile?.businessName ?? '');
    _gstinController = TextEditingController(text: profile?.gstin ?? '');
    _selectedBusinessType = _findMatchingBusinessType(profile?.businessType);
  }

  @override
  void dispose() {
    _businessNameController.dispose();
    _gstinController.dispose();
    super.dispose();
  }

  Future<void> _saveBusinessDetails() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.updateProfile(
      businessName: _businessNameController.text.trim(),
      businessType: _selectedBusinessType,
      gstin: _gstinController.text.trim().toUpperCase(),
    );

    setState(() => _isLoading = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Business details updated successfully'),
            backgroundColor: AppTheme.successColor,
          ),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(authProvider.errorMessage ?? 'Failed to update business details'),
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
        title: const Text('Business Details'),
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
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: AppTheme.primaryColor),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Complete your business details for GST invoices and faster KYC approval.',
                        style: TextStyle(
                          color: AppTheme.primaryColor,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Business Name
              TextFormField(
                controller: _businessNameController,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Business Name',
                  prefixIcon: Icon(Icons.business_outlined),
                  hintText: 'e.g., ABC Traders',
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter your business name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Business Type
              DropdownButtonFormField<String>(
                value: _selectedBusinessType,
                decoration: const InputDecoration(
                  labelText: 'Business Type',
                  prefixIcon: Icon(Icons.category_outlined),
                ),
                items: _businessTypes.map((type) {
                  return DropdownMenuItem(
                    value: type,
                    child: Text(type),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() => _selectedBusinessType = value);
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please select a business type';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // GSTIN
              TextFormField(
                controller: _gstinController,
                textCapitalization: TextCapitalization.characters,
                maxLength: 15,
                decoration: const InputDecoration(
                  labelText: 'GSTIN (Optional)',
                  prefixIcon: Icon(Icons.receipt_long_outlined),
                  hintText: 'e.g., 22AAAAA0000A1Z5',
                  counterText: '',
                ),
                validator: (value) {
                  if (value != null && value.isNotEmpty) {
                    // Basic GSTIN validation (15 characters)
                    if (value.length != 15) {
                      return 'GSTIN must be 15 characters';
                    }
                    // Regex pattern for GSTIN
                    final gstinRegex = RegExp(
                      r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
                    );
                    if (!gstinRegex.hasMatch(value.toUpperCase())) {
                      return 'Please enter a valid GSTIN';
                    }
                  }
                  return null;
                },
              ),
              const SizedBox(height: 8),

              // KYC Status
              Consumer<AuthProvider>(
                builder: (context, auth, _) {
                  final profile = auth.userProfile;
                  final isApproved = profile?.isKycApproved == true;
                  return Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isApproved
                          ? AppTheme.successColor.withOpacity(0.1)
                          : AppTheme.warningColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isApproved ? Icons.verified : Icons.pending,
                          color: isApproved ? AppTheme.successColor : AppTheme.warningColor,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'KYC Status: ${isApproved ? 'Verified' : 'Pending'}',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: isApproved ? AppTheme.successColor : AppTheme.warningColor,
                                ),
                              ),
                              if (!isApproved)
                                const Text(
                                  'Complete your business details for KYC verification',
                                  style: TextStyle(fontSize: 12),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
              const SizedBox(height: 32),

              // Save Button
              ElevatedButton(
                onPressed: _isLoading ? null : _saveBusinessDetails,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
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
                    : const Text('Save Business Details'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
