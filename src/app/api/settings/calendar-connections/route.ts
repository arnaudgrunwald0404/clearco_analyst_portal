import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/crypto'

// Initialize Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

// GET - Fetch all calendar connections for the user
export async function GET() {
  console.log('🔍 [Calendar Connections] GET request started')
  
  try {
    // For now, we'll use a hardcoded user ID
    // In production, this should come from the session/auth
    const userId = 'd129d3b9-6cb7-4e77-ac3f-f233e1e047a0' // This should be replaced with actual user authentication
    console.log('👤 [Calendar Connections] Using userId:', userId)

    console.log('📊 [Calendar Connections] Querying calendar connections...')
    const supabase = await createClient()
    
    const { data: connections, error } = await supabase
      .from('calendar_connections')
      .select(`
        id,
        email,
        provider,
        isActive,
        lastSync,
        createdAt
      `)
      .eq('userId', userId)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('❌ [Calendar Connections] Query failed:', error)
      return NextResponse.json(
        { error: 'Failed to fetch calendar connections' },
        { status: 500 }
      )
    }

    console.log('📈 [Calendar Connections] Query successful')
    console.log('📊 [Calendar Connections] Found connections:', connections?.length || 0)

    return NextResponse.json({
      success: true,
      data: connections || []
    })
  } catch (error) {
    console.error('💥 [Calendar Connections] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new calendar connection
export async function POST(request: NextRequest) {
  console.log('🔍 [Calendar Connections] POST request started')
  
  try {
    const body = await request.json()
    const { code } = body
    
    if (!code) {
      // Generate OAuth URL for initial authorization
      console.log('🔐 [Calendar Connections] Generating OAuth URL...')
      
      // Create state parameter for the OAuth flow
      const stateData = {
        connectFirst: true,
        timestamp: Date.now()
      }
      const state = Buffer.from(JSON.stringify(stateData)).toString('base64')
      
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ],
        prompt: 'consent',
        state: state
      })
      
      console.log('✅ [Calendar Connections] OAuth URL generated')
      return NextResponse.json({
        success: true,
        data: {
          authUrl
        }
      })
    }

    console.log('🔐 [Calendar Connections] Exchanging code for tokens...')
    
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()

    // Get calendar list
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    const { data: calendarList } = await calendar.calendarList.list()

    const primaryCalendar = calendarList.items?.find(cal => cal.primary) || calendarList.items?.[0]

    if (!primaryCalendar) {
      return NextResponse.json(
        { error: 'No calendar found' },
        { status: 400 }
      )
    }

    // For now, use hardcoded user ID
    const userId = 'd129d3b9-6cb7-4e77-ac3f-f233e1e047a0'

    const supabase = await createClient()

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('calendar_connections')
      .select('id')
      .eq('userId', userId)
      .eq('email', userInfo.email)
      .single()

    if (existingConnection) {
      // Update existing connection
      const { data: updatedConnection, error: updateError } = await supabase
        .from('calendar_connections')
        .update({
          accessToken: encrypt(tokens.access_token || ''),
          refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          calendarId: primaryCalendar.id,
          calendarName: primaryCalendar.summary,
          isActive: true,
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingConnection.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ [Calendar Connections] Update failed:', updateError)
        return NextResponse.json(
          { error: 'Failed to update calendar connection' },
          { status: 500 }
        )
      }

      console.log('✅ [Calendar Connections] Connection updated successfully')
      return NextResponse.json({
        success: true,
        message: 'Calendar connection updated successfully',
        data: {
          id: updatedConnection.id,
          title: updatedConnection.title,
          email: updatedConnection.email,
          isActive: updatedConnection.isActive
        }
      })
    } else {
      // Create new connection
      const connectionData = {
        id: generateId(),
        userId,
        title: `${userInfo.name}'s Calendar`,
        email: userInfo.email || '',
        accessToken: encrypt(tokens.access_token || ''),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        calendarId: primaryCalendar.id,
        calendarName: primaryCalendar.summary,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const { data: newConnection, error: createError } = await supabase
        .from('calendar_connections')
        .insert(connectionData)
        .select()
        .single()

      if (createError) {
        console.error('❌ [Calendar Connections] Create failed:', createError)
        return NextResponse.json(
          { error: 'Failed to create calendar connection' },
          { status: 500 }
        )
      }

      console.log('✅ [Calendar Connections] Connection created successfully')
      return NextResponse.json({
        success: true,
        message: 'Calendar connection created successfully',
        data: {
          id: newConnection.id,
          title: newConnection.title,
          email: newConnection.email,
          isActive: newConnection.isActive
        }
      })
    }

  } catch (error) {
    console.error('💥 [Calendar Connections] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process calendar connection', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
