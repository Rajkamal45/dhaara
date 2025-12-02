import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Route configuration
const publicRoutes = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password']
const adminRoutes = ['/admin']
const logisticsRoutes = ['/logistics']
const kycRequiredRoutes = ['/cart', '/checkout', '/orders']

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

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Allow public routes
  if (isPublicRoute) {
    // Redirect to appropriate dashboard if already logged in
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, kyc_status')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        if (profile.role === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        } else if (profile.role === 'logistics') {
          return NextResponse.redirect(new URL('/logistics/dashboard', request.url))
        } else if (profile.kyc_status === 'approved') {
          return NextResponse.redirect(new URL('/', request.url))
        } else {
          return NextResponse.redirect(new URL('/kyc', request.url))
        }
      }
    }
    return response
  }

  // Check authentication for protected routes
  if (!session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Get user profile for role-based access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, kyc_status, region_id')
    .eq('id', session.user.id)
    .single()

  if (!profile) {
    // No profile found, redirect to login
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin routes check
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  if (isAdminRoute) {
    if (profile.role !== 'admin') {
      // Redirect non-admins to their appropriate dashboard
      if (profile.role === 'logistics') {
        return NextResponse.redirect(new URL('/logistics/dashboard', request.url))
      }
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  // Logistics routes check
  const isLogisticsRoute = logisticsRoutes.some(route => pathname.startsWith(route))
  if (isLogisticsRoute) {
    if (profile.role !== 'logistics') {
      // Redirect non-logistics to their appropriate dashboard
      if (profile.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  // User routes - check role and KYC status
  if (profile.role === 'admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }
  if (profile.role === 'logistics') {
    return NextResponse.redirect(new URL('/logistics/dashboard', request.url))
  }

  // For regular users, check KYC status for protected actions
  const requiresKYC = kycRequiredRoutes.some(route => pathname.startsWith(route))
  if (requiresKYC && profile.kyc_status !== 'approved') {
    return NextResponse.redirect(new URL('/kyc', request.url))
  }

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
