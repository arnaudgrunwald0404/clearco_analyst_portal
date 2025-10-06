import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

interface LoginRequest {
  email: string
  password?: string
  provider?: 'google'
}

export async function POST(request: NextRequest) {
  const reqId = crypto.randomUUID()
  const { pathname, origin } = new URL(request.url)
  console.log(`[LOGIN ${reqId}] ⇢ POST ${pathname}`)
  try {
    const { email, password, provider }: LoginRequest = await request.json()
    console.log(`[LOGIN ${reqId}] Body: email=${email || 'missing'} provider=${provider || 'magic'} password_present=${!!password}`)

    if (!email) {
      console.warn(`[LOGIN ${reqId}] Missing email`)
      const resp = NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
      resp.headers.set('X-Request-Id', reqId)
      return resp
    }

    // Validate email domain and block unauthorized users
    const emailDomain = email.split('@')[1]?.toLowerCase()
    console.log(`[LOGIN ${reqId}] Email domain: ${emailDomain}`)
    
    // Block dev@example.com specifically
    if (email.toLowerCase() === 'dev@example.com') {
      console.warn(`[LOGIN ${reqId}] Blocked unauthorized email dev@example.com`)
      const resp = NextResponse.json(
        { success: false, error: 'This email is not authorized for access' },
        { status: 403 }
      )
      resp.headers.set('X-Request-Id', reqId)
      return resp
    }

    // Check if email exists in auth.users table OR is a registered analyst
    const supabaseServiceRole = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
// Check if email exists in auth.users table (scan first page)
    let isExistingAuthUser = false
    try {
      const list = await supabaseServiceRole.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const found = list?.data?.users?.find?.((u: any) => (u.email || '').toLowerCase() === email.toLowerCase())
      isExistingAuthUser = !!found
    } catch (e) {
      console.warn(`[LOGIN ${reqId}] Could not list auth users:`, e)
    }
    
    // Check if email exists in analysts table
    const { data: analyst, error: analystError } = await supabaseServiceRole
      .from('analysts')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single()
    
    const isRegisteredAnalyst = !analystError && !!analyst
    console.log(`[LOGIN ${reqId}] isExistingAuthUser=${isExistingAuthUser} isRegisteredAnalyst=${isRegisteredAnalyst}`)

    if (!isExistingAuthUser && !isRegisteredAnalyst) {
      console.warn(`[LOGIN ${reqId}] Access denied (auth user + analyst checks failed) for ${email}`)
      const resp = NextResponse.json(
        { 
          success: false, 
          error: 'Access restricted to existing users and registered analysts only' 
        },
        { status: 403 }
      )
      resp.headers.set('X-Request-Id', reqId)
      return resp
    }

    const supabase = await createClient()

    // Handle Google OAuth (redirects to OAuth flow)
    if (provider === 'google') {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || origin}/auth/callback`
        }
      })

      if (error) {
        console.error(`[LOGIN ${reqId}] OAuth error:`, error)
        const resp = NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
        resp.headers.set('X-Request-Id', reqId)
        return resp
      }

      console.log(`[LOGIN ${reqId}] OAuth redirect generated`)
      const resp = NextResponse.json({
        success: true,
        redirect: data.url
      })
      resp.headers.set('X-Request-Id', reqId)
      return resp
    }

    // Handle magic link authentication (default)
    // Password authentication has been disabled
    if (password) {
      console.warn(`[LOGIN ${reqId}] Password authentication is disabled`)
      const resp = NextResponse.json(
        { success: false, error: 'Password authentication is not supported. Please use Google OAuth or magic link.' },
        { status: 400 }
      )
      resp.headers.set('X-Request-Id', reqId)
      return resp
    }

    // Send magic link
    const { data: magicLinkData, error: magicLinkError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || origin}/auth/callback`
      }
    })

    if (magicLinkError) {
      console.error(`[LOGIN ${reqId}] Magic link error:`, magicLinkError)
      const resp = NextResponse.json(
        { success: false, error: magicLinkError.message },
        { status: 400 }
      )
      resp.headers.set('X-Request-Id', reqId)
      return resp
    }

// Note: Supabase v2 no longer exposes an email_confirmation_token here in types; rely on email delivery.
    console.log(`📧 [LOGIN ${reqId}] Magic link requested for: ${email}`)

    console.log(`[LOGIN ${reqId}] ✅ Magic link sent successfully to: ${email}`)
    const resp = NextResponse.json({
      success: true,
      message: 'Magic link sent! Check your email and click the link to sign in.'
    })
    resp.headers.set('X-Request-Id', reqId)
    return resp

    // Commented out password authentication
    /*
    // Handle password authentication
    if (!password) {
      console.warn(`[LOGIN ${reqId}] Missing password for password login`)
      const resp = NextResponse.json(
        { success: false, error: 'Password is required for email login' },
        { status: 400 }
      )
      resp.headers.set('X-Request-Id', reqId)
      return resp
    }

    // Sign in with Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      console.warn(`[LOGIN ${reqId}] Invalid credentials for ${email}`)
      const resp = NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
      resp.headers.set('X-Request-Id', reqId)
      return resp
    }

    console.log(`[LOGIN ${reqId}] ✅ Authentication successful for: ${authData.user.email}`)

    // Determine role based on validated authorization
    let role: 'SUPER_ADMIN' | 'VENDOR_ADMIN' | 'VENDOR_USER' | 'ANALYST' = 'VENDOR_USER'
    
    if (isRegisteredAnalyst) {
      // Registered analysts get ANALYST role
      role = 'ANALYST'
    } else if (isExistingAuthUser) {
      // Existing auth users get VENDOR_ADMIN role by default
      role = 'VENDOR_ADMIN'
    }

   

    console.log(`[LOGIN ${reqId}] Returning user data:`, { id: userData.id, email: userData.email, role: userData.role })

    const resp = NextResponse.json({
      success: true,
      user: userData,
      redirectTo: role === 'ANALYST' ? '/analyst_portal/analyst_hub' : '/'
    })
    resp.headers.set('X-Request-Id', reqId)
    return resp
    */

  } catch (error) {
    console.error(`[LOGIN ${reqId}] Login error:`, error)
    const resp = NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
    resp.headers.set('X-Request-Id', reqId)
    return resp
  }
} 
