import { Package } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-primary/90 to-admin overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Floating shapes */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-admin/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-logistics/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
              <Package className="h-8 w-8" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Regional Delivery</span>
          </Link>

          {/* Main content */}
          <div className="space-y-6 max-w-lg">
            <h1 className="text-4xl font-bold leading-tight">
              Streamline Your B2B Deliveries Across Regions
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              Connect with verified retailers and restaurants. Manage orders, optimize routes, 
              and deliver efficiently with our comprehensive platform.
            </p>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-white/70">Active Retailers</div>
              </div>
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-3xl font-bold">50+</div>
                <div className="text-sm text-white/70">Regions Covered</div>
              </div>
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm text-white/70">Daily Orders</div>
              </div>
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-3xl font-bold">99%</div>
                <div className="text-sm text-white/70">Delivery Rate</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-white/60">
            © {new Date().getFullYear()} Regional Delivery. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <Package className="h-8 w-8" />
              <span className="text-xl font-bold">Regional Delivery</span>
            </Link>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  )
}
