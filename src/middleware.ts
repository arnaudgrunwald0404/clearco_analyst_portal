import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

function detectVendorSlugFromRequest(request: NextRequest): string | null {
  try {
    const url = new URL(request.url)
    const host = request.headers.get('host') || url.host
    const pathname = url.pathname || '/'

    // 1) Path prefix strategy: /v/{slug}/...
    const pathMatch = pathname.match(/^\/v\/([^\/]+)(?:\/|$)/)
    if (pathMatch && pathMatch[1]) {
      return decodeURIComponent(pathMatch[1])
    }

    // 2) Subdomain strategy: {slug}.domain.tld (ignore www/app)
    const hostNoPort = host.split(':')[0]
    const parts = hostNoPort.split('.')
    if (parts.length >= 3) {
      const first = parts[0].toLowerCase()
      if (first && first !== 'www' && first !== 'app') return first
    }
  } catch {}
  return null
}

// Resolve a vendor slug/id to vendor_domain_id using Supabase REST (Edge-safe)
async function resolveVendorIdViaSupabase(slug: string): Promise<string | null> {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!base || !key || !slug) return null

    // Build REST URL with an OR filter: id.eq.slug OR protected_domain.eq.slug OR company_name.ilike.*slug*
    const orFilter = encodeURIComponent(`(id.eq.${slug},protected_domain.eq.${slug},company_name.ilike.*${slug}*)`)
    const restUrl = `${base.replace(/\/$/, '')}/rest/v1/vendor_domains?select=id,protected_domain,company_name,logo_url,industry_name&or=${orFilter}&limit=1`

    const resp = await fetch(restUrl, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json'
      },
      // Keep timeouts conservative in middleware context
      cache: 'no-store'
    })

    if (!resp.ok) return null
    const data = (await resp.json()) as Array<{ id: string }>
    if (Array.isArray(data) && data.length > 0 && data[0]?.id) return data[0].id
    return null
  } catch {
    return null
  }
}

function attachVendorHeaders<T extends NextResponse>(res: T, reqId: string, vendorSlug: string | null, vendorId: string | null): T {
  res.headers.set('X-Request-Id', reqId)
  if (vendorSlug) res.headers.set('x-vendor-slug', vendorSlug)
  if (vendorId) res.headers.set('x-vendor-domain-id', vendorId)
  return res
}

export async function middleware(request: NextRequest) {
  const reqId = crypto.randomUUID()
  const pathname = request.nextUrl.pathname
  const ua = request.headers.get('user-agent') || 'unknown'
  const vendorSlug = detectVendorSlugFromRequest(request)
  const vendorId = vendorSlug ? await resolveVendorIdViaSupabase(vendorSlug) : null

  console.log(`[MID ${reqId}] ⇢ ${request.method} ${pathname}`)
  console.log(`[MID ${reqId}] UA: ${ua}`)
  if (vendorSlug) console.log(`[MID ${reqId}] Vendor slug detected: ${vendorSlug}${vendorId ? ` (id=${vendorId})` : ''}`)

  // Allow static assets to pass through
  if (pathname.startsWith('/banner-art/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    console.log(`[MID ${reqId}] Static asset passthrough`)
    const resp = NextResponse.next()
    return attachVendorHeaders(resp, reqId, vendorSlug, vendorId)
  }

  // Bypass middleware for auth callbacks and SSE endpoints
  if (/^\/api\/settings\/calendar-connections\/[^/]+\/sync$/.test(pathname) ||
      /^\/api\/auth\/.*\/callback$/.test(pathname) ||
      pathname === '/auth/callback') {
    const resp = NextResponse.next()
    return attachVendorHeaders(resp, reqId, vendorSlug, vendorId)
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
      return attachVendorHeaders(response, reqId, vendorSlug, vendorId)
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
      return attachVendorHeaders(notFound as NextResponse, reqId, vendorSlug, vendorId)
    }

    // Pass through with noindex headers
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    response.headers.set('Cache-Control', 'private, no-store')
    console.log(`[MID ${reqId}] Analysts preview allowed with headers set`)
    return attachVendorHeaders(response, reqId, vendorSlug, vendorId)
  }

  // Restrict app routes to allowed email domains
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
    '/settings',
    '/portal'
  ]

  if (protectedPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    try {
      // Basic auth gate via Supabase cookies
      const email = request.cookies.get('sb-email')?.value || ''

      // Supabase auth cookies (project ref is embedded; look for segment names)
      const allCookies = request.cookies.getAll()
      const accessCookie = allCookies.find(c => c.name.includes('auth-token.0'))?.value
      const refreshCookie = allCookies.find(c => c.name.includes('auth-token.1'))?.value
      const hasSession = Boolean(accessCookie || refreshCookie)

      const domain = email.split('@')[1]?.toLowerCase() || ''
      console.log(`[MID ${reqId}] Protected path access check: email=${email || 'none'} domain=${domain || 'none'} hasSession=${hasSession ? 'yes' : 'no'}`)

      // If no session at all, force login
      if (!hasSession) {
        console.warn(`[MID ${reqId}] No session on protected path. Redirecting to /auth`)
        const redir = NextResponse.redirect(new URL('/vendor_portal/login', request.url))
        return attachVendorHeaders(redir, reqId, vendorSlug, vendorId)
      }

      // If session exists but domain is not in allowed domains, redirect to /auth
      const allowedDomains = (process.env.NEXT_PUBLIC_SUPABASE_ALLOWED_DOMAINS || '').split(',').map(d => d.trim().toLowerCase()).filter(d => d.length > 0)
      if (email && !allowedDomains.includes(domain)) {
        console.warn(`[MID ${reqId}] Redirecting to /auth due to domain mismatch: ${domain}`)
        const redir = NextResponse.redirect(new URL('/vendor_portal/login', request.url))
        return attachVendorHeaders(redir, reqId, vendorSlug, vendorId)
      }
    } catch (e) {
      console.warn(`[MID ${reqId}] Protected path check error:`, e)
    }
  }

  // Apply Supabase session middleware to ensure cookies are properly set
  console.log(`[MID ${reqId}] Applying Supabase session middleware`)
  const resp = await updateSession(request)
  return attachVendorHeaders(resp, reqId, vendorSlug, vendorId)
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
