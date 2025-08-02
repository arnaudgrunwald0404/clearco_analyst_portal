import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/crypto'
import { Pool } from 'pg'

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
    
    // Use direct PostgreSQL connection to bypass Supabase RLS issues
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })
    
    const client = await pool.connect()
    
    try {
      const queryResult = await client.query(`
        SELECT id, title, email, "isActive", "lastSyncAt", "createdAt"
        FROM "CalendarConnection" 
        WHERE "userId" = $1 
        ORDER BY "createdAt" DESC
      `, [userId])
      
      const connections = queryResult.rows
      
      console.log('📈 [Calendar Connections] Query successful')
      console.log('📊 [Calendar Connections] Found connections:', connections?.length || 0)

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
        SELECT id FROM "CalendarConnection" 
        WHERE "userId" = $1 AND email = $2
      `, [userId, userInfo.email])
      
      const existingConnection = existingResult.rows[0]

      if (existingConnection) {
        // Update existing connection
        const updateResult = await client.query(`
          UPDATE "CalendarConnection" 
          SET "accessToken" = $1, "refreshToken" = $2, "tokenExpiry" = $3, 
              "googleAccountId" = $4, "isActive" = $5, "updatedAt" = $6
          WHERE id = $7
          RETURNING id, title, email, "isActive"
        `, [
          encrypt(tokens.access_token || ''),
          tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
          tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          userInfo.data.id!,
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
            isActive: updatedConnection.isActive
          }
        })
      } else {
        // Create new connection
        const connectionId = generateId()
        const insertResult = await client.query(`
          INSERT INTO "CalendarConnection" (
            id, "userId", title, email, "googleAccountId", "accessToken", 
            "refreshToken", "tokenExpiry", "isActive", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id, title, email, "isActive"
        `, [
          connectionId,
          userId,
          `${userInfo.data.name}'s Calendar`,
          userInfo.data.email || '',
          userInfo.data.id!,
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
            isActive: newConnection.isActive
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
