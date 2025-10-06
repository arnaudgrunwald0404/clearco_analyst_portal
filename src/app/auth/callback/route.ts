import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  


  // If there's an error, redirect to auth-code-error page
  if (searchParams.get('error')) {
    console.log('OAuth error received:', searchParams.get('error'))
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  if (code) {
    // Create response object to collect cookies - redirect directly to main app
    const response = NextResponse.redirect(`${origin}/`)
    
    // Use the proper server client for consistent cookie handling
    const supabase = await createClient()
    
    
    console.log('[Auth Callback] Exchanging code for session...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('[Auth Callback] Session exchange result:', {
      hasSession: !!data.session,
      hasUser: !!data.user,
      userEmail: data.user?.email,
      error: error?.message
    })
    
    // Force cookie setting by explicitly setting the session
    if (data.session && !error) {
      console.log('[Auth Callback] Setting session cookies...')
      const { error: setError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      })
      
      console.log('[Auth Callback] Session set result:', {
        setError: setError?.message,
        success: !setError
      })
      
      // Set email cookie for middleware domain check
      if (data.user?.email) {
        response.cookies.set('sb-email', data.user.email, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        })
      }
    }
    
    if (!error && data.user) {
      try {
        // Use service role client to bypass RLS for profile creation (optional)
        const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
        const serviceClient = hasServiceRole
          ? createServiceClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            )
          : null

        if (!hasServiceRole) {
          console.warn('Service role key missing; skipping profile creation and relying on client-side fallback')
          // Redirect to app; AuthContext will handle minimal profile fallback
          return response
        }
        
        // Check if user profile exists
        const { data: profile, error: profileError } = await serviceClient!
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError && profileError.code === 'PGRST116') {
          // No profile exists. To avoid schema drift issues, skip server-side creation and rely on client to build a minimal profile.
          const email = data.user.email || ''
          const emailDomain = email.split('@')[1]?.toLowerCase()

          // Authorization checks (unchanged)
          if (email.toLowerCase() === 'dev@example.com') {
            console.error('Blocked unauthorized email:', email)
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unauthorized`)
          }

          const allowedDomains = (process.env.NEXT_PUBLIC_SUPABASE_ALLOWED_DOMAINS || '').split(',').map(d => d.trim().toLowerCase()).filter(d => d.length > 0)
          const isAuthorizedDomain = allowedDomains.includes(emailDomain)

          let isRegisteredAnalyst = false
          let isVendorDomain = false
          if (!isAuthorizedDomain) {
            const { data: analyst, error: analystError } = await (createServiceClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            ))
              .from('analysts')
              .select('id, email')
              .eq('email', email.toLowerCase())
              .single()
            isRegisteredAnalyst = !analystError && !!analyst

            console.log('🔍 Checking vendor domain for:', emailDomain)
            const { data: vendorDomain, error: vendorError } = await (createServiceClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            ))
              .from('vendor_domains')
              .select('id')
              .eq('protected_domain', emailDomain)
              .maybeSingle()
            console.log('🔍 Vendor domain query result:', { vendorDomain, vendorError })
            isVendorDomain = !!vendorDomain && !vendorError
            console.log('🔍 isVendorDomain:', isVendorDomain)
          }

          console.log('🔍 Authorization check:', { email, emailDomain, isAuthorizedDomain, isRegisteredAnalyst, isVendorDomain })
          if (!isAuthorizedDomain && !isRegisteredAnalyst && !isVendorDomain) {
            console.error('❌ Access denied for email:', email, 'Domain:', emailDomain)
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=domain_restricted`)
          }

          let role: 'SUPER_ADMIN' | 'VENDOR_ADMIN' | 'VENDOR_USER' | 'ANALYST' = 'VENDOR_USER'
          if (isAuthorizedDomain) role = 'VENDOR_ADMIN'
          else if (isRegisteredAnalyst) role = 'ANALYST'
          else if (isVendorDomain) role = 'VENDOR_USER'

          console.log('ℹ️ Skipping server-side profile creation due to schema variance; role resolved to', role)
          const redirectPath = role === 'ANALYST' ? '/analyst_portal/analyst_hub' : (isVendorDomain ? '/' : '/')
          return NextResponse.redirect(`${origin}${redirectPath}`, { headers: response.headers })
        } else if (profile) {
        // Do not block login; continue
        return response
      }
      
      // If we get here, everything worked but no profile handling needed
      return response
    } catch (dbError) {
      console.error('Database error during OAuth callback:', dbError)
      // Do not block login; continue
      return response
    }
    }
    
    console.error('Session exchange failed:', error)
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  console.log('No code provided, redirecting to auth')
  return NextResponse.redirect(`${origin}/vendor_portal/login`)
}
