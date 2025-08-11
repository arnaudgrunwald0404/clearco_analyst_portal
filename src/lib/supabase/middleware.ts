import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const reqId = crypto.randomUUID()
  let supabaseResponse = NextResponse.next({ request })

  const beforeCookies = request.cookies.getAll().map(c => c.name)
  console.log(`[SBMID ${reqId}] Incoming cookies: ${beforeCookies.join(', ')}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          console.log(`[SBMID ${reqId}] Setting cookies: ${cookiesToSet.map(c => c.name).join(', ')}`)
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Perform a lightweight session check to trigger cookie refresh, but DO NOT redirect here.
  // Redirect logic is handled in `src/middleware.ts` to avoid conflicts with analyst local auth.
  const { data, error } = await supabase.auth.getUser()
  console.log(`[SBMID ${reqId}] getUser: user=${!!data?.user} error=${error ? error.message : 'none'}`)

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  const outCookies = supabaseResponse.cookies.getAll().map(c => c.name)
  console.log(`[SBMID ${reqId}] Outgoing cookies: ${outCookies.join(', ')}`)

  supabaseResponse.headers.set('X-Request-Id', reqId)
  return supabaseResponse
}
