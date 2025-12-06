# Dhaara - B2B Logistics & Delivery Management System

A comprehensive B2B logistics management platform built with **Next.js 14** for web applications and **Flutter** for mobile app, both connected to a shared **Supabase** backend. The system enables regional product distribution with role-based access for Super Admins, Regional Admins, Logistics Partners, and Customers.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
  - [Admin Panel](#admin-panel-nextjs)
  - [Logistics Portal](#logistics-portal-nextjs)
  - [Customer Portal](#customer-portal-nextjs)
  - [Mobile App](#mobile-app-flutter)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Shared Database Architecture](#shared-database-architecture)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
- [User Roles & Permissions](#user-roles--permissions)
- [Screenshots](#screenshots)
- [License](#license)

---

## Overview

**Dhaara** is a full-featured B2B logistics management system designed for regional product distribution. It provides:

- **Web Application** (Next.js) - Admin dashboard, logistics management, and customer ordering
- **Mobile Application** (Flutter) - Customer-facing app for browsing and ordering products
- **Shared Backend** (Supabase) - Single source of truth for all data across platforms

The system supports multi-region operations where:
- **Super Admins** have access to all regions
- **Regional Admins** manage their specific region
- **Logistics Partners** handle deliveries in their assigned region
- **Customers** browse region-specific products and place orders

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│   │   Next.js Web   │    │   Next.js Web   │    │   Flutter   │ │
│   │   Admin Panel   │    │  Customer/Logs  │    │  Mobile App │ │
│   │                 │    │                 │    │             │ │
│   │  - Dashboard    │    │  - Products     │    │ - Browse    │ │
│   │  - Products     │    │  - Cart         │    │ - Cart      │ │
│   │  - Orders       │    │  - Orders       │    │ - Orders    │ │
│   │  - Users/KYC    │    │  - Deliveries   │    │ - Profile   │ │
│   │  - Analytics    │    │  - Map View     │    │ - Checkout  │ │
│   │  - Logistics    │    │                 │    │             │ │
│   └────────┬────────┘    └────────┬────────┘    └──────┬──────┘ │
│            │                      │                     │        │
└────────────┼──────────────────────┼─────────────────────┼────────┘
             │                      │                     │
             ▼                      ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE BACKEND                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│   │   Auth      │  │  Database   │  │   Storage   │             │
│   │             │  │ PostgreSQL  │  │   (Images)  │             │
│   │  - Email    │  │             │  │             │             │
│   │  - Phone    │  │  - profiles │  │  - products │             │
│   │  - OTP      │  │  - products │  │  - kyc_docs │             │
│   │             │  │  - orders   │  │             │             │
│   └─────────────┘  │  - regions  │  └─────────────┘             │
│                    │  - coupons  │                               │
│   ┌─────────────┐  └─────────────┘  ┌─────────────┐             │
│   │    RLS      │                    │  Real-time  │             │
│   │  Policies   │                    │   Updates   │             │
│   └─────────────┘                    └─────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

### Admin Panel (Next.js)

The admin panel provides comprehensive management capabilities with role-based access control.

#### Super Admin Features
- **Global Dashboard** - Overview of all regions, users, products, and orders
- **Multi-Region Management** - Access and manage all regions from one interface
- **User Management** - Create admins, logistics partners, and manage all users
- **Product Catalog** - Add/edit/delete products across all regions
- **Bulk Product Upload** - CSV/Excel import for mass product updates
- **KYC Verification** - Approve/reject customer business verification
- **Order Management** - View and manage orders across all regions
- **Analytics Dashboard** - Business insights and reporting
- **Coupon Management** - Create and manage promotional coupons
- **Logistics Partner Assignment** - Assign delivery personnel to regions

#### Regional Admin Features
- **Region-Specific Dashboard** - Stats limited to assigned region
- **Regional Products** - Manage products available in their region
- **Regional Orders** - Handle orders within their region
- **Regional Users** - Manage customers and logistics partners in region
- **KYC Verification** - Approve regional customer verifications

### Logistics Portal (Next.js)

Dedicated portal for delivery personnel to manage their deliveries.

- **Delivery Dashboard** - Overview of pending, in-transit, and completed deliveries
- **Order Management** - View assigned orders with customer details
- **Route Map** - Interactive Leaflet map showing all delivery locations
- **GPS Navigation** - Direct integration with Google Maps for navigation
- **Order Status Updates** - Mark orders as picked up, in-transit, or delivered
- **OTP Verification** - Secure delivery confirmation with customer OTP
- **Delivery History** - View completed deliveries and earnings
- **Customer Contact** - One-tap calling to customers

### Customer Portal (Next.js)

Web interface for B2B customers to browse and order products.

- **Product Catalog** - Browse region-specific products with search and filters
- **Category Navigation** - Filter products by category
- **Shopping Cart** - Add/remove items, adjust quantities
- **Saved Addresses** - Store multiple delivery addresses with GPS coordinates
- **Location Picker** - Interactive map for precise delivery location
- **Checkout Flow** - Complete order with address selection and payment method
- **Order Tracking** - Real-time order status updates
- **Order History** - View past orders and reorder
- **KYC Submission** - Upload business documents for verification
- **Profile Management** - Update business and personal information
- **Payment Options** - Cash on Delivery, Bank Transfer

### Mobile App (Flutter)

Native mobile experience for B2B customers on Android and iOS.

- **User Authentication**
  - Email/password login
  - Phone number registration
  - Password recovery

- **Product Features**
  - Region-based product listing
  - Category filtering
  - Product search
  - Product details with images

- **Shopping Cart**
  - Add/remove products
  - Quantity adjustment
  - Price calculation
  - Persistent cart (local storage)

- **Checkout & Orders**
  - Multiple saved addresses
  - GPS location selection
  - Interactive map for address
  - Order placement
  - Order tracking
  - Order history

- **Profile Management**
  - Edit personal details
  - Business information
  - Address management
  - Logout

---

## Tech Stack

### Web Application (Next.js)

| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework with App Router |
| TypeScript | Type-safe development |
| Tailwind CSS | Utility-first styling |
| Supabase | Backend-as-a-Service |
| React Hook Form | Form management |
| Zod | Schema validation |
| Leaflet | Interactive maps |
| Lucide React | Icon library |
| Radix UI | Accessible UI components |

### Mobile Application (Flutter)

| Technology | Purpose |
|------------|---------|
| Flutter 3.x | Cross-platform framework |
| Dart 3.x | Programming language |
| Provider | State management |
| Supabase Flutter | Backend integration |
| Flutter Map | Leaflet-based maps |
| Geolocator | GPS location services |
| Geocoding | Address lookup |
| SharedPreferences | Local storage |
| Cached Network Image | Image caching |

### Backend (Supabase)

| Service | Purpose |
|---------|---------|
| PostgreSQL | Relational database |
| Authentication | User auth with email/phone/OTP |
| Row Level Security | Data access policies |
| Storage | Product images, KYC documents |
| Real-time | Live updates |
| Edge Functions | Serverless functions |

---

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with role, region, KYC status |
| `regions` | Available delivery regions |
| `products` | Product catalog with region assignment |
| `categories` | Product categories |
| `orders` | Customer orders |
| `order_items` | Items in each order |
| `saved_addresses` | Customer delivery addresses |
| `coupons` | Promotional discount codes |

### Key Relationships

```sql
profiles
├── region_id → regions.id
├── role: 'user' | 'admin' | 'logistics'
├── admin_role: 'super_admin' | 'regional_admin' (if admin)
└── kyc_status: 'pending' | 'approved' | 'rejected'

products
├── region_id → regions.id
├── category_id → categories.id
└── is_active: boolean

orders
├── user_id → profiles.id
├── region_id → regions.id
├── assigned_to → profiles.id (logistics user)
├── status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
└── payment_status: 'pending' | 'paid'
```

---

## Shared Database Architecture

One of the key features of Dhaara is the **shared Supabase database** between the Next.js web application and Flutter mobile app.

### How It Works

```
┌──────────────────┐         ┌──────────────────┐
│   Next.js Web    │         │   Flutter App    │
│                  │         │                  │
│  Uses SSR +      │         │  Uses Provider   │
│  Server Actions  │         │  + Supabase SDK  │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         │    Same Supabase URL       │
         │    Same Anon Key           │
         │    Same Auth System        │
         ▼                            ▼
┌─────────────────────────────────────────────────┐
│              SUPABASE PROJECT                   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │            PostgreSQL Database           │   │
│  │                                          │   │
│  │  • Same tables for web & mobile         │   │
│  │  • RLS policies apply to both           │   │
│  │  • Real-time sync across platforms      │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │            Authentication                │   │
│  │                                          │   │
│  │  • Single user account works on both    │   │
│  │  • Login on web or mobile               │   │
│  │  • Session management per platform      │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Benefits

1. **Single Source of Truth** - All data is consistent across platforms
2. **Unified Authentication** - Same user credentials work on web and mobile
3. **Real-time Sync** - Changes on web reflect on mobile and vice versa
4. **Shared Business Logic** - RLS policies enforce same rules everywhere
5. **Reduced Development Time** - No separate API layer needed

### Configuration

**Next.js (Web)**
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

**Flutter (Mobile)**
```dart
// lib/config/supabase_config.dart
class SupabaseConfig {
  static const String url = 'https://your-project.supabase.co';
  static const String anonKey = 'your-anon-key';
}

// lib/main.dart
await Supabase.initialize(
  url: SupabaseConfig.url,
  anonKey: SupabaseConfig.anonKey,
);
```

---

## Project Structure

```
project2/
├── dhaara/                          # Next.js Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (admin)/             # Admin route group
│   │   │   │   └── admin/
│   │   │   │       ├── dashboard/   # Admin dashboard
│   │   │   │       ├── products/    # Product management
│   │   │   │       ├── orders/      # Order management
│   │   │   │       ├── users/       # User management
│   │   │   │       ├── kyc/         # KYC verification
│   │   │   │       ├── logistics/   # Logistics partners
│   │   │   │       ├── analytics/   # Business analytics
│   │   │   │       └── coupons/     # Coupon management
│   │   │   │
│   │   │   ├── (logistics)/         # Logistics route group
│   │   │   │   └── logistics/
│   │   │   │       ├── dashboard/   # Delivery dashboard
│   │   │   │       ├── orders/      # Assigned orders
│   │   │   │       ├── map/         # Route map view
│   │   │   │       └── completed/   # Delivery history
│   │   │   │
│   │   │   ├── (customer)/          # Customer route group
│   │   │   │   ├── products/        # Product catalog
│   │   │   │   ├── cart/            # Shopping cart
│   │   │   │   ├── checkout/        # Order checkout
│   │   │   │   ├── my-orders/       # Order history
│   │   │   │   ├── profile/         # User profile
│   │   │   │   └── kyc/             # KYC submission
│   │   │   │
│   │   │   ├── (auth)/              # Auth route group
│   │   │   │   ├── login/           # Login page
│   │   │   │   ├── register/        # Registration
│   │   │   │   ├── forgot-password/ # Password recovery
│   │   │   │   └── verify-otp/      # OTP verification
│   │   │   │
│   │   │   └── api/                 # API routes
│   │   │       ├── admin/           # Admin APIs
│   │   │       ├── auth/            # Auth APIs
│   │   │       ├── cart/            # Cart APIs
│   │   │       ├── orders/          # Order APIs
│   │   │       ├── products/        # Product APIs
│   │   │       ├── logistics/       # Logistics APIs
│   │   │       ├── payments/        # Payment APIs
│   │   │       └── coupons/         # Coupon APIs
│   │   │
│   │   ├── components/
│   │   │   ├── admin/               # Admin components
│   │   │   ├── customer/            # Customer components
│   │   │   ├── logistics/           # Logistics components
│   │   │   ├── auth/                # Auth components
│   │   │   └── ui/                  # Shared UI components
│   │   │
│   │   ├── lib/
│   │   │   ├── supabase/            # Supabase clients
│   │   │   ├── actions/             # Server actions
│   │   │   ├── utils/               # Utility functions
│   │   │   └── validations/         # Zod schemas
│   │   │
│   │   └── context/                 # React contexts
│   │
│   ├── public/                      # Static assets
│   └── package.json
│
└── dhaara_app/                      # Flutter Mobile App
    ├── lib/
    │   ├── main.dart                # App entry point
    │   ├── config/
    │   │   ├── supabase_config.dart # Supabase setup
    │   │   └── app_theme.dart       # App theming
    │   │
    │   ├── models/
    │   │   ├── product.dart         # Product model
    │   │   ├── order.dart           # Order model
    │   │   ├── cart_item.dart       # Cart item model
    │   │   ├── user_profile.dart    # User profile model
    │   │   ├── saved_address.dart   # Address model
    │   │   └── region.dart          # Region model
    │   │
    │   ├── providers/
    │   │   ├── auth_provider.dart   # Auth state
    │   │   ├── cart_provider.dart   # Cart state
    │   │   ├── product_provider.dart # Products state
    │   │   ├── order_provider.dart  # Orders state
    │   │   └── address_provider.dart # Addresses state
    │   │
    │   ├── services/
    │   │   ├── auth_service.dart    # Auth operations
    │   │   ├── product_service.dart # Product CRUD
    │   │   ├── order_service.dart   # Order operations
    │   │   └── profile_service.dart # Profile operations
    │   │
    │   ├── screens/
    │   │   ├── auth/
    │   │   │   ├── login_screen.dart
    │   │   │   ├── register_screen.dart
    │   │   │   └── forgot_password_screen.dart
    │   │   ├── home/
    │   │   │   └── home_screen.dart
    │   │   ├── cart/
    │   │   │   └── cart_screen.dart
    │   │   ├── checkout/
    │   │   │   ├── checkout_screen.dart
    │   │   │   └── payment_screen.dart
    │   │   ├── orders/
    │   │   │   ├── orders_screen.dart
    │   │   │   └── order_details_screen.dart
    │   │   └── profile/
    │   │       ├── profile_screen.dart
    │   │       ├── edit_profile_screen.dart
    │   │       ├── addresses_list_screen.dart
    │   │       └── business_details_screen.dart
    │   │
    │   └── widgets/                 # Reusable widgets
    │
    ├── assets/
    │   └── images/                  # App images
    └── pubspec.yaml                 # Dependencies
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- Flutter SDK 3.0+
- Supabase account
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd project2
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Note your project URL and anon key
3. Run the database migrations (SQL files in supabase/migrations)
4. Configure authentication providers (Email, Phone)
5. Set up storage buckets for images

### 3. Configure Next.js Web App

```bash
cd dhaara

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Update .env.local with your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Run development server
npm run dev
```

The web app will be available at `http://localhost:3000`

### 4. Configure Flutter Mobile App

```bash
cd dhaara_app

# Install dependencies
flutter pub get

# Update Supabase config
# Edit lib/config/supabase_config.dart with your credentials

# Run on emulator/device
flutter run

# Build for release
flutter build apk --release    # Android
flutter build ios --release    # iOS
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/send-otp` | Send OTP for verification |
| GET | `/api/auth/[...supabase]` | Supabase auth callback |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (region filtered) |
| GET | `/api/products/[id]` | Get product details |
| POST | `/api/admin/products` | Create product (admin) |
| PUT | `/api/admin/products/[id]` | Update product (admin) |
| DELETE | `/api/admin/products/[id]` | Delete product (admin) |
| POST | `/api/products/bulk-upload` | Bulk import products |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List user orders |
| POST | `/api/orders` | Create new order |
| GET | `/api/orders/[id]` | Get order details |
| POST | `/api/orders/[id]/cancel` | Cancel order |
| POST | `/api/orders/[id]/apply-coupon` | Apply coupon to order |
| POST | `/api/orders/[id]/verify-otp` | Verify delivery OTP |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/orders` | List all orders |
| PUT | `/api/admin/orders/[id]` | Update order status |
| GET | `/api/admin/kyc` | List KYC requests |
| PUT | `/api/admin/kyc/[id]` | Approve/reject KYC |
| GET | `/api/admin/analytics` | Get analytics data |
| GET | `/api/admin/logistics-users` | List logistics partners |

### Logistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/logistics/orders` | Get assigned orders |
| PUT | `/api/logistics/orders/[id]` | Update delivery status |
| POST | `/api/logistics/assign-agent` | Assign logistics partner |
| GET | `/api/logistics/route-optimize` | Get optimized route |

### Cart & Coupons

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get cart items |
| POST | `/api/cart/items` | Add item to cart |
| PUT | `/api/cart/items/[id]` | Update cart item |
| DELETE | `/api/cart/items/[id]` | Remove cart item |
| POST | `/api/coupons/validate` | Validate coupon code |

---

## User Roles & Permissions

### Super Admin
- Full access to all features
- Manage all regions
- Create regional admins
- Global analytics

### Regional Admin
- Manage products in their region
- Handle orders in their region
- Verify KYC for regional customers
- Assign logistics partners

### Logistics Partner
- View assigned deliveries
- Update delivery status
- Navigate to delivery locations
- Verify delivery with OTP

### Customer
- Browse region-specific products
- Place and track orders
- Manage profile and addresses
- Submit KYC documents

---

## Order Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Pending   │───▶│  Confirmed  │───▶│ Processing  │───▶│   Shipped   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                               │
                                                               ▼
                                                        ┌─────────────┐
                                                        │  Delivered  │
                                                        └─────────────┘
```

1. **Pending** - Order placed, awaiting confirmation
2. **Confirmed** - Admin confirms the order
3. **Processing** - Order is being prepared
4. **Shipped** - Logistics partner picked up, out for delivery
5. **Delivered** - Successfully delivered (OTP verified)

---

## License

MIT License - see LICENSE file for details.

---

## Contributors

Built by Rajkamal Kaushal

---

## Support

For issues and feature requests, please open an issue on GitHub.
