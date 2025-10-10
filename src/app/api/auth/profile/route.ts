import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  console.log('[Profile API] ===== STARTING PROFILE REQUEST =====')
  console.log('[Profile API] Request method:', request.method)
  console.log('[Profile API] Request URL:', request.url)
  
  try {
    console.log('[Profile API] Starting profile request...')
    const cookieHeader = request.headers.get('cookie') || ''
    console.log('[Profile API] Request headers:', {
      authorization: request.headers.get('authorization'),
      cookieLength: cookieHeader.length,
      hasCookie: !!cookieHeader,
      cookiePreview: cookieHeader.substring(0, 200) + (cookieHeader.length > 200 ? '...' : ''),
      userAgent: request.headers.get('user-agent')?.substring(0, 50) + '...'
    })
    
    // Log specific Supabase cookies
    const supabaseCookies = cookieHeader.split(';').filter(c => c.includes('sb-'))
    console.log('[Profile API] Supabase cookies found:', supabaseCookies.length, supabaseCookies.map(c => c.trim().substring(0, 50)))
    
    console.log('[Profile API] Creating Supabase client...')
    const supabase = await createClient()
    console.log('[Profile API] Supabase client created successfully')
    
    // Check session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('[Profile API] Session check:', {
      hasSession: !!session,
      sessionError: sessionError?.message,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    })
    
    if (sessionError) {
      console.error('[Profile API] Session error:', {
        error: sessionError,
        message: sessionError.message,
        code: sessionError.code
      })
    }

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
        ? createServiceClient()
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
                  name: `${minimalAnalystProfile.first_name} ${minimalAnalystProfile.last_name}`.trim() || null,
                  company: minimalAnalystProfile.company,
                  password: 'oauth',
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
    
    console.log('[Profile API] Auth check:', { 
      hasUser: !!user, 
      userEmail: user?.email, 
      userError: userError?.message,
      userId: user?.id 
    })
    
    if (userError || !user) {
      console.error('[Profile API] Authentication failed:', userError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Fetch user profile
    console.log('[Profile API] Fetching profile for user:', user.id, user.email)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    console.log('[Profile API] Profile query result:', {
      hasProfile: !!profile,
      profileError: profileError?.message,
      errorCode: profileError?.code
    })
    
    if (profileError && profileError.code === 'PGRST116') {
      console.log('[Profile API] Profile not found (PGRST116), checking fallback options...')
      // Profile doesn't exist. Allow:
      // 1) Authorized domain employees (domain-based ADMIN minimal profile)
      // 2) Registered analysts (by email lookup in analysts table)
      const email = (user.email || '').toLowerCase()
      const [localPart, domainRaw] = email.split('@')
      const domain = domainRaw?.toLowerCase()
      
      console.log('[Profile API] Fallback check:', { email, domain, localPart })
      
      const allowedDomains = (process.env.NEXT_PUBLIC_SUPABASE_ALLOWED_DOMAINS || '').split(',').map(d => d.trim().toLowerCase()).filter(d => d.length > 0)
      const isAuthorizedDomain = allowedDomains.includes(domain)

      if (isAuthorizedDomain) {
        const minimalProfile = {
          id: user.id,
          email,
          role: 'VENDOR_ADMIN' as const,
          first_name: user.user_metadata?.first_name || email.split('@')[0] || 'User',
          last_name: user.user_metadata?.last_name || '',
          company: domain ? domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1) : 'Company'
        }
        
        return NextResponse.json({ profile: minimalProfile })
      }

      // Not an authorized domain — check if email belongs to a registered analyst
      console.log('[Profile API] Not authorized domain, checking analyst lookup...')
      const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabaseForAnalystLookup = hasServiceRole
        ? createServiceClient()
        : supabase

      console.log('[Profile API] Service role available:', hasServiceRole)

      // Helper to look up analyst by email
      const lookupAnalystByEmail = async (candidateEmail: string) => {
        console.log('[Profile API] Looking up analyst by email:', candidateEmail)
        const result = await supabaseForAnalystLookup
          .from('analysts')
          .select('id, firstName, lastName, email, company, title, profileImageUrl')
          .eq('email', candidateEmail)
          .single()
        
        console.log('[Profile API] Analyst lookup result:', {
          found: !!result.data,
          error: result.error?.message,
          errorCode: result.error?.code
        })
        
        return result
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
          company: analyst.company || 'Analyst'
        }

        // Auto-create profile for analysts when service role is available
        if (hasServiceRole) {
          try {
            // Discover available columns to construct a compatible upsert
            let cols: string[] = []
            try {
              const { data: c } = await (supabaseForAnalystLookup as any)
                .from('information_schema.columns')
                .select('column_name')
                .eq('table_schema', 'public')
                .eq('table_name', 'user_profiles')
              cols = (c as any[])?.map((x: any) => x.column_name) || []
            } catch {}

            const can = (n: string) => cols.includes(n)
            // Always include role and email when possible; many schemas require them
            let upsertRow: any = { id: minimalAnalystProfile.id, role: minimalAnalystProfile.role }
            if (can('email')) upsertRow.email = minimalAnalystProfile.email
            // Only include optional fields if present in schema
            if (can('first_name')) upsertRow.first_name = minimalAnalystProfile.first_name
            if (can('last_name')) upsertRow.last_name = minimalAnalystProfile.last_name
            if (can('company')) upsertRow.company = minimalAnalystProfile.company
            if (can('password')) upsertRow.password = 'oauth'
            if (can('created_at')) upsertRow.created_at = new Date().toISOString()
            if (can('updated_at')) upsertRow.updated_at = new Date().toISOString()

            let { data: upsertedProfile, error: upsertError } = await supabaseForAnalystLookup
              .from('user_profiles')
              .upsert(upsertRow, { onConflict: 'id' })
              .select('*')
              .single()

            // If schema doesn't have email, retry without it
            if (upsertError && upsertError.code === 'PGRST204' && (upsertError.message || '').includes("'email'")) {
              const copy = { ...upsertRow }
              delete (copy as any).email
              const retry = await supabaseForAnalystLookup
                .from('user_profiles')
                .upsert(copy, { onConflict: 'id' })
                .select('*')
                .single()
              upsertedProfile = retry.data
              upsertError = retry.error
            }

            // If NOT NULL violation for password/updated_at/created_at, retry with safe defaults
            if (upsertError && upsertError.code === '23502') {
              const msg = `${upsertError.message || ''} ${upsertError.details || ''}`
              const needsPw = msg.includes('"password"')
              const needsUpdatedAt = msg.includes('"updated_at"') || msg.includes('"updatedAt"')
              const needsCreatedAt = msg.includes('"created_at"') || msg.includes('"createdAt"')
              if (needsPw || needsUpdatedAt || needsCreatedAt) {
                const copy: any = { ...upsertRow }
                if (needsPw) copy.password = 'oauth'
                if (needsUpdatedAt) copy.updated_at = new Date().toISOString()
                if (needsCreatedAt) copy.created_at = new Date().toISOString()
                const retry = await supabaseForAnalystLookup
                  .from('user_profiles')
                  .upsert(copy, { onConflict: 'id' })
                  .select('*')
                  .single()
                upsertedProfile = retry.data
                upsertError = retry.error
                // If schema doesn’t have any of these columns, ignore PGRST204
                if (upsertError && upsertError.code === 'PGRST204') {
                  upsertError = null as any
                }
              }
            }

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
      console.log('[Profile API] No matching analyst found, returning 403')
      return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403 })
    }
    
    if (profileError) {
      console.error('[Profile API] Profile fetch error (non-PGRST116):', {
        error: profileError,
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      })

      // If a service role key is available, retry the profile fetch using service client
      // to bypass RLS for trusted server-side use cases.
      try {
        const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
        if (hasServiceRole) {
          const service = createServiceClient()
          const { data: srProfile, error: srErr } = await service
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (!srErr && srProfile) {
            console.log('[Profile API] Service-role retry succeeded; returning profile')
            return NextResponse.json({ profile: srProfile })
          }

          if (srErr) {
            console.error('[Profile API] Service-role retry failed:', {
              code: srErr.code,
              message: srErr.message,
              details: srErr.details,
              hint: srErr.hint
            })
          }
        }
      } catch (retryErr) {
        console.error('[Profile API] Service-role retry threw:', retryErr)
      }

      // If we reach here, translate likely permission errors to 403; otherwise 500
      const code = profileError.code || ''
      const isPermission = code === '42501' || code === 'PGRST301' || (profileError.message || '').toLowerCase().includes('permission')
      const status = isPermission ? 403 : 500
      const devDetails = process.env.NODE_ENV !== 'production' ? {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      } : {}
      return NextResponse.json({ error: isPermission ? 'Forbidden' : 'Failed to fetch profile', ...devDetails }, { status })
    }
    
    console.log('[Profile API] ===== PROFILE REQUEST SUCCESS =====')
    return NextResponse.json({ profile })
    
  } catch (error) {
    console.error('[Profile API] ===== UNEXPECTED ERROR =====')
    console.error('[Profile API] Error details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      type: typeof error,
      constructor: error?.constructor?.name
    })
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error'
    console.error('[Profile API] Returning 500 error:', errorMessage)
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
