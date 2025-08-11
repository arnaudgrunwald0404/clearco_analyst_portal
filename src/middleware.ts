import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Allow static assets to pass through
  if (request.nextUrl.pathname.startsWith('/banner-art/') ||
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.startsWith('/favicon.ico') ||
      request.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    return NextResponse.next()
  }

  const pathname = request.nextUrl.pathname

  // Preview gate for public analyst pages
  if (pathname.startsWith('/analysts/')) {
    const previewCookie = request.cookies.get('analyst_preview')?.value
    const previewToken = request.nextUrl.searchParams.get('preview')
    const secret = process.env.PREVIEW_SECRET || process.env.NEXT_PUBLIC_ANALYST_PREVIEW_SECRET || ''

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
      return response
    }

    // Allow if cookie exists; otherwise 404 to avoid discovery
    if (!previewCookie) {
      return new NextResponse('Not Found', {
        status: 404,
        headers: {
          'X-Robots-Tag': 'noindex, nofollow, noarchive',
          'Cache-Control': 'private, no-store'
        }
      })
    }

    // Pass through with noindex headers
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  }

  // Default allow
  return NextResponse.next()
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
