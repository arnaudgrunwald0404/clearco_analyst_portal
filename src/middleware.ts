import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Allow static assets to pass through
  if (request.nextUrl.pathname.startsWith('/banner-art/') ||
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.startsWith('/favicon.ico') ||
      request.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    return NextResponse.next()
  }

  // Disabled authentication - always allow access for all other routes
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
