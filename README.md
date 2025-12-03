 # Dhaara - Customer Mobile App

  A Flutter mobile application for B2B customers to browse products, place orders, and track deliveries. This app    
   connects to the same Supabase backend as the Dhaara web application.

  ## Features

  - **Region-based Products**: Customers only see products available in their region
  - **Product Browsing**: Search, filter by category, view product details
  - **Shopping Cart**: Add/remove items, adjust quantities
  - **Order Placement**: Checkout with delivery address
  - **Order Tracking**: View order status and history
  - **User Profile**: Manage profile and delivery addresses
  - **Authentication**: Login/Register with email or phone

  ## Tech Stack

  - **Framework**: Flutter 3.x
  - **State Management**: Provider / Riverpod
  - **Backend**: Supabase
    - Authentication
    - PostgreSQL Database
    - Storage (Images)
    - Real-time subscriptions
  - **Local Storage**: SharedPreferences

  ## Project Structure

  lib/
  ├── main.dart                    # App entry point
  ├── config/
  │   ├── supabase_config.dart     # Supabase initialization
  │   ├── app_theme.dart           # App theming
  │   └── constants.dart           # App constants
  ├── models/
  │   ├── product.dart
  │   ├── category.dart
  │   ├── cart_item.dart
  │   ├── order.dart
  │   ├── order_item.dart
  │   ├── user_profile.dart
  │   └── region.dart
  ├── services/
  │   ├── auth_service.dart        # Authentication
  │   ├── product_service.dart     # Product CRUD
  │   ├── order_service.dart       # Order operations
  │   ├── cart_service.dart        # Local cart management
  │   └── profile_service.dart     # User profile
  ├── providers/
  │   ├── auth_provider.dart
  │   ├── cart_provider.dart
  │   ├── product_provider.dart
  │   └── order_provider.dart
  ├── screens/
  │   ├── splash_screen.dart
  │   ├── auth/
  │   │   ├── login_screen.dart
  │   │   ├── register_screen.dart
  │   │   └── otp_screen.dart
  │   ├── home/
  │   │   └── home_screen.dart
  │   ├── products/
  │   │   ├── product_list_screen.dart
  │   │   └── product_detail_screen.dart
  │   ├── cart/
  │   │   ├── cart_screen.dart
  │   │   └── checkout_screen.dart
  │   ├── orders/
  │   │   ├── orders_screen.dart
  │   │   └── order_detail_screen.dart
  │   └── profile/
  │       ├── profile_screen.dart
  │       └── edit_profile_screen.dart
  ├── widgets/
  │   ├── common/
  │   │   ├── custom_button.dart
  │   │   ├── custom_text_field.dart
  │   │   ├── loading_widget.dart
  │   │   └── error_widget.dart
  │   ├── product_card.dart
  │   ├── cart_item_widget.dart
  │   ├── order_card.dart
  │   └── category_chip.dart
  └── utils/
      ├── helpers.dart
      ├── validators.dart
      └── extensions.dart

  ## Prerequisites

  - Flutter SDK 3.0+
  - Dart 3.0+
  - Android Studio / VS Code
  - Supabase account (same as web app)

  ## Setup Instructions

  ### 1. Clone the repository

  ```bash
  git clone <repository-url>
  cd dhaara_app

  2. Install dependencies

  flutter pub get

  3. Configure Supabase

  Create a .env file in the root directory:

  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=your-anon-key

  Or update lib/config/supabase_config.dart:

  class SupabaseConfig {
    static const String url = 'https://your-project.supabase.co';
    static const String anonKey = 'your-anon-key';
  }

  4. Run the app

  # Debug mode
  flutter run

  # Release mode
  flutter run --release

  Dependencies

  Add these to your pubspec.yaml:

  dependencies:
    flutter:
      sdk: flutter

    # Supabase
    supabase_flutter: ^2.3.0

    # State Management
    provider: ^6.1.1

    # Local Storage
    shared_preferences: ^2.2.2

    # UI Components
    cached_network_image: ^3.3.1
    flutter_svg: ^2.0.9
    shimmer: ^3.0.0

    # Utilities
    intl: ^0.18.1
    url_launcher: ^6.2.2

    # Environment
    flutter_dotenv: ^5.1.0

  dev_dependencies:
    flutter_test:
      sdk: flutter
    flutter_lints: ^3.0.1

  Database Tables Used

  | Table       | Description                  |
  |-------------|------------------------------|
  | profiles    | User profiles with region_id |
  | products    | Products filtered by region  |
  | regions     | Available regions            |
  | orders      | Customer orders              |
  | order_items | Items in each order          |

  API Integration

  Authentication

  // Sign In
  final response = await supabase.auth.signInWithPassword(
    email: email,
    password: password,
  );

  // Sign Up
  final response = await supabase.auth.signUp(
    email: email,
    password: password,
  );

  // Sign Out
  await supabase.auth.signOut();

  Fetch Products (Region-filtered)

  final products = await supabase
    .from('products')
    .select('*, region:regions(name, code)')
    .eq('is_active', true)
    .eq('region_id', userRegionId)
    .order('created_at', ascending: false);

  Place Order

  final order = await supabase
    .from('orders')
    .insert({
      'user_id': userId,
      'region_id': regionId,
      'total_amount': totalAmount,
      'delivery_address': address,
      'status': 'pending',
      'payment_status': 'pending',
    })
    .select()
    .single();

  Fetch User Orders

  final orders = await supabase
    .from('orders')
    .select('*, order_items(*, product:products(name, image_url))')
    .eq('user_id', userId)
    .order('created_at', ascending: false);

  Screens Overview

  | Screen         | Description                           |
  |----------------|---------------------------------------|
  | Splash         | App initialization, auth check        |
  | Login          | Email/phone login                     |
  | Register       | New user registration                 |
  | Home           | Product listing with search & filters |
  | Product Detail | Product info, add to cart             |
  | Cart           | View/edit cart items                  |
  | Checkout       | Delivery address, place order         |
  | Orders         | Order history list                    |
  | Order Detail   | Order status, items, tracking         |
  | Profile        | User info, logout                     |

  Environment

  The app uses the same Supabase backend as the web application:

  - Web App: Next.js (Admin, Logistics, Customer web)
  - Mobile App: Flutter (Customer only)

  Both share:
  - Same database tables
  - Same authentication system
  - Same RLS policies
  - Same storage buckets

  Build for Production

  Android

  flutter build apk --release
  # or for app bundle
  flutter build appbundle --release

  iOS

  flutter build ios --release

  Contributing

  1. Create a feature branch
  2. Make your changes
  3. Submit a pull request

  Related Projects

  - ../dhaara - Next.js web application (Admin, Logistics, Customer)

  License

  MIT License
