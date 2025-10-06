import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const reqId = crypto.randomUUID()
  console.log(`[LOGOUT ${reqId}] ⇢ POST /api/auth/logout`)
  try {
    const supabase = await createClient()

    // Try to sign out via Supabase helper (will emit Set-Cookie to clear auth tokens)
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.warn(`[LOGOUT ${reqId}] supabase.auth.signOut reported error (continuing with cookie purge):`, error)
    }

    // Build response and aggressively purge any Supabase auth cookies that might remain
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    )

    // 1) Legacy names (no-op if absent)
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')

    // 2) Next.js helper cookie format: sb-<anon-key>-auth-token(.0|.1)
    const all = request.cookies.getAll() || []
    const toDelete = all
      .map(c => c.name)
      .filter(name => name.startsWith('sb-') && name.includes('-auth-token'))

    if (toDelete.length > 0) {
      console.log(`[LOGOUT ${reqId}] Purging auth cookies:`, toDelete)
    } else {
      console.log(`[LOGOUT ${reqId}] No dynamic auth cookies detected in request`)
    }

    for (const name of toDelete) {
      response.cookies.delete(name)
    }

    // Optional: clear convenience cookies we set (like sb-email)
    if (request.cookies.get('sb-email')) {
      response.cookies.delete('sb-email')
    }

    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('X-Request-Id', reqId)

    return response
  } catch (error) {
    console.error(`[LOGOUT ${reqId}] Logout error:`, error)
    const resp = NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
    resp.headers.set('X-Request-Id', reqId)
    return resp
  }
} 
