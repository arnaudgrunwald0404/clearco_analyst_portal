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

    const domain = email.split('@')[1]?.toLowerCase() || ''

    // Vendor or Admin gate: allow if authorized domain admin OR email domain exists in vendor_domains
    const allowedDomains = (process.env.NEXT_PUBLIC_SUPABASE_ALLOWED_DOMAINS || '').split(',').map(d => d.trim().toLowerCase()).filter(d => d.length > 0)
    const isAdminDomain = allowedDomains.includes(domain)

    let isVendorDomain = false
    if (!isAdminDomain) {
      const supabaseService = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: vendorDomain, error: vdError } = await supabaseService
        .from('vendor_domains')
        .select('id')
        .eq('protected_domain', domain)
        .maybeSingle()

      isVendorDomain = !!vendorDomain && !vdError
    }

    if (!isAdminDomain && !isVendorDomain) {
      const resp = NextResponse.json(
        { success: false, error: 'Access restricted to vendors and admins only.' },
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
      console.log(`🔗 [VENDOR LOGIN ${reqId}] Magic link URL for ${email}:`)
      console.log(magicLinkUrl)
      console.log(`📧 [VENDOR LOGIN ${reqId}] Email sent to: ${email}`)
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
