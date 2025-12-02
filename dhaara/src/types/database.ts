export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserType = 'retailer' | 'restaurant' | 'wholesaler'
export type KYCStatus = 'pending' | 'under_review' | 'approved' | 'rejected'
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type DiscountType = 'percentage' | 'fixed'
export type AdminRole = 'super_admin' | 'regional_admin' | 'support'
export type AgentStatus = 'available' | 'on_delivery' | 'offline'
export type UserRole = 'user' | 'admin' | 'logistics'

export interface Database {
  public: {
    Tables: {
      regions: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          is_active: boolean
          timezone: string
          currency: string
          center_lat: number | null
          center_lng: number | null
          radius_km: number | null
          support_email: string | null
          support_phone: string | null
          min_order_amount: number
          delivery_fee: number
          free_delivery_above: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['regions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['regions']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          email: string
          phone: string | null
          full_name: string | null
          avatar_url: string | null
          role: UserRole
          region_id: string | null
          business_name: string | null
          business_type: UserType | null
          gstin: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          country: string
          latitude: number | null
          longitude: number | null
          kyc_status: KYCStatus
          kyc_submitted_at: string | null
          kyc_verified_at: string | null
          kyc_verified_by: string | null
          kyc_rejection_reason: string | null
          kyc_documents: Json
          admin_role: AdminRole | null
          can_manage_products: boolean
          can_manage_orders: boolean
          can_verify_kyc: boolean
          can_manage_users: boolean
          vehicle_number: string | null
          license_number: string | null
          notification_preferences: Json
          last_login_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; email: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          sku: string | null
          barcode: string | null
          base_price: number
          sale_price: number | null
          cost_price: number | null
          tax_percentage: number
          stock_quantity: number
          low_stock_threshold: number
          track_inventory: boolean
          allow_backorder: boolean
          weight: number | null
          weight_unit: string
          dimensions: Json | null
          category_id: string | null
          tags: string[] | null
          image_url: string | null
          gallery_urls: string[] | null
          region_id: string
          is_active: boolean
          is_featured: boolean
          is_perishable: boolean
          shelf_life_days: number | null
          slug: string | null
          meta_title: string | null
          meta_description: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string
          region_id: string
          delivery_address: Json
          subtotal: number
          tax_amount: number
          delivery_fee: number
          discount_amount: number
          total_amount: number
          coupon_id: string | null
          coupon_code: string | null
          status: OrderStatus
          status_notes: string | null
          payment_status: PaymentStatus
          payment_method: string | null
          payment_id: string | null
          razorpay_order_id: string | null
          razorpay_signature: string | null
          delivery_agent_id: string | null
          estimated_delivery_at: string | null
          delivered_at: string | null
          delivery_otp: string | null
          delivery_otp_expires_at: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          cancellation_reason: string | null
          refund_id: string | null
          refund_amount: number | null
          refund_status: string | null
          refunded_at: string | null
          notes: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
          confirmed_at: string | null
          shipped_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'order_number' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      delivery_agents: {
        Row: {
          id: string
          user_id: string | null
          name: string
          phone: string
          email: string | null
          region_id: string
          vehicle_type: string | null
          vehicle_number: string | null
          license_number: string | null
          status: AgentStatus
          current_latitude: number | null
          current_longitude: number | null
          location_updated_at: string | null
          total_deliveries: number
          average_rating: number | null
          working_hours: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['delivery_agents']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['delivery_agents']['Insert']>
      }
      otp_codes: {
        Row: {
          id: string
          reference_type: string
          reference_id: string
          code: string
          phone: string
          is_used: boolean
          used_at: string | null
          attempts: number
          max_attempts: number
          expires_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['otp_codes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['otp_codes']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          type: string
          entity_type: string | null
          entity_id: string | null
          action_url: string | null
          is_read: boolean
          read_at: string | null
          email_sent: boolean
          sms_sent: boolean
          push_sent: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
    }
    Views: {}
    Functions: {
      generate_order_number: {
        Args: Record<string, never>
        Returns: string
      }
      generate_otp: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      user_type: UserType
      kyc_status: KYCStatus
      order_status: OrderStatus
      payment_status: PaymentStatus
      discount_type: DiscountType
      admin_role: AdminRole
      agent_status: AgentStatus
    }
  }
}

// Utility types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Commonly used types
export type Profile = Tables<'profiles'>
export type Region = Tables<'regions'>
export type Order = Tables<'orders'>
export type Product = Tables<'products'>
export type DeliveryAgent = Tables<'delivery_agents'>
export type Notification = Tables<'notifications'>
