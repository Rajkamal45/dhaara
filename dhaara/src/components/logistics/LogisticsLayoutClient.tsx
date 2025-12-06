'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Truck,
  LayoutDashboard,
  Package,
  MapPin,
  LogOut,
  CheckCircle,
  User,
  Bell,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react'

interface LogisticsLayoutClientProps {
  children: React.ReactNode
  profile: {
    full_name: string | null
    phone: string | null
    email: string | null
  }
  activeCount: number
}

export default function LogisticsLayoutClient({
  children,
  profile,
  activeCount
}: LogisticsLayoutClientProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      href: '/logistics/history',
      label: 'History & Invoices',
      icon: FileText,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${sidebarOpen ? 'w-64' : 'w-20'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-white border-r fixed h-full z-50 flex flex-col transition-all duration-300
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Truck className="h-6 w-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-lg">Dhaara</h1>
                <p className="text-xs text-gray-500">Logistics Portal</p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 bg-purple-600 text-white rounded-full items-center justify-center shadow-md hover:bg-purple-700"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-1 hover:bg-gray-100 rounded"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </div>
                {sidebarOpen && item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {!sidebarOpen && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute left-14 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
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
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top Header */}
        <header className="bg-white border-b sticky top-0 z-30 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">Delivery Partner Portal</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="h-5 w-5 text-gray-600" />
              {activeCount && activeCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>

            {/* User Info */}
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-gray-500">Welcome,</span>
              <span className="font-medium">{profile?.full_name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
