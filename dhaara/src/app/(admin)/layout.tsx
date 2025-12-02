import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, logout } from '@/lib/actions/auth'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Bell,
  Truck,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/logistics', label: 'Logistics', icon: Truck },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/regions', label: 'Regions', icon: MapPin, superOnly: true },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.profile?.role !== 'admin') {
    redirect('/login')
  }

  const isSuper = currentUser.profile?.admin_role === 'super_admin'
  const filteredNavItems = navItems.filter(item => !item.superOnly || isSuper)

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-background border-r hidden lg:block">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="p-2 bg-admin rounded-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg">Admin Panel</span>
                <p className="text-xs text-muted-foreground">Regional Delivery</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Region Badge (for Regional Admins) */}
          {!isSuper && currentUser.profile?.region && (
            <div className="mx-4 mb-4 p-3 bg-primary/10 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Managing Region</p>
              <p className="font-semibold text-primary">
                {currentUser.profile.region.name}
              </p>
            </div>
          )}

          {/* Super Admin Badge */}
          {isSuper && (
            <div className="mx-4 mb-4 p-3 bg-admin/10 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Access Level</p>
              <p className="font-semibold text-admin">Super Admin</p>
            </div>
          )}

          {/* Settings & Logout */}
          <div className="p-4 border-t space-y-1">
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Mobile menu button */}
            <button className="lg:hidden p-2 rounded-lg hover:bg-muted">
              <Menu className="h-5 w-5" />
            </button>

            {/* Right side */}
            <div className="flex items-center gap-4 ml-auto">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-muted">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </button>

              {/* Profile */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{currentUser.profile?.full_name || 'Admin'}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {currentUser.profile?.admin_role?.replace('_', ' ') || 'Admin'}
                  </p>
                </div>
                <div className="w-9 h-9 bg-admin/10 rounded-full flex items-center justify-center">
                  <span className="text-admin font-semibold">
                    {currentUser.profile?.full_name?.[0]?.toUpperCase() || 'A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}