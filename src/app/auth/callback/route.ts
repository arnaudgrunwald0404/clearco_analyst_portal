import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error_code = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  console.log('Auth callback called with:', { code: !!code, error_code, error_description })

  // Handle OAuth errors
  if (error_code) {
    console.error('OAuth error:', error_code, error_description)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error_code}`)
  }

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Session exchange result:', { 
      success: !!data.session, 
      user_id: data.user?.id, 
      error: error?.message 
    })
    
    if (!error && data.user) {
      // Check if user has a profile, and determine role-based redirect
      const { data: profile, error: profileError } = await supabase
        .from('User')
        .select('role, name')
        .eq('id', data.user.id)
        .single()

      console.log('Profile lookup result:', { 
        profile_found: !!profile, 
        role: profile?.role, 
        error: profileError?.message 
      })

      // If no profile exists, create one
      if (!profile && !profileError) {
        console.log('Creating new user profile for:', data.user.id)
        const timestamp = new Date().toISOString()

        const { error: createError } = await supabase
          .from('User')
          .insert({
            id: data.user.id,
            email: data.user.email || '',
            name: `${data.user.user_metadata?.first_name || data.user.email?.split('@')[0] || ''} ${data.user.user_metadata?.last_name || ''}`.trim(),
            password: 'oauth_user',
            role: 'ADMIN',
            createdAt: timestamp,
            updatedAt: timestamp
          })
        
        if (createError) {
          console.error('Error creating user profile:', createError)
        }
      }

      // Redirect based on role
      const userRole = profile?.role || 'ADMIN'
      if (userRole === 'ADMIN' || userRole === 'EDITOR') {
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      console.error('Session exchange failed:', error?.message)
    }
  }

  console.log('Redirecting to error page - no code or session exchange failed')
  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
