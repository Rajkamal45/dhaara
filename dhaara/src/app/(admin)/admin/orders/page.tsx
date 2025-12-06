import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Package, Clock, CheckCircle, Truck, XCircle, PackageCheck } from 'lucide-react'
import AdminOrdersTable from '@/components/admin/AdminOrdersTable'

export default async function AdminOrdersPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const isSuper = profile.admin_role === 'super_admin'

  // Fetch orders using admin client to bypass RLS
 // Fetch orders using admin client to bypass RLS
let query = supabase
.from('orders')
.select(`
  id,
  order_number,
  user_id,
  region_id,
  status,
  payment_status,
  payment_method,
  total_amount,
  subtotal,
  delivery_address,
  delivery_city,
  delivery_state,
  delivery_pincode,
  delivery_phone,
  delivery_lat,
  delivery_lng,
  notes,
  created_at,
  updated_at
`)
.order('created_at', { ascending: false })

  // Regional admin only sees their region
  if (!isSuper && profile.region_id) {
    query = query.eq('region_id', profile.region_id)
  }

  const { data: orders, error } = await query

  console.log('Orders fetched:', orders?.length, error)

  // Fetch user details separately
  const ordersWithDetails = await Promise.all(
    (orders || []).map(async (order) => {
      // Get user info
      const { data: orderUser } = await supabase
        .from('profiles')
        .select('full_name, email, phone, business_name')
        .eq('id', order.user_id)
        .single()

      // Get region info
      const { data: region } = order.region_id ? await supabase
        .from('regions')
        .select('name, code')
        .eq('id', order.region_id)
        .single() : { data: null }

      // Get order items using admin client to bypass RLS
      const { data: orderItems } = await supabaseAdmin
        .from('order_items')
        .select(`
          id,
          quantity,
          price,
          unit,
          total,
          product_id
        `)
        .eq('order_id', order.id)

      // Get product details for items using admin client
      const itemsWithProducts = await Promise.all(
        (orderItems || []).map(async (item) => {
          const { data: product } = item.product_id ? await supabaseAdmin
            .from('products')
            .select('name, image_url')
            .eq('id', item.product_id)
            .single() : { data: null }

          return { ...item, product }
        })
      )

      return {
        ...order,
        user: orderUser,
        region,
        order_items: itemsWithProducts,
      }
    })
  )

  // Stats
  const pending = ordersWithDetails?.filter(o => o.status === 'pending').length || 0
  const confirmed = ordersWithDetails?.filter(o => o.status === 'confirmed').length || 0
  const shipped = ordersWithDetails?.filter(o => o.status === 'shipped').length || 0
  const delivered = ordersWithDetails?.filter(o => o.status === 'delivered').length || 0
  const cancelled = ordersWithDetails?.filter(o => o.status === 'cancelled').length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <p className="text-muted-foreground">View and manage all orders ({ordersWithDetails.length} total)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-700">{pending}</p>
              <p className="text-sm text-yellow-600">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-700">{confirmed}</p>
              <p className="text-sm text-blue-600">Confirmed</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-700">{shipped}</p>
              <p className="text-sm text-purple-600">Shipped</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <PackageCheck className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-700">{delivered}</p>
              <p className="text-sm text-green-600">Delivered</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-700">{cancelled}</p>
              <p className="text-sm text-red-600">Cancelled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <AdminOrdersTable orders={JSON.parse(JSON.stringify(ordersWithDetails || []))} />
    </div>
  )
}