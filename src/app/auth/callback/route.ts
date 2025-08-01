import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  console.log('Auth callback received:', { 
    code: code ? 'present' : 'missing',
    origin 
  })

  // If there's an error, redirect to auth-code-error page
  if (searchParams.get('error')) {
    console.log('OAuth error received:', searchParams.get('error'))
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Session exchange result:', {
      success: !!data.session, 
      user: !!data.user,
      error: error?.message 
    })
    
    if (!error && data.user) {
      try {
        // Use service role client to bypass RLS for profile creation
        const serviceClient = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        
        // Check if user profile exists
        const { data: profile, error: profileError } = await serviceClient
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create one
          const email = data.user.email || ''
          const emailDomain = email.split('@')[1]?.toLowerCase()
          const emailName = email.split('@')[0]?.toLowerCase()
          
          // Determine role based on email domain
          let role: 'ADMIN' | 'EDITOR' | 'ANALYST' = 'EDITOR'
          
          if (emailDomain === 'clearcompany.com') {
            // Check if it's a fake analyst email
            if (emailName === 'sarah.chen' || emailName === 'mike.johnson' || emailName === 'lisa.wang') {
              role = 'ANALYST'
            } else {
              role = 'ADMIN'
            }
          } else if (emailDomain === 'analystcompany.com') {
            // All @analystcompany.com users are ANALYST
            role = 'ANALYST'
          }
          
          const defaultProfile = {
            id: data.user.id,
            role: role,
            first_name: data.user.user_metadata?.first_name || 
                       data.user.user_metadata?.name || 
                       data.user.email?.split('@')[0] || 'User',
            last_name: data.user.user_metadata?.last_name || '',
            company: data.user.user_metadata?.company || 
                    emailDomain || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const { error: createError } = await serviceClient
            .from('user_profiles')
            .insert(defaultProfile)

          if (createError) {
            console.error('Failed to create user profile with service role:', createError)
            console.error('Profile data that failed:', defaultProfile)
            
            // Try to get more information about the error
            if (createError.code) {
              console.error('Error code:', createError.code)
            }
            if (createError.details) {
              console.error('Error details:', createError.details)
            }
            
            // Try fallback with regular client
            console.log('Trying fallback with regular client...')
            const { error: fallbackError } = await supabase
              .from('user_profiles')
              .insert(defaultProfile)
            
            if (fallbackError) {
              console.error('Fallback also failed:', fallbackError)
              return NextResponse.redirect(`${origin}/auth/auth-code-error`)
            }
          }
          
          console.log('New user profile created successfully for:', data.user.email)
          console.log('Profile details:', defaultProfile)
          
          // Redirect based on role
          const redirectPath = role === 'ANALYST' ? '/portal' : '/'
          return NextResponse.redirect(`${origin}${redirectPath}`)
        } else if (profile) {
          console.log('Existing user profile found:', profile.role, data.user.email)
          
          // Redirect based on role
          const redirectPath = profile.role === 'ANALYST' ? '/portal' : '/'
          return NextResponse.redirect(`${origin}${redirectPath}`)
        } else if (profileError) {
          console.error('Error checking user profile:', profileError)
          return NextResponse.redirect(`${origin}/auth/auth-code-error`)
        }
      } catch (dbError) {
        console.error('Database error during OAuth callback:', dbError)
        return NextResponse.redirect(`${origin}/auth/auth-code-error`)
      }
    }
    
    console.error('Session exchange failed:', error)
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  console.log('No code provided, redirecting to auth')
  return NextResponse.redirect(`${origin}/auth`)
}
