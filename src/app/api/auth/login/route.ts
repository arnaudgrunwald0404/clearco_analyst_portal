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
    console.log(`[LOGIN ${reqId}] Body: email=${email || 'missing'} provider=${provider || 'password'} password_present=${!!password}`)

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

    // Check if email is from authorized domain OR is a registered analyst
    const isAuthorizedDomain = emailDomain === 'clearcompany.com'
    
    let isRegisteredAnalyst = false
    if (!isAuthorizedDomain) {
      // Check if email exists in analysts table
      const supabaseServiceRole = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data: analyst, error: analystError } = await supabaseServiceRole
        .from('analysts')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .single()
      
      isRegisteredAnalyst = !analystError && !!analyst
      console.log(`[LOGIN ${reqId}] isAuthorizedDomain=${isAuthorizedDomain} isRegisteredAnalyst=${isRegisteredAnalyst}`)
    }

    if (!isAuthorizedDomain && !isRegisteredAnalyst) {
      console.warn(`[LOGIN ${reqId}] Access denied (domain + analyst checks failed) for ${email}`)
      const resp = NextResponse.json(
        { 
          success: false, 
          error: 'Access restricted to ClearCompany employees and registered analysts only' 
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
    let role: 'ADMIN' | 'EDITOR' | 'ANALYST' = 'EDITOR'
    
    if (isAuthorizedDomain) {
      // All @clearcompany.com users are admins
      role = 'ADMIN'
    } else if (isRegisteredAnalyst) {
      // Registered analysts get ANALYST role
      role = 'ANALYST'
    }

    // Return user data without profile check
    const userData = {
      id: authData.user.id,
      email: authData.user.email,
      name: authData.user.user_metadata?.first_name || 
            authData.user.user_metadata?.name || 
            authData.user.email?.split('@')[0] || 'User',
      role: role,
      company: authData.user.user_metadata?.company || (isAuthorizedDomain ? 'ClearCompany' : 'Analyst') || null,
      profileImageUrl: authData.user.user_metadata?.avatar_url || null,
      createdAt: authData.user.created_at,
      updatedAt: new Date().toISOString()
    }

    console.log(`[LOGIN ${reqId}] Returning user data:`, { id: userData.id, email: userData.email, role: userData.role })

    const resp = NextResponse.json({
      success: true,
      user: userData,
      redirectTo: role === 'ANALYST' ? '/portal' : '/'
    })
    resp.headers.set('X-Request-Id', reqId)
    return resp

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
