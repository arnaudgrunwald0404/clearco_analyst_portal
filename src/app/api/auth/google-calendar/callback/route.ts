import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
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

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)
  return `cl${timestamp}${randomPart}`
}

// Helper function to determine the correct settings URL based on user context
function getSettingsUrl(userRole?: string): string {
  // For now, default to analyst portal since this is primarily used by analysts
  return '/analyst_portal/settings'
}

export async function GET(request: NextRequest) {
  console.log('\n' + '='.repeat(80))
  console.log('📅 [CALENDAR OAUTH] Google Calendar OAuth callback started')
  console.log('🕐 [CALENDAR OAUTH] Timestamp:', new Date().toISOString())
  console.log('📍 [CALENDAR OAUTH] Request URL:', request.nextUrl.toString())
  
  // Verify environment variables are loaded
  console.log('🔧 [CALENDAR OAUTH] Environment check:')
  console.log('🔧 [CALENDAR OAUTH] NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing')
  console.log('🔧 [CALENDAR OAUTH] SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing')
  console.log('🌐 [CALENDAR OAUTH] Request method:', request.method)
  console.log('📋 [CALENDAR OAUTH] Request headers:', JSON.stringify(Object.fromEntries(request.headers), null, 2))
  
  // Check environment variables
  console.log('🔍 [CALENDAR OAUTH] Environment check:')
  console.log('  - GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing')
  console.log('  - GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing')
  console.log('  - GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || 'Missing')
  console.log('  - ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? 'Present' : 'Missing')
  console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? 'Present' : 'Missing')
  console.log('  - NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing')
  console.log('  - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing')
  
  // Check for required Supabase environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ [CALENDAR OAUTH] Missing required Supabase environment variables')
    return NextResponse.redirect(
      new URL(`${getSettingsUrl()}?error=missing_supabase_config`, request.url)
    )
  }
  
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
      // Try to determine user role for redirect, but default to vendor portal if unknown
      const settingsUrl = '/settings' // Default to vendor portal for errors
      return NextResponse.redirect(
        new URL(`${settingsUrl}?error=google_auth_denied`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`${getSettingsUrl()}?error=missing_auth_params`, request.url)
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
        new URL(`${getSettingsUrl()}?error=invalid_state`, request.url)
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
        new URL(`${getSettingsUrl()}?error=token_exchange_failed`, request.url)
      )
    }
    
    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL(`${getSettingsUrl()}?error=no_access_token`, request.url)
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
        new URL(`${getSettingsUrl()}?error=user_info_failed`, request.url)
      )
    }

    if (!userInfo.data.email) {
      console.error('❌ [CALENDAR OAUTH] No email found in user info')
      return NextResponse.redirect(
        new URL(`${getSettingsUrl()}?error=no_user_email`, request.url)
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
      const sClient = createServiceClient()
      
      let { data: user, error: userError } = await sClient
        .from('user_profiles')
        .select('*')
        .eq('id', user_id)
        .single()

      // PGRST116 means no rows found, which is expected for new users
      if (!user && (userError?.code === 'PGRST116' || !userError)) {
        console.log('👤 [CALENDAR OAUTH] User not found, checking if they are an analyst...')
        
        // Check if user is an analyst
        const { data: analyst, error: analystError } = await sClient
          .from('analysts')
          .select('id, email')
          .eq('email', userInfo.data.email?.toLowerCase())
          .single()
        
        // Map roles to match the current database schema
        const userRole = !analystError && analyst ? 'ANALYST' : 'VENDOR_ADMIN'
        console.log('👤 [CALENDAR OAUTH] User role determined:', userRole)
        
        console.log('👤 [CALENDAR OAUTH] Creating new user profile...')
        
        // Create user profile data with fallback values
        const now = new Date().toISOString()
        const userProfileData = {
          id: user_id,
          email: userInfo.data.email!.toLowerCase(),
          first_name: userInfo.data.given_name || userInfo.data.name?.split(' ')[0] || null,
          last_name: userInfo.data.family_name || userInfo.data.name?.split(' ').slice(1).join(' ') || null,
          name: userInfo.data.name || [userInfo.data.given_name, userInfo.data.family_name].filter(Boolean).join(' ') || null,
          company: (userInfo.data.hd as string) || null, // Google hosted domain (company)
          role: userRole as 'SUPER_ADMIN' | 'VENDOR_ADMIN' | 'VENDOR_USER' | 'ANALYST',
          password: 'oauth',
          created_at: now,
          updated_at: now,
        }
        
        console.log('👤 [CALENDAR OAUTH] User profile data:', userProfileData)
        
        // Try with service client first (should bypass RLS)
        console.log('👤 [CALENDAR OAUTH] Using service client to bypass RLS...')
        const { data: newUser, error: createError } = await sClient
          .from('user_profiles')
          .insert(userProfileData)
          .select()
          .single()
        
        if (createError) {
          console.error('❌ [CALENDAR OAUTH] User profile creation failed:', createError)
          console.error('❌ [CALENDAR OAUTH] Attempting fallback without explicit role...')
          
          // Try fallback without role (let database default handle it)
          const now2 = new Date().toISOString()
          const fallbackData = {
            id: user_id,
            email: userInfo.data.email!.toLowerCase(),
            first_name: userInfo.data.given_name || userInfo.data.name?.split(' ')[0] || null,
            last_name: userInfo.data.family_name || userInfo.data.name?.split(' ').slice(1).join(' ') || null,
            name: userInfo.data.name || [userInfo.data.given_name, userInfo.data.family_name].filter(Boolean).join(' ') || null,
            company: (userInfo.data.hd as string) || null,
            role: 'VENDOR_USER' as const,
            password: 'oauth',
            created_at: now2,
            updated_at: now2,
          }
          
          console.log('👤 [CALENDAR OAUTH] Fallback data:', fallbackData)
          const { data: fallbackUser, error: fallbackError } = await sClient
            .from('user_profiles')
            .insert(fallbackData)
            .select()
            .single()
          
          if (fallbackError) {
            console.error('❌ [CALENDAR OAUTH] Fallback also failed:', fallbackError)
            console.error('❌ [CALENDAR OAUTH] All user profile creation methods failed')
            throw fallbackError
          } else {
            user = fallbackUser
            console.log('✅ [CALENDAR OAUTH] User profile created with fallback method')
          }
        } else {
          user = newUser
          console.log('✅ [CALENDAR OAUTH] User profile created successfully')
        }
      } else if (user) {
        console.log('✅ [CALENDAR OAUTH] User profile already exists:', user.email)
      } else {
        // Only throw error if it's not a "not found" error
        throw userError
      }
    } catch (userError) {
      console.error('❌ [CALENDAR OAUTH] Error ensuring user profile exists:', userError)
      console.error('❌ [CALENDAR OAUTH] Error details:', {
        message: userError instanceof Error ? userError.message : String(userError),
        code: (userError as any)?.code,
        details: (userError as any)?.details,
        hint: (userError as any)?.hint
      })
      console.error('❌ [CALENDAR OAUTH] Full error object:', JSON.stringify(userError, null, 2))
      
      // Create a more detailed error message
      const errorDetails = {
        message: userError instanceof Error ? userError.message : String(userError),
        code: (userError as any)?.code,
        details: (userError as any)?.details,
        hint: (userError as any)?.hint
      }
      
      return NextResponse.redirect(
        new URL(`${getSettingsUrl()}?error=user_creation_failed&details=${encodeURIComponent(JSON.stringify(errorDetails))}`, request.url)
      )
    }

    // Check if this Google account is already connected
    console.log('🔍 [CALENDAR OAUTH] Checking for existing calendar connection...')
    console.log('🔑 [CALENDAR OAUTH] Looking for user_id:', user_id)
    console.log('🔑 [CALENDAR OAUTH] Looking for google_account_id:', userInfo.data.id)
    
    // Use service role for calendar connections writes - ensure proper configuration
    const supabase = createServiceClient()
    
    console.log('🔑 [CALENDAR OAUTH] Service client created with URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...')
    console.log('🔑 [CALENDAR OAUTH] Service client has key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing')
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
        new URL(`${getSettingsUrl()}?error=database_query_failed`, request.url)
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
          id: generateId(),
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

    // Determine the correct settings URL based on user role
    const settingsUrl = getSettingsUrl((existingConnection as any)?.role || undefined)
    
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
        new URL(`${settingsUrl}?${params.toString()}`, request.url)
      )
    } else {
      // Legacy flow - redirect with simple success message
      return NextResponse.redirect(
        new URL(`${settingsUrl}?success=calendar_connected`, request.url)
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
      new URL(`${getSettingsUrl()}?error=oauth_callback_failed`, request.url)
    )
  }
}
