import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Auth routes - accessible without login
const authRoutes = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password']

// Role-based route prefixes
const adminRoutes = ['/admin']
const logisticsRoutes = ['/logistics']

// Routes that require KYC approval for customers
const kycRequiredRoutes = ['/cart', '/checkout', '/my-orders']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const pathname = request.nextUrl.pathname

  // Determine route type
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isLogisticsRoute = logisticsRoutes.some(route => pathname.startsWith(route))
  const requiresKYC = kycRequiredRoutes.some(route => pathname.startsWith(route))

  // ========================================
  // 1. AUTH ROUTES (login, register, etc.)
  // ========================================
  if (isAuthRoute) {
    // If already logged in, redirect to appropriate dashboard
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, admin_role, kyc_status')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        // Admin users
        if (profile.role === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        }
        // Logistics users
        if (profile.role === 'logistics') {
          return NextResponse.redirect(new URL('/logistics/dashboard', request.url))
        }
        // Regular customers - check KYC
        if (profile.kyc_status === 'approved') {
          return NextResponse.redirect(new URL('/', request.url))
        } else {
          return NextResponse.redirect(new URL('/kyc', request.url))
        }
      }
    }
    // Not logged in - allow access to auth pages
    return response
  }

  // ========================================
  // 2. NOT LOGGED IN - Redirect to Login
  // ========================================
  if (!session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // ========================================
  // 3. LOGGED IN - Get User Profile
  // ========================================
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, admin_role, kyc_status, region_id')
    .eq('id', session.user.id)
    .single()

  // No profile found - sign out and redirect to login
  if (!profile) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ========================================
  // 4. ADMIN ROUTES
  // ========================================
  if (isAdminRoute) {
    if (profile.role !== 'admin') {
      // Not an admin - redirect to their dashboard
      if (profile.role === 'logistics') {
        return NextResponse.redirect(new URL('/logistics/dashboard', request.url))
      }
      // Regular user
      return NextResponse.redirect(new URL('/', request.url))
    }
    // Is admin - allow access
    return response
  }

  // ========================================
  // 5. LOGISTICS ROUTES
  // ========================================
  if (isLogisticsRoute) {
    if (profile.role !== 'logistics') {
      // Not logistics - redirect to their dashboard
      if (profile.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      // Regular user
      return NextResponse.redirect(new URL('/', request.url))
    }
    // Is logistics - allow access
    return response
  }

  // ========================================
  // 6. CUSTOMER/USER ROUTES
  // ========================================
  
  // Admins trying to access customer pages - redirect to admin dashboard
  if (profile.role === 'admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Logistics trying to access customer pages - redirect to logistics dashboard
  if (profile.role === 'logistics') {
    return NextResponse.redirect(new URL('/logistics/dashboard', request.url))
  }

  // Regular customers - check KYC for protected routes
  if (requiresKYC && profile.kyc_status !== 'approved') {
    return NextResponse.redirect(new URL('/kyc', request.url))
  }

  // Allow access
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}