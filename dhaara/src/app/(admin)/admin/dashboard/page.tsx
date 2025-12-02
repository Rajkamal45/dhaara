import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck
} from 'lucide-react'
import Link from 'next/link'

async function getDashboardStats() {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  // Get admin profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, region:regions(*)')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const isSuper = profile.admin_role === 'super_admin'
  const regionFilter = isSuper ? {} : { region_id: profile.region_id }

  // Get counts
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'user')
    .match(regionFilter)

  const { count: pendingKyc } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'user')
    .eq('kyc_status', 'pending')
    .match(regionFilter)

  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .match(regionFilter)

  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .match(regionFilter)

  const { count: pendingOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .match(regionFilter)

  const { count: totalLogistics } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'logistics')
    .match(regionFilter)

  // Recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      *,
      user:profiles!orders_user_id_fkey(full_name, business_name),
      region:regions(name)
    `)
    .match(regionFilter)
    .order('created_at', { ascending: false })
    .limit(5)

  // Recent KYC requests
  const { data: pendingKycUsers } = await supabase
    .from('profiles')
    .select('*, region:regions(name)')
    .eq('role', 'user')
    .eq('kyc_status', 'pending')
    .match(regionFilter)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    profile,
    isSuper,
    stats: {
      totalUsers: totalUsers || 0,
      pendingKyc: pendingKyc || 0,
      totalProducts: totalProducts || 0,
      totalOrders: totalOrders || 0,
      pendingOrders: pendingOrders || 0,
      totalLogistics: totalLogistics || 0,
    },
    recentOrders: recentOrders || [],
    pendingKycUsers: pendingKycUsers || [],
  }
}

export default async function AdminDashboardPage() {
  const { profile, isSuper, stats, recentOrders, pendingKycUsers } = await getDashboardStats()

  const statCards = [
    { 
      title: 'Total Users', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'bg-blue-500',
      href: '/admin/users'
    },
    { 
      title: 'Pending KYC', 
      value: stats.pendingKyc, 
      icon: Clock, 
      color: 'bg-yellow-500',
      href: '/admin/users?status=pending'
    },
    { 
      title: 'Products', 
      value: stats.totalProducts, 
      icon: Package, 
      color: 'bg-green-500',
      href: '/admin/products'
    },
    { 
      title: 'Total Orders', 
      value: stats.totalOrders, 
      icon: ShoppingCart, 
      color: 'bg-purple-500',
      href: '/admin/orders'
    },
    { 
      title: 'Pending Orders', 
      value: stats.pendingOrders, 
      icon: AlertCircle, 
      color: 'bg-orange-500',
      href: '/admin/orders?status=pending'
    },
    { 
      title: 'Logistics Partners', 
      value: stats.totalLogistics, 
      icon: Truck, 
      color: 'bg-teal-500',
      href: '/admin/users?role=logistics'
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile.full_name}
          {!isSuper && profile.region && (
            <span className="ml-2 text-sm bg-primary/10 text-primary px-2 py-1 rounded">
              {profile.region.name} Region
            </span>
          )}
          {isSuper && (
            <span className="ml-2 text-sm bg-admin/10 text-admin px-2 py-1 rounded">
              Super Admin
            </span>
          )}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="bg-card border rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending KYC */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pending KYC Approvals</h2>
            <Link href="/admin/users?status=pending" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {pendingKycUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending KYC requests</p>
          ) : (
            <div className="space-y-3">
              {pendingKycUsers.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{user.business_name || user.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email} • {user.region?.name}
                    </p>
                  </div>
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">#{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.user?.business_name} • ₹{order.total_amount}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}