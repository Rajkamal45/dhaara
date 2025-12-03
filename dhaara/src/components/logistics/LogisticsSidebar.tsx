'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Truck, 
  LayoutDashboard, 
  Package, 
  MapPin, 
  LogOut,
  CheckCircle,
  User
} from 'lucide-react'

interface LogisticsSidebarProps {
  profile: {
    full_name: string | null
    phone: string | null
    email: string | null
  }
  activeCount: number
}

export default function LogisticsSidebar({ profile, activeCount }: LogisticsSidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/logistics/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/logistics/orders',
      label: 'My Deliveries',
      icon: Package,
      badge: activeCount || 0,
    },
    {
      href: '/logistics/map',
      label: 'Route Map',
      icon: MapPin,
    },
    {
      href: '/logistics/completed',
      label: 'Completed',
      icon: CheckCircle,
    },
  ]

  return (
    <aside className="w-64 bg-white border-r fixed h-full z-40 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Dhaara</h1>
            <p className="text-xs text-gray-500">Logistics Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`h-5 w-5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{profile?.full_name || 'Partner'}</p>
            <p className="text-xs text-gray-500 truncate">{profile?.phone || profile?.email}</p>
          </div>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button 
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  )
}