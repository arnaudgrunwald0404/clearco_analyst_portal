import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const reqId = crypto.randomUUID()
  const { pathname } = new URL(request.url)
  const cookiesIn = request.cookies.getAll().map(c => c.name)
  const hasAccess = cookiesIn.includes('sb-access-token')
  const hasRefresh = cookiesIn.includes('sb-refresh-token')
  const hasEmail = cookiesIn.includes('sb-email')

  console.log(`[DBG-AUTH ${reqId}] ⇢ GET ${pathname}`)
  console.log(`[DBG-AUTH ${reqId}] Incoming cookies:`, cookiesIn.join(', '))

  let userId: string | null = null
  let userEmail: string | null = null
  let authError: string | null = null
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) authError = error.message
    userId = data.user?.id ?? null
    userEmail = data.user?.email ?? null
  } catch (e: any) {
    authError = e?.message || 'unexpected'
  }

  const body = {
    requestId: reqId,
    cookies: {
      present: cookiesIn,
      hasAccess,
      hasRefresh,
      hasEmail,
    },
    auth: {
      userId,
      userEmail,
      error: authError,
    },
    timestamp: new Date().toISOString(),
  }

  const resp = NextResponse.json(body, { status: 200 })
  resp.headers.set('X-Request-Id', reqId)
  return resp
}

