import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

interface LoginRequest {
  email: string
  password?: string
  provider?: 'google'
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, provider }: LoginRequest = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Handle Google OAuth (redirects to OAuth flow)
    if (provider === 'google') {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`
        }
      })

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        redirect: data.url
      })
    }

    // Handle password authentication
    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required for email login' },
        { status: 400 }
      )
    }

    // Sign in with Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    console.log('✅ Authentication successful for:', authData.user.email)

    // TEMPORARY: Skip profile check and return basic user data
    const emailDomain = authData.user.email?.split('@')[1]?.toLowerCase()
    const emailName = authData.user.email?.split('@')[0]?.toLowerCase()
    
    // Determine role based on email
    let role: 'ADMIN' | 'EDITOR' | 'ANALYST' = 'EDITOR'
    
    if (emailDomain === 'clearcompany.com') {
      if (emailName === 'sarah.chen' || emailName === 'mike.johnson' || emailName === 'lisa.wang') {
        role = 'ANALYST'
      } else {
        role = 'ADMIN'
      }
    } else if (emailDomain === 'analystcompany.com') {
      // All @analystcompany.com users are ANALYST
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
      company: authData.user.user_metadata?.company || emailDomain || null,
      profileImageUrl: authData.user.user_metadata?.avatar_url || null,
      createdAt: authData.user.created_at,
      updatedAt: new Date().toISOString()
    }

    console.log('✅ Returning user data:', userData)

    return NextResponse.json({
      success: true,
      user: userData,
      redirectTo: role === 'ANALYST' ? '/portal' : '/'
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 