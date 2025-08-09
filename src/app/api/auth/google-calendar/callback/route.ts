import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import CryptoJS from 'crypto-js'

// Initialize Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

// Encryption key for storing tokens
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-key-change-in-production'

function encryptToken(token: string): string {
  return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString()
}

export async function GET(request: NextRequest) {
  console.log('\n' + '='.repeat(80))
  console.log('📅 [CALENDAR OAUTH] Google Calendar OAuth callback started')
  console.log('🕐 [CALENDAR OAUTH] Timestamp:', new Date().toISOString())
  console.log('📍 [CALENDAR OAUTH] Request URL:', request.nextUrl.toString())
  console.log('🌐 [CALENDAR OAUTH] Request method:', request.method)
  console.log('📋 [CALENDAR OAUTH] Request headers:', JSON.stringify(Object.fromEntries(request.headers), null, 2))
  
  // Check environment variables
  console.log('🔍 [CALENDAR OAUTH] Environment check:')
  console.log('  - GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing')
  console.log('  - GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing')
  console.log('  - GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || 'Missing')
  console.log('  - ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? 'Present' : 'Missing')
  console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? 'Present' : 'Missing')
  
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const scope = searchParams.get('scope')

    console.log('📋 [CALENDAR OAUTH] OAuth Parameters:')
    console.log('  - Code:', code ? `Present (${code.substring(0, 20)}...)` : 'Missing')
    console.log('  - State:', state ? `Present (${state.substring(0, 20)}...)` : 'Missing')
    console.log('  - Error:', error || 'None')
    console.log('  - Scope:', scope || 'None')
    console.log('📊 [CALENDAR OAUTH] All search params:', Object.fromEntries(searchParams))

    if (error) {
      return NextResponse.redirect(
        new URL('/settings?error=google_auth_denied', request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings?error=missing_auth_params', request.url)
      )
    }

    // Decode the state
    let connectionData
    try {
      console.log('🔐 [CALENDAR OAUTH] Decoding state parameter...')
      const decodedState = Buffer.from(state, 'base64').toString('utf-8')
      console.log('📄 [CALENDAR OAUTH] Decoded state:', decodedState)
      connectionData = JSON.parse(decodedState)
      console.log('📊 [CALENDAR OAUTH] Parsed state data:', connectionData)
    } catch (e) {
      console.error('❌ [CALENDAR OAUTH] Failed to decode state:', e)
      return NextResponse.redirect(
        new URL('/settings?error=invalid_state', request.url)
      )
    }

    // Exchange the authorization code for access and refresh tokens
    console.log('🔄 [CALENDAR OAUTH] Exchanging authorization code for tokens...')
    console.log('🗝️ [CALENDAR OAUTH] Using client ID:', process.env.GOOGLE_CLIENT_ID)
    console.log('🔗 [CALENDAR OAUTH] Using redirect URI:', process.env.GOOGLE_REDIRECT_URI)
    
    let tokens
    try {
      const tokenResponse = await oauth2Client.getToken(code)
      tokens = tokenResponse.tokens
      console.log('✅ [CALENDAR OAUTH] Token exchange successful')
      console.log('🗝️ [CALENDAR OAUTH] Token types received:', Object.keys(tokens))
      console.log('⏰ [CALENDAR OAUTH] Token expiry:', tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'None')
    } catch (tokenError) {
      console.error('❌ [CALENDAR OAUTH] Token exchange failed:')
      console.error('📝 [CALENDAR OAUTH] Token error details:', tokenError)
      console.error('💬 [CALENDAR OAUTH] Token error message:', tokenError instanceof Error ? tokenError.message : 'Unknown error')
      return NextResponse.redirect(
        new URL('/settings?error=token_exchange_failed', request.url)
      )
    }
    
    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL('/settings?error=no_access_token', request.url)
      )
    }

    // Set credentials to get user info and calendar info
    oauth2Client.setCredentials(tokens)

    // Get user information
    console.log('👤 [CALENDAR OAUTH] Getting user information...')
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    let userInfo
    try {
      userInfo = await oauth2.userinfo.get()
      console.log('✅ [CALENDAR OAUTH] User info retrieved successfully')
      console.log('📝 [CALENDAR OAUTH] User email:', userInfo.data.email)
      console.log('📝 [CALENDAR OAUTH] User name:', userInfo.data.name)
      console.log('📝 [CALENDAR OAUTH] User ID:', userInfo.data.id)
    } catch (userError) {
      console.error('❌ [CALENDAR OAUTH] Failed to get user info:', userError)
      return NextResponse.redirect(
        new URL('/settings?error=user_info_failed', request.url)
      )
    }

    if (!userInfo.data.email) {
      console.error('❌ [CALENDAR OAUTH] No email found in user info')
      return NextResponse.redirect(
        new URL('/settings?error=no_user_email', request.url)
      )
    }

    // Get primary calendar name
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    let calendarName = userInfo.data.name || userInfo.data.email || 'Google Calendar'
    
    try {
      const calendarInfo = await calendar.calendars.get({ calendarId: 'primary' })
      if (calendarInfo.data.summary) {
        calendarName = calendarInfo.data.summary
      }
    } catch (error) {
      console.warn('Could not get calendar name, using default:', error)
    }

    // Get user ID from state (preferred) or fallback
    const user_id = connectionData.userId || 'd129d3b9-6cb7-4e77-ac3f-f233e1e047a0'
    console.log('👤 [CALENDAR OAUTH] Using user_id:', user_id)
    console.log('⚠️  [CALENDAR OAUTH] WARNING: Using hardcoded user ID - should be from session in production')

    // Ensure user exists in database (use service role to bypass any RLS)
    console.log('🔍 [CALENDAR OAUTH] Ensuring user exists in database...')
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Supabase service configuration missing')
      }
      const sClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      
      let { data: user, error: userError } = await sClient
        .from('user_profiles')
        .select('*')
        .eq('id', user_id)
        .single()

      // PGRST116 means no rows found, which is expected for new users
      if (!user && (userError?.code === 'PGRST116' || !userError)) {
        console.log('👤 [CALENDAR OAUTH] User not found, creating new user profile...')
        const { data: newUser, error: createError } = await sClient
          .from('user_profiles')
          .insert({
            id: user_id,
            first_name: userInfo.data.given_name || userInfo.data.name?.split(' ')[0] || 'User',
            last_name: userInfo.data.family_name || userInfo.data.name?.split(' ').slice(1).join(' ') || '',
            company: userInfo.data.hd || null, // Google hosted domain (company)
            role: 'ADMIN' // Default role for OAuth users
          })
          .select()
          .single()
        
        if (createError) {
          throw createError
        }
        
        user = newUser
        console.log('✅ [CALENDAR OAUTH] User profile created successfully:', user.email)
      } else if (user) {
        console.log('✅ [CALENDAR OAUTH] User profile already exists:', user.email)
      } else {
        // Only throw error if it's not a "not found" error
        throw userError
      }
    } catch (userError) {
      console.error('❌ [CALENDAR OAUTH] Error ensuring user profile exists:', userError)
      return NextResponse.redirect(
        new URL('/settings?error=user_creation_failed', request.url)
      )
    }

    // Check if this Google account is already connected
    console.log('🔍 [CALENDAR OAUTH] Checking for existing calendar connection...')
    console.log('🔑 [CALENDAR OAUTH] Looking for user_id:', user_id)
    console.log('🔑 [CALENDAR OAUTH] Looking for google_account_id:', userInfo.data.id)
    
    // Use service role for calendar connections writes
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    let existingConnection
    try {
      console.log('🔍 [CALENDAR OAUTH] Checking for existing calendar connection...')
      
      const { data: connection, error: connectionError } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('user_id', user_id)
        .eq('google_account_id', userInfo.data.id!)
        .single()
      
      if (connectionError && connectionError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw connectionError
      }
      
      existingConnection = connection
      console.log('📊 [CALENDAR OAUTH] Existing connection query result:', existingConnection ? 'Found' : 'Not found')
      if (existingConnection) {
        console.log('📝 [CALENDAR OAUTH] Existing connection details:', {
          id: existingConnection.id,
          title: existingConnection.title,
          email: existingConnection.email,
          is_active: existingConnection.is_active
        })
      }
    } catch (dbError) {
      console.error('❌ [CALENDAR OAUTH] Database query failed:', dbError)
      return NextResponse.redirect(
        new URL('/settings?error=database_query_failed', request.url)
      )
    }

    let connectionId: string
    
    if (existingConnection) {
      // Update existing connection with new tokens
      const { data: updatedConnection, error: updateError } = await supabase
        .from('calendar_connections')
        .update({
          title: connectionData.title || calendarName, // Use provided title or calendar name as default
          access_token: encryptToken(tokens.access_token),
          refresh_token: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
          expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id)
        .select()
        .single()
      
      if (updateError) {
        throw updateError
      }
      
      connectionId = updatedConnection.id
    } else {
      // Create new calendar connection with calendar name as default title
      const { data: newConnection, error: createError } = await supabase
        .from('calendar_connections')
        .insert({
          user_id: user_id,
          title: connectionData.title || calendarName, // Use provided title or calendar name as default
          email: userInfo.data.email,
          google_account_id: userInfo.data.id!,
          access_token: encryptToken(tokens.access_token),
          refresh_token: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
          expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
      
      if (createError) {
        throw createError
      }
      
      connectionId = newConnection.id
    }

    // If this is the new connect-first flow, redirect with connection details for naming
    if (connectionData.connectFirst) {
      const params = new URLSearchParams({
        success: 'calendar_connected',
        connectionId: connectionId,
        email: userInfo.data.email,
        calendarName: encodeURIComponent(calendarName)
      })
      if (connectionData.clientNonce) {
        params.set('nonce', connectionData.clientNonce)
      }
      
      return NextResponse.redirect(
        new URL(`/settings?${params.toString()}`, request.url)
      )
    } else {
      // Legacy flow - redirect with simple success message
      return NextResponse.redirect(
        new URL('/settings?success=calendar_connected', request.url)
      )
    }
  } catch (error) {
    console.error('\n❌ [CALENDAR OAUTH] CRITICAL ERROR in OAuth callback:')
    console.error('📝 [CALENDAR OAUTH] Error details:', error)
    console.error('💬 [CALENDAR OAUTH] Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('📚 [CALENDAR OAUTH] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('🏷️ [CALENDAR OAUTH] Error name:', error instanceof Error ? error.name : 'Unknown error type')
    
    // Log environment check again in error case
    console.error('🔍 [CALENDAR OAUTH] Environment check (in error):')
    console.error('  - GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing')
    console.error('  - GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing')
    console.error('  - GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || 'Missing')
    console.error('  - ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? 'Present' : 'Missing')
    console.error('  - DATABASE_URL:', process.env.DATABASE_URL ? 'Present' : 'Missing')
    
    return NextResponse.redirect(
      new URL('/settings?error=oauth_callback_failed', request.url)
    )
  }
}
