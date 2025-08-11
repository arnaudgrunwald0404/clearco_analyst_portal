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
    // Create response object to collect cookies
    const response = NextResponse.redirect(`${origin}/`)
    
    // Use the middleware approach for consistent cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              
              // Use original options from Supabase, but ensure proper settings for client access
              response.cookies.set(name, value, {
                ...options,
                httpOnly: false, // CRITICAL: Allow client-side access
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
              })
            })
          },
        },
      }
    )
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    // Force cookie setting by explicitly setting the session
    if (data.session && !error) {
      const { error: setError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
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
          // Profile doesn't exist, create one
          const email = data.user.email || ''
          const emailDomain = email.split('@')[1]?.toLowerCase()
          
          // Apply domain validation - block unauthorized users
          if (email.toLowerCase() === 'dev@example.com') {
            console.error('Blocked unauthorized email:', email)
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unauthorized`)
          }

          // Check if email is from authorized domain OR is a registered analyst
          const isAuthorizedDomain = emailDomain === 'clearcompany.com'
          
          let isRegisteredAnalyst = false
          if (!isAuthorizedDomain) {
            // Check if email exists in analysts table
            const { data: analyst, error: analystError } = await serviceClient!
              .from('analysts')
              .select('id, email')
              .eq('email', email.toLowerCase())
              .single()
            
            isRegisteredAnalyst = !analystError && !!analyst
          }

          if (!isAuthorizedDomain && !isRegisteredAnalyst) {
            console.error('Access denied for email:', email, 'Domain:', emailDomain)
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=domain_restricted`)
          }

          // Determine role based on validated authorization
          let role: 'ADMIN' | 'EDITOR' | 'ANALYST' = 'EDITOR'
          
          if (isAuthorizedDomain) {
            // All @clearcompany.com users are admins
            role = 'ADMIN'
          } else if (isRegisteredAnalyst) {
            // Registered analysts get ANALYST role
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
                    (isAuthorizedDomain ? 'ClearCompany' : 'Analyst') || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const { error: createError } = await serviceClient!
            .from('user_profiles')
            .insert(defaultProfile)

          if (createError) {
            console.error('Failed to create user profile with service role:', createError)
            console.error('Profile data that failed:', defaultProfile)
            
            // Try fallback with regular client (may succeed if RLS allows it)
            console.log('Trying fallback with regular client...')
            const { error: fallbackError } = await supabase
              .from('user_profiles')
              .insert(defaultProfile)
            
            if (fallbackError) {
              console.error('Fallback also failed:', fallbackError)
              // Do not block login; redirect and let client-side fallback handle
              const redirectPath = role === 'ANALYST' ? '/portal' : '/'
              return NextResponse.redirect(`${origin}${redirectPath}`, { 
                headers: response.headers 
              })
            }
          }
          
          console.log('New user profile created successfully for:', data.user.email)
          console.log('Profile details:', defaultProfile)
          
          // Redirect based on role
          const redirectPath = role === 'ANALYST' ? '/portal' : '/'
          return NextResponse.redirect(`${origin}${redirectPath}`, { 
            headers: response.headers 
          })
        } else if (profile) {
          
          // Redirect based on role
          const redirectPath = profile.role === 'ANALYST' ? '/portal' : '/'
          return NextResponse.redirect(`${origin}${redirectPath}`, { 
            headers: response.headers 
          })
        } else if (profileError) {
          console.error('Error checking user profile:', profileError)
          // Do not block login; continue
          return response
        }
      } catch (dbError) {
        console.error('Database error during OAuth callback:', dbError)
        // Do not block login; continue
        return response
      }
      
      // If we get here, everything worked but no profile handling needed
      return response
    }
    
    console.error('Session exchange failed:', error)
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  console.log('No code provided, redirecting to auth')
  return NextResponse.redirect(`${origin}/auth`)
}
