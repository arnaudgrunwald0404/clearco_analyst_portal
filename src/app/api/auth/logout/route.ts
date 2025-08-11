import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const reqId = crypto.randomUUID()
  console.log(`[LOGOUT ${reqId}] ⇢ POST /api/auth/logout`)
  try {
    const supabase = await createClient()
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error(`[LOGOUT ${reqId}] Logout error:`, error)
      return NextResponse.json(
        { success: false, error: 'Failed to logout' },
        { status: 500 }
      )
    }

    // Clear cookies
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    )

    // Clear auth cookies
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    response.headers.set('X-Request-Id', reqId)
    
    console.log(`[LOGOUT ${reqId}] Cleared sb-access-token/sb-refresh-token cookies`)
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
