import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ShoppingCart, User, Package, LogOut, Menu, MapPin } from 'lucide-react'
import CartButton from '@/components/customer/CartButton'

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let region = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*, region:regions(id, name, code)')
      .eq('id', user.id)
      .single()
    profile = data
    region = data?.region
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Package className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">Dhaara</span>
            </Link>

            {/* Region Indicator */}
            {region && (
              <div className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">{region.name}</span>
              </div>
            )}

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link href="/products" className="text-gray-600 hover:text-gray-900">
                Products
              </Link>
              <Link href="/categories" className="text-gray-600 hover:text-gray-900">
                Categories
              </Link>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Cart */}
              <CartButton />

              {/* User Menu */}
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/my-orders"
                    className="text-gray-600 hover:text-gray-900"
                    title="My Orders"
                  >
                    <Package className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                  >
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-green-700">
                        {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  </Link>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <User className="h-4 w-4" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-6 w-6 text-green-500" />
                <span className="text-lg font-bold">Dhaara</span>
              </div>
              <p className="text-gray-400 text-sm">
                B2B delivery platform for retailers and restaurants.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/products" className="hover:text-white">Products</Link></li>
                <li><Link href="/categories" className="hover:text-white">Categories</Link></li>
                <li><Link href="/my-orders" className="hover:text-white">My Orders</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms & Conditions</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>support@dhaara.com</li>
                <li>+91 98765 43210</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            © 2024 Dhaara. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}