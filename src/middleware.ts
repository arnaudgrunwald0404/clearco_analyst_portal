import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const reqId = crypto.randomUUID()
  const pathname = request.nextUrl.pathname
  const ua = request.headers.get('user-agent') || 'unknown'

  console.log(`[MID ${reqId}] ⇢ ${request.method} ${pathname}`)
  console.log(`[MID ${reqId}] UA: ${ua}`)

  // Allow static assets to pass through
  if (pathname.startsWith('/banner-art/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    console.log(`[MID ${reqId}] Static asset passthrough`)
    const resp = NextResponse.next()
    resp.headers.set('X-Request-Id', reqId)
    return resp
  }

  // Bypass middleware for SSE calendar sync endpoint to avoid interfering with streaming
  // Example: /api/settings/calendar-connections/{id}/sync
  if (/^\/api\/settings\/calendar-connections\/[^/]+\/sync$/.test(pathname)) {
    const resp = NextResponse.next()
    resp.headers.set('X-Request-Id', reqId)
    return resp
  }

  // Preview gate for public analyst pages
  if (pathname.startsWith('/analysts/')) {
    const previewCookie = request.cookies.get('analyst_preview')?.value
    const previewToken = request.nextUrl.searchParams.get('preview')
    const secret = process.env.PREVIEW_SECRET || process.env.NEXT_PUBLIC_ANALYST_PREVIEW_SECRET || ''

    console.log(`[MID ${reqId}] Analysts preview gate: cookie=${!!previewCookie} token=${previewToken ? 'present' : 'missing'}`)

    // If a valid preview token is present, set cookie and redirect to clean URL
    if (previewToken && secret && previewToken === secret) {
      const url = new URL(request.url)
      url.searchParams.delete('preview')
      const response = NextResponse.redirect(url)
      response.headers.set('X-Request-Id', reqId)
      response.cookies.set('analyst_preview', '1', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/analysts',
        maxAge: 60 * 60 // 1 hour
      })
      response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
      response.headers.set('Cache-Control', 'private, no-store')
      console.log(`[MID ${reqId}] Set preview cookie and redirect to clean URL`)
      return response
    }

    // Allow if cookie exists; otherwise 404 to avoid discovery
    if (!previewCookie) {
      console.warn(`[MID ${reqId}] Preview cookie missing. Returning 404 to avoid discovery`)
      const notFound = new NextResponse('Not Found', {
        status: 404,
        headers: {
          'X-Robots-Tag': 'noindex, nofollow, noarchive',
          'Cache-Control': 'private, no-store'
        }
      })
      notFound.headers.set('X-Request-Id', reqId)
      return notFound
    }

    // Pass through with noindex headers
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    response.headers.set('Cache-Control', 'private, no-store')
    response.headers.set('X-Request-Id', reqId)
    console.log(`[MID ${reqId}] Analysts preview allowed with headers set`)
    return response
  }

  // Restrict app routes to ClearCompany email domain by default
  const protectedPaths = [
    '/',
    '/overview',
    '/analysts',
    '/briefings',
    '/briefings/due',
    '/newsletters',
    '/testimonials',
    '/publications',
    '/awards',
    '/events',
    '/analytics',
    '/settings'
  ]

  if (protectedPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    try {
      // Use a lightweight domain check via header cookie set by Supabase; if unavailable, allow Next.js to render and client will redirect via AuthContext
      const email = request.cookies.get('sb-email')?.value || ''
      
      // Check for Supabase auth cookies (they include the project reference in the name)
      const allCookies = request.cookies.getAll()
      const accessCookie = allCookies.find(c => c.name.includes('auth-token.0'))?.value
      const refreshCookie = allCookies.find(c => c.name.includes('auth-token.1'))?.value
      

      const domain = email.split('@')[1]?.toLowerCase() || ''
      console.log(`[MID ${reqId}] Protected path access check: email=${email || 'none'} domain=${domain || 'none'} sb-access=${accessCookie ? 'present' : 'missing'} sb-refresh=${refreshCookie ? 'present' : 'missing'}`)
      
      if (email && domain !== 'clearcompany.com') {
        console.warn(`[MID ${reqId}] Redirecting to /auth due to domain mismatch: ${domain}`)
        const redir = NextResponse.redirect(new URL('/auth', request.url))
        redir.headers.set('X-Request-Id', reqId)
        return redir
      }
    } catch (e) {
      console.warn(`[MID ${reqId}] Protected path check error:`, e)
    }
  }

  // Apply Supabase session middleware to ensure cookies are properly set
  console.log(`[MID ${reqId}] Applying Supabase session middleware`)
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
