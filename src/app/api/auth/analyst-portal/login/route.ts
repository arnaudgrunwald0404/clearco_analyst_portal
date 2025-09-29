import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const reqId = crypto.randomUUID()
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      const resp = NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
      resp.headers.set('X-Request-Id', reqId)
      return resp
    }

    // Check analysts table for email (analyst-only gate)
    const supabaseService = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: analyst, error: analystError } = await supabaseService
      .from('analysts')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single()

    if (analystError || !analyst) {
      const resp = NextResponse.json(
        { success: false, error: 'Access restricted to registered analysts only. If you are internal, use /auth.' },
        { status: 403 }
      )
      resp.headers.set('X-Request-Id', reqId)
      return resp
    }

    // Send magic link
    const supabase = await createClient()
    const { data: magicLinkData, error: magicError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/auth/callback`
      }
    })

    if (magicError) {
      const resp = NextResponse.json({ success: false, error: magicError.message }, { status: 400 })
      resp.headers.set('X-Request-Id', reqId)
      return resp
    }

    // Log magic link URL for development testing
    if (magicLinkData?.user?.email_confirmation_token) {
      const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/auth/callback?token=${magicLinkData.user.email_confirmation_token}&type=magiclink`
      console.log(`🔗 [ANALYST LOGIN ${reqId}] Magic link URL for ${email}:`)
      console.log(magicLinkUrl)
      console.log(`📧 [ANALYST LOGIN ${reqId}] Email sent to: ${email}`)
    }

    const resp = NextResponse.json({ success: true, message: 'Magic link sent' })
    resp.headers.set('X-Request-Id', reqId)
    return resp
  } catch (error) {
    const resp = NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    resp.headers.set('X-Request-Id', reqId)
    return resp
  }
}
