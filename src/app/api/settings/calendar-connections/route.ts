import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/crypto'
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

    console.log('🔗 [Calendar Connections GET] Initializing database connection...')
    console.log('🔗 [Calendar Connections GET] Connection string preview:', process.env.DATABASE_URL?.substring(0, 30) + '...')
    
    // Use direct PostgreSQL connection to bypass Supabase RLS issues
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })
    
    console.log('📡 [Calendar Connections GET] Attempting to connect to database...')
    const client = await pool.connect()
    console.log('✅ [Calendar Connections GET] Database connection successful')
    
    try {
      console.log('📊 [Calendar Connections GET] Executing query...')
      console.log('📊 [Calendar Connections GET] Query parameters:')
      console.log('  - user_id:', user_id)
      
      const queryResult = await client.query(`
        SELECT id, title, email, "isActive" AS "is_active", "lastSyncAt" AS "last_sync_at", "createdAt" AS "created_at"
        FROM "calendar_connections" 
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC
      `, [user_id])
      
      const connections = queryResult.rows
      
      console.log('✅ [Calendar Connections GET] Query executed successfully')
      console.log('📈 [Calendar Connections GET] Query result details:')
      console.log('  - Rows returned:', connections?.length || 0)
      console.log('  - Row count from query:', queryResult.rowCount)
      console.log('  - Command:', queryResult.command)
      
      if (connections && connections.length > 0) {
        console.log('📊 [Calendar Connections GET] Connection details:')
        connections.forEach((conn, index) => {
          console.log(`  Connection ${index + 1}:`)
          console.log(`    - ID: ${conn.id}`)
          console.log(`    - Title: ${conn.title}`)
          console.log(`    - Email: ${conn.email}`)
          console.log(`    - Active: ${conn.is_active}`)
          console.log(`    - Last sync: ${conn.last_sync_at || 'Never'}`)
          console.log(`    - Created: ${conn.created_at}`)
        })
      } else {
        console.log('📊 [Calendar Connections GET] No connections found for user')
      }

      return NextResponse.json({
        success: true,
        data: connections || []
      })
    } finally {
      client.release()
      await pool.end()
    }
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
    
    const { code } = body
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
        WHERE "userId" = $1 AND email = $2
      `, [user_id, userInfo.email])
      
      const existingConnection = existingResult.rows[0]

      if (existingConnection) {
        // Update existing connection
        const updateResult = await client.query(`
          UPDATE "calendar_connections" 
          SET "accessToken" = $1, "refreshToken" = $2, "expiresAt" = $3,
              "isActive" = $4, "updatedAt" = $5
          WHERE id = $6
          RETURNING id, title, email, "isActive" AS "is_active"
        `, [
          encrypt(tokens.access_token || ''),
          tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
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
            id, "userId", title, email, "accessToken",
            "refreshToken", "expiresAt", "isActive", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id, title, email, "isActive" AS "is_active"
        `, [
          connectionId,
          user_id,
          `${userInfo.name}'s Calendar`,
          userInfo.email || '',
          encrypt(tokens.access_token || ''),
          tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
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
