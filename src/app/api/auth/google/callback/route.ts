import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'
import { oauth2Client } from '@/lib/google/oauth'
import { decodeState } from '@/lib/utils/oauth'

export async function GET(request: NextRequest) {
  console.log('\n' + '='.repeat(80))
  console.log('🔄 [GOOGLE OAUTH] Callback started')
  console.log('⏰ [GOOGLE OAUTH] Time:', new Date().toISOString())
  console.log('🌐 [GOOGLE OAUTH] URL:', request.url)
  
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const stateParam = searchParams.get('state')
    const scope = searchParams.get('scope')

    console.log('📝 [GOOGLE OAUTH] Parameters:', {
      code: code ? 'present' : 'missing',
      error: error || 'none',
      state: stateParam ? 'present' : 'missing',
      scope
    })

    if (error) {
      console.error('❌ [GOOGLE OAUTH] Error received:', error)
      return NextResponse.redirect(
        new URL('/settings?error=google_auth_denied', request.url)
      )
    }

    if (!code || !stateParam) {
      console.error('❌ [GOOGLE OAUTH] Missing required parameters')
      console.error('   Code present:', !!code)
      console.error('   State present:', !!stateParam)
      return NextResponse.redirect(
        new URL('/settings?error=missing_params', request.url)
      )
    }

    // Decode state parameter
    let state
    try {
      console.log('🔐 [GOOGLE OAUTH] Decoding state:', stateParam)
      state = decodeState(stateParam)
      console.log('📋 [GOOGLE OAUTH] Decoded state:', state)
    } catch (error) {
      console.error('❌ [GOOGLE OAUTH] Failed to decode state:', error)
      return NextResponse.redirect(
        new URL('/settings?error=invalid_state', request.url)
      )
    }

    // Exchange code for tokens
    console.log('🔄 [GOOGLE OAUTH] Exchanging code for tokens...')
    let tokens
    try {
      const tokenResponse = await oauth2Client.getToken(code)
      tokens = tokenResponse.tokens
      console.log('✅ [GOOGLE OAUTH] Token exchange successful')
      console.log('📋 [GOOGLE OAUTH] Token types:', Object.keys(tokens).join(', '))
      console.log('⏰ [GOOGLE OAUTH] Token expiry:', tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'None')
    } catch (error) {
      console.error('❌ [GOOGLE OAUTH] Token exchange failed:', error)
      return NextResponse.redirect(
        new URL('/settings?error=token_exchange_failed', request.url)
      )
    }

    // Get user info
    console.log('👤 [GOOGLE OAUTH] Getting user information...')
    let userInfo
    try {
      oauth2Client.setCredentials(tokens)
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
      userInfo = await oauth2.userinfo.get()
      console.log('✅ [GOOGLE OAUTH] User info retrieved:', {
        email: userInfo.data.email,
        name: userInfo.data.name
      })
    } catch (error) {
      console.error('❌ [GOOGLE OAUTH] Failed to get user info:', error)
      return NextResponse.redirect(
        new URL('/settings?error=user_info_failed', request.url)
      )
    }

    // Get calendar list if this is a calendar integration
    if (state.connectFirst) {
      console.log('📅 [GOOGLE OAUTH] Getting calendar list...')
      try {
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
        const calendarList = await calendar.calendarList.list()
        
        console.log('✅ [GOOGLE OAUTH] Calendar list retrieved')
        console.log('📋 [GOOGLE OAUTH] Found calendars:', calendarList.data.items?.length || 0)

        // Store tokens and calendar info in database
        const supabase = await createClient()
        
        console.log('💾 [GOOGLE OAUTH] Storing calendar connection...')
        const { data: connection, error: connectionError } = await supabase
          .from('calendar_connections')
          .insert({
            id: `cl${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
            user_id: (state as any).userId,
            title: userInfo.data.name || userInfo.data.email || 'Google Calendar',
            email: userInfo.data.email!,
            google_account_id: userInfo.data.id!,
            access_token: tokens.access_token!,
            refresh_token: tokens.refresh_token || null,
            expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
            token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (connectionError) {
          console.error('❌ [GOOGLE OAUTH] Failed to store connection:', connectionError)
          return NextResponse.redirect(
            new URL('/settings?error=connection_store_failed', request.url)
          )
        }

        console.log('✅ [GOOGLE OAUTH] Calendar connection stored')
        console.log('🔄 [GOOGLE OAUTH] Redirecting to naming step...')

        // Redirect to calendar naming step
        const params = new URLSearchParams({
          step: 'name_calendar',
          connection_id: String(connection.id),
          email: userInfo.data.email || ''
        } as Record<string, string>)
        return NextResponse.redirect(
          new URL(`/settings/calendar?${params.toString()}`, request.url)
        )
      } catch (error) {
        console.error('❌ [GOOGLE OAUTH] Calendar integration failed:', error)
        return NextResponse.redirect(
          new URL('/settings?error=calendar_integration_failed', request.url)
        )
      }
    }

    // If not a calendar integration, proceed with normal auth flow
    console.log('🔐 [GOOGLE OAUTH] Proceeding with normal auth flow')
    const supabase = await createClient()
    
    const signInRes: any = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_token: tokens.access_token || '',
          expires_in: String(tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600),
          refresh_token: tokens.refresh_token || '',
        },
      },
    })

    const signInError = (signInRes as any)?.error
    const user = (signInRes as any)?.data?.user
    if (signInError) {
      console.error('❌ [GOOGLE OAUTH] Supabase auth error:', signInError)
      return NextResponse.redirect(
        new URL('/auth?error=auth_failed', request.url)
      )
    }

    // Ensure user profile exists and has required fields
    if (user?.id && user?.email) {
      try {
        const now = new Date().toISOString()
        await supabase
          .from('user_profiles')
          .upsert(
            {
              id: user.id,
              email: user.email.toLowerCase(),
              // default role inference can be improved later; for now, keep existing or default to VENDOR_USER
              role: 'VENDOR_USER',
              first_name: (user.user_metadata as any)?.first_name || (user.user_metadata as any)?.given_name || null,
              last_name: (user.user_metadata as any)?.last_name || (user.user_metadata as any)?.family_name || null,
              name: [
                (user.user_metadata as any)?.first_name || (user.user_metadata as any)?.given_name,
                (user.user_metadata as any)?.last_name || (user.user_metadata as any)?.family_name,
              ]
                .filter(Boolean)
                .join(' ') || null,
              company: null,
              password: 'oauth',
              created_at: now,
              updated_at: now,
            },
            { onConflict: 'id' }
          )
      } catch (e) {
        console.warn('⚠️ [GOOGLE OAUTH] Failed to upsert user profile (non-fatal):', e)
      }
    }

    // Get user role and redirect accordingly
    const { data: roleData } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user?.id)
      .single()

    const redirectPath = roleData?.role === 'ANALYST' ? '/analyst_portal/analyst_hub' : '/'
    
    console.log('✅ [GOOGLE OAUTH] Authentication successful')
    console.log('🔄 [GOOGLE OAUTH] Redirecting to:', redirectPath)
    console.log('='.repeat(80) + '\n')

    return NextResponse.redirect(new URL(redirectPath, request.url))

  } catch (error) {
    console.error('❌ [GOOGLE OAUTH] Unexpected error:')
    console.error(error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    console.log('='.repeat(80) + '\n')
    
    return NextResponse.redirect(
      new URL('/settings?error=unexpected', request.url)
    )
  }
}