import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  ArrowRight,
  Navigation,
  Phone
} from 'lucide-react'
import DashboardOrderActions from '@/components/logistics/DashboardOrderActions'

export default async function LogisticsDashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'logistics') redirect('/')

  // Get today's date range
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Fetch assigned orders
  const { data: allOrders } = await supabase
    .from('orders')
    .select(`
      *,
      region:regions (name)
    `)
    .eq('assigned_to', user.id)
    .order('created_at', { ascending: false })

  // Fetch user profiles separately
  const orders = await Promise.all(
    (allOrders || []).map(async (order) => {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name, phone, business_name')
        .eq('id', order.user_id)
        .single()
      return { ...order, user: userProfile }
    })
  )

  // Calculate stats
  const pendingPickup = orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length
  const outForDelivery = orders.filter(o => o.status === 'shipped').length
  const deliveredToday = orders.filter(o => 
    o.status === 'delivered' && 
    new Date(o.delivered_at) >= today
  ).length
  const totalDelivered = orders.filter(o => o.status === 'delivered').length

  // Active deliveries (pending, confirmed, processing or shipped)
  const activeDeliveries = orders.filter(o =>
    ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)
  ).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Good {getGreeting()}, {profile.full_name?.split(' ')[0]}!</h1>
        <p className="text-purple-200 mt-1">Here's your delivery overview for today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingPickup}</p>
              <p className="text-sm text-gray-500">Pending Pickup</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{outForDelivery}</p>
              <p className="text-sm text-gray-500">Out for Delivery</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{deliveredToday}</p>
              <p className="text-sm text-gray-500">Delivered Today</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalDelivered}</p>
              <p className="text-sm text-gray-500">Total Delivered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Deliveries */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Truck className="h-5 w-5 text-purple-600" />
            Active Deliveries
          </h2>
          <Link 
            href="/logistics/orders"
            className="text-sm text-purple-600 hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {activeDeliveries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No active deliveries</p>
            <p className="text-sm">New orders will appear here when assigned</p>
          </div>
        ) : (
          <div className="divide-y">
            {activeDeliveries.map((order) => (
              <div key={order.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">#{order.order_number}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'shipped'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status === 'shipped' ? 'Out for Delivery' : 'Ready for Pickup'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {order.user?.business_name || order.user?.full_name}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {order.delivery_address}, {order.delivery_city}
                    </p>
                    <p className="text-sm font-bold text-green-600 mt-2">₹{order.total_amount}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <DashboardOrderActions orderId={order.id} status={order.status} />
                    {order.delivery_lat && order.delivery_lng && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200"
                      >
                        <Navigation className="h-4 w-4" />
                        Navigate
                      </a>
                    )}
                    {order.user?.phone && (
                      <a
                        href={`tel:${order.user.phone}`}
                        className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                      >
                        <Phone className="h-4 w-4" />
                        Call
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/logistics/map"
          className="bg-white rounded-xl border p-6 hover:border-purple-500 transition-colors group"
        >
          <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-200">
            <MapPin className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold">Route Map</h3>
          <p className="text-sm text-gray-500">View all deliveries on map</p>
        </Link>

        <Link
          href="/logistics/orders"
          className="bg-white rounded-xl border p-6 hover:border-purple-500 transition-colors group"
        >
          <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-200">
            <Package className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold">My Deliveries</h3>
          <p className="text-sm text-gray-500">Manage all assigned orders</p>
        </Link>
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  return 'Evening'
}