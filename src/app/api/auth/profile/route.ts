import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Test-only override: allow simulating an authenticated analyst without a Supabase session
    // Enabled only when not in production and when headers are provided by the test
    const testAnalystEmail = process.env.NODE_ENV !== 'production' ? request.headers.get('x-test-analyst-email') : null
    const testUserId = process.env.NODE_ENV !== 'production' ? request.headers.get('x-test-user-id') : null
    // Allow tests to pass a service role key via header when the app process doesn't have it
    const testServiceRoleKey = process.env.NODE_ENV !== 'production' ? request.headers.get('x-test-service-role-key') : null

    if (testAnalystEmail && testUserId) {
      const email = testAnalystEmail.toLowerCase()
      const [localPart, domainRaw] = email.split('@')
      const domain = domainRaw?.toLowerCase()

      const resolvedServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || testServiceRoleKey || ''
      const hasServiceRole = !!resolvedServiceRoleKey
      const supabaseForAnalystLookup = hasServiceRole
        ? createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            resolvedServiceRoleKey
          )
        : supabase

      // First check if a profile already exists (use service role if available)
      const { data: existingProfile } = await supabaseForAnalystLookup
        .from('user_profiles')
        .select('*')
        .eq('id', testUserId)
        .maybeSingle?.() || { data: null }

      if (existingProfile) {
        return NextResponse.json({ profile: existingProfile })
      }

      // Helper to look up analyst by email
      const lookupAnalystByEmail = async (candidateEmail: string) => {
        return await supabaseForAnalystLookup
          .from('analysts')
          .select('id, firstName, lastName, email, company, title, profileImageUrl')
          .eq('email', candidateEmail)
          .single()
      }

      // Try exact, lowercased email first
      let { data: analyst, error: analystError } = await lookupAnalystByEmail(email)

      // If not found and this is a Gmail address with a +tag, try plus-stripped variant
      if ((analystError || !analyst) && domain && (domain === 'gmail.com' || domain === 'googlemail.com') && localPart.includes('+')) {
        const plusStripped = `${localPart.split('+')[0]}@${domain}`
        const res2 = await lookupAnalystByEmail(plusStripped)
        analyst = res2.data as typeof analyst
        analystError = res2.error
      }

      if (!analystError && analyst) {
        const minimalAnalystProfile = {
          id: testUserId,
          email: email,
          role: 'ANALYST' as const,
          first_name: analyst.firstName || localPart || 'User',
          last_name: analyst.lastName || '',
          company: analyst.company || 'Analyst',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Persist when service role is available
        if (hasServiceRole) {
          try {
            const { data: upsertedProfile, error: upsertError } = await supabaseForAnalystLookup
              .from('user_profiles')
              .upsert(
                {
                  id: minimalAnalystProfile.id,
                  email: minimalAnalystProfile.email,
                  role: minimalAnalystProfile.role,
                  first_name: minimalAnalystProfile.first_name,
                  last_name: minimalAnalystProfile.last_name,
                  company: minimalAnalystProfile.company,
                  created_at: minimalAnalystProfile.created_at,
                  updated_at: minimalAnalystProfile.updated_at,
                },
                { onConflict: 'id' }
              )
              .select('*')
              .single()

            if (!upsertError && upsertedProfile) {
              return NextResponse.json({ profile: upsertedProfile })
            } else if (upsertError) {
              console.error('Analyst profile auto-create (test override) failed:', upsertError)
            }
          } catch (e) {
            console.error('Analyst profile auto-create (test override) threw:', e)
          }
        }

        // Fallback: return minimal profile without persisting
        return NextResponse.json({ profile: minimalAnalystProfile })
      }

      return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403 })
    }
    
    // Get the current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist. Allow:
      // 1) Authorized domain employees (domain-based ADMIN minimal profile)
      // 2) Registered analysts (by email lookup in analysts table)
      const email = (user.email || '').toLowerCase()
      const [localPart, domainRaw] = email.split('@')
      const domain = domainRaw?.toLowerCase()
      
      const allowedDomains = (process.env.NEXT_PUBLIC_SUPABASE_ALLOWED_DOMAINS || '').split(',').map(d => d.trim().toLowerCase()).filter(d => d.length > 0)
      const isAuthorizedDomain = allowedDomains.includes(domain)

      if (isAuthorizedDomain) {
        const minimalProfile = {
          id: user.id,
          email,
          role: 'ADMIN' as const,
          first_name: user.user_metadata?.first_name || email.split('@')[0] || 'User',
          last_name: user.user_metadata?.last_name || '',
          company: domain ? domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1) : 'Company',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        return NextResponse.json({ profile: minimalProfile })
      }

      // Not an authorized domain — check if email belongs to a registered analyst
      const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabaseForAnalystLookup = hasServiceRole
        ? createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
        : supabase

      // Helper to look up analyst by email
      const lookupAnalystByEmail = async (candidateEmail: string) => {
        return await supabaseForAnalystLookup
          .from('analysts')
          .select('id, firstName, lastName, email, company, title, profileImageUrl')
          .eq('email', candidateEmail)
          .single()
      }

      // Try exact, lowercased email first
      let { data: analyst, error: analystError } = await lookupAnalystByEmail(email)

      // If not found and this is a Gmail address with a +tag, try plus-stripped variant
      if ((analystError || !analyst) && domain && (domain === 'gmail.com' || domain === 'googlemail.com') && localPart.includes('+')) {
        const plusStripped = `${localPart.split('+')[0]}@${domain}`
        const res2 = await lookupAnalystByEmail(plusStripped)
        analyst = res2.data as typeof analyst
        analystError = res2.error
      }

      if (!analystError && analyst) {
        const minimalAnalystProfile = {
          id: user.id,
          email: email,
          role: 'ANALYST' as const,
          first_name: analyst.firstName || user.user_metadata?.first_name || localPart || 'User',
          last_name: analyst.lastName || user.user_metadata?.last_name || '',
          company: analyst.company || 'Analyst',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Auto-create profile for analysts when service role is available
        if (hasServiceRole) {
          try {
            const { data: upsertedProfile, error: upsertError } = await supabaseForAnalystLookup
              .from('user_profiles')
              .upsert(
                {
                  id: minimalAnalystProfile.id,
                  email: minimalAnalystProfile.email,
                  role: minimalAnalystProfile.role,
                  first_name: minimalAnalystProfile.first_name,
                  last_name: minimalAnalystProfile.last_name,
                  company: minimalAnalystProfile.company,
                  created_at: minimalAnalystProfile.created_at,
                  updated_at: minimalAnalystProfile.updated_at,
                },
                { onConflict: 'id' }
              )
              .select('*')
              .single()

            if (!upsertError && upsertedProfile) {
              return NextResponse.json({ profile: upsertedProfile })
            } else if (upsertError) {
              console.error('Analyst profile auto-create failed:', upsertError)
            }
          } catch (e) {
            console.error('Analyst profile auto-create threw:', e)
          }
        }

        // Fallback: return minimal profile without persisting
        return NextResponse.json({ profile: minimalAnalystProfile })
      }

      // Not authorized by domain and no matching analyst
      return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403 })
    }
    
    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }
    
    return NextResponse.json({ profile })
    
  } catch (error) {
    console.error('Auth profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
