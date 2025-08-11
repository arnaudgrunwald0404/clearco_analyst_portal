import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import CryptoJS from 'crypto-js'
import { Pool } from 'pg'
import { requireAuth } from '@/lib/auth-utils'

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

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-key-change-in-production'
const encryptToken = (token: string | null | undefined) => token ? CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString() : null

// GET - Fetch all calendar connections for the user
export async function GET() {
  console.log('\n' + '='.repeat(80))
  console.log('🔍 [Calendar Connections GET] Request started')
  console.log('🕐 [Calendar Connections GET] Timestamp:', new Date().toISOString())
  console.log('📍 [Calendar Connections GET] Environment check:')
  console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? 'Present' : 'Missing')
  console.log('  - GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing')
  console.log('  - GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing')
  
  try {
    console.log('🔐 [Calendar Connections GET] Starting authentication check...')
    // Check authentication first
    const authResult = await requireAuth()
    
    // If it's a NextResponse (error), return it directly
    if (authResult instanceof NextResponse) {
      console.log('❌ [Calendar Connections GET] Authentication failed - returning error response')
      return authResult
    }
    
    console.log('✅ [Calendar Connections GET] Authentication successful')
    // Otherwise it's the user
    const user = authResult
    const user_id = user.id
    console.log('👤 [Calendar Connections GET] User authenticated - ID:', user_id)
    console.log('👤 [Calendar Connections GET] User email:', user.email || 'No email')
    console.log('👤 [Calendar Connections GET] User metadata:', JSON.stringify(user.user_metadata || {}, null, 2))

    console.log('🔗 [Calendar Connections GET] Using Supabase SSR client')
    const supabase = await createClient()

    console.log('📊 [Calendar Connections GET] Querying Supabase...')
    const { data, error } = await supabase
      .from('calendar_connections')
      .select('id, title, email, is_active, last_sync_at, created_at, user_id')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ [Calendar Connections GET] Supabase query error:', error)
      return NextResponse.json({ success: false, error: 'Failed to load connections' }, { status: 500 })
    }

    const connections = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      email: row.email,
      is_active: row.is_active ?? null,
      last_sync_at: row.last_sync_at ?? null,
      created_at: row.created_at ?? null,
    }))

    console.log('✅ [Calendar Connections GET] Query executed successfully, rows:', connections.length)

    return NextResponse.json({ success: true, data: connections })
  } catch (error) {
    console.error('💥 [Calendar Connections GET] Unexpected error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: message },
      { status: 500 }
    )
  }
}

// POST - Create a new calendar connection
export async function POST(request: NextRequest) {
  console.log('\n' + '='.repeat(80))
  console.log('🔍 [Calendar Connections POST] Request started')
  console.log('🕐 [Calendar Connections POST] Timestamp:', new Date().toISOString())
  console.log('🌍 [Calendar Connections POST] Request URL:', request.url)
  console.log('📍 [Calendar Connections POST] Environment check:')
  console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? 'Present' : 'Missing')
  console.log('  - GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing')
  console.log('  - GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing')
  console.log('  - GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI ? 'Present' : 'Missing')
  console.log('  - ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? 'Present' : 'Missing')
  
  try {
    console.log('🔐 [Calendar Connections POST] Starting authentication check...')
    // Check authentication first
    const authResult = await requireAuth()
    
    // If it's a NextResponse (error), return it directly
    if (authResult instanceof NextResponse) {
      console.log('❌ [Calendar Connections POST] Authentication failed - returning error response')
      return authResult
    }
    
    console.log('✅ [Calendar Connections POST] Authentication successful')
    // Otherwise it's the user
    const user = authResult
    console.log('👤 [Calendar Connections POST] User authenticated - ID:', user.id)
    console.log('👤 [Calendar Connections POST] User email:', user.email || 'No email')
    
    console.log('📝 [Calendar Connections POST] Parsing request body...')
    const body = await request.json()
    console.log('📝 [Calendar Connections POST] Request body keys:', Object.keys(body))
    console.log('📝 [Calendar Connections POST] Body content:', JSON.stringify(body, null, 2))
    
    const { code, clientNonce } = body
    console.log('🔑 [Calendar Connections POST] Authorization code present:', !!code)
    if (code) {
      console.log('🔑 [Calendar Connections POST] Code length:', code.length)
      console.log('🔑 [Calendar Connections POST] Code preview:', code.substring(0, 20) + '...')
    }
    
    if (!code) {
      // Generate OAuth URL for initial authorization
      console.log('🔐 [Calendar Connections] Generating OAuth URL...')
      
      // Create state parameter for the OAuth flow
      const stateData = {
        connectFirst: true,
        timestamp: Date.now(),
        userId: user.id,
        purpose: 'calendar_connect',
        clientNonce: clientNonce || null
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

    const user_id = user.id

    // Use direct PostgreSQL connection
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })
    
    const client = await pool.connect()
    
    try {
      // Check if connection already exists
      const existingResult = await client.query(`
        SELECT id FROM "calendar_connections" 
        WHERE user_id = $1 AND email = $2
      `, [user_id, userInfo.email])
      
      const existingConnection = existingResult.rows[0]

      if (existingConnection) {
        // Update existing connection
        const updateResult = await client.query(`
          UPDATE "calendar_connections" 
          SET access_token = $1, refresh_token = $2, expires_at = $3,
              is_active = $4, updated_at = $5
          WHERE id = $6
          RETURNING id, title, email, is_active
        `, [
          encryptToken(tokens.access_token || ''),
          encryptToken(tokens.refresh_token || undefined),
          tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          true,
          new Date().toISOString(),
          existingConnection.id
        ])

        const updatedConnection = updateResult.rows[0]
        console.log('✅ [Calendar Connections] Connection updated successfully')
        
        return NextResponse.json({
          success: true,
          message: 'Calendar connection updated successfully',
          data: {
            id: updatedConnection.id,
            title: updatedConnection.title,
            email: updatedConnection.email,
            is_active: updatedConnection.is_active
          }
        })
      } else {
        // Create new connection
        const connectionId = generateId()
        const insertResult = await client.query(`
          INSERT INTO "calendar_connections" (
            id, user_id, title, email, access_token,
            refresh_token, expires_at, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id, title, email, is_active
        `, [
          connectionId,
          user_id,
          `${userInfo.name}'s Calendar`,
          userInfo.email || '',
          encryptToken(tokens.access_token || ''),
          encryptToken(tokens.refresh_token || undefined),
          tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          true,
          new Date().toISOString(),
          new Date().toISOString()
        ])

        const newConnection = insertResult.rows[0]
        console.log('✅ [Calendar Connections] Connection created successfully')
        
        return NextResponse.json({
          success: true,
          message: 'Calendar connection created successfully',
          data: {
            id: newConnection.id,
            title: newConnection.title,
            email: newConnection.email,
            is_active: newConnection.is_active
          }
        })
      }
    } finally {
      client.release()
      await pool.end()
    }

  } catch (error) {
    console.error('💥 [Calendar Connections] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process calendar connection', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
