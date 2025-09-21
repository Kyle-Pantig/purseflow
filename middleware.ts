import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/expenses', 
  '/reports',
  '/settings',
  '/profile'
]

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/forgot-password',
  '/reset-password'
]

// Define API routes that require authentication
const protectedApiRoutes = [
  '/api/trpc'
]

export async function middleware(req: NextRequest) {
  // Check if Supabase environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not found. Middleware will not enforce authentication.')
    return NextResponse.next()
  }

  // Get the current pathname
  const pathname = req.nextUrl.pathname
  
  // Create response object
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Create Supabase client with proper cookie handling
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        // Update the request cookies
        req.cookies.set({
          name,
          value,
          ...options,
        })
        // Update the response cookies
        res.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options: Record<string, unknown>) {
        // Remove from request cookies
        req.cookies.set({
          name,
          value: '',
          ...options,
        })
        // Remove from response cookies
        res.cookies.set({
          name,
          value: '',
          ...options,
        })
      },
    },
  })
  
  try {
    // Get the current user session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Auth session error:', error)
    }
    
    // Handle root path redirects
    if (pathname === '/') {
      if (session && session.user) {
        // User is authenticated, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url))
      } else {
        // User is not authenticated, redirect to login
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }
    
    // Check if the current route is protected
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    )
    
    // Check if the current route is a protected API route
    const isProtectedApiRoute = protectedApiRoutes.some(route => 
      pathname.startsWith(route)
    )
    
    // Check if the current route is public
    const isPublicRoute = publicRoutes.some(route => 
      pathname.startsWith(route)
    )
    
    // If user is not authenticated and trying to access protected routes
    if (!session && (isProtectedRoute || isProtectedApiRoute)) {
      // For API routes, return 401 Unauthorized
      if (isProtectedApiRoute) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      // For page routes, redirect to login
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // If user is authenticated and trying to access login page, redirect to dashboard
    if (session && isPublicRoute && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    // Continue with the request
    return res
    
  } catch (error) {
    console.error('Middleware error:', error)
    // If there's an error, allow the request to continue but log it
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (except protected ones)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Explicitly match the root path
    '/',
  ],
}
