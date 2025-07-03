import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { PrismaClient } from '@prisma/client'
import CryptoJS from 'crypto-js'

const prisma = new PrismaClient()

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

function decryptToken(encryptedToken: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

// GET - Fetch all calendar connections for the user
export async function GET() {
  console.log('🔍 [Calendar Connections] GET request started')
  console.log('🕐 [Calendar Connections] Timestamp:', new Date().toISOString())
  
  try {
    // For now, we'll use a hardcoded user ID
    // In production, this should come from the session/auth
    const userId = 'user-1' // This should be replaced with actual user authentication
    console.log('👤 [Calendar Connections] Using userId:', userId)

    console.log('🔗 [Calendar Connections] Attempting to connect to database...')
    
    // Test database connection first
    await prisma.$connect()
    console.log('✅ [Calendar Connections] Database connection successful')

    console.log('📊 [Calendar Connections] Querying calendar connections...')
    const connections = await prisma.calendarConnection.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        title: true,
        email: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log('📈 [Calendar Connections] Query successful')
    console.log('📊 [Calendar Connections] Found connections:', connections.length)
    console.log('📝 [Calendar Connections] Connection details:', JSON.stringify(connections, null, 2))

    return NextResponse.json(connections)
  } catch (error) {
    console.error('❌ [Calendar Connections] Error occurred:')
    console.error('📝 [Calendar Connections] Error details:', error)
    console.error('🔍 [Calendar Connections] Error name:', error?.name)
    console.error('💬 [Calendar Connections] Error message:', error?.message)
    console.error('📚 [Calendar Connections] Error stack:', error?.stack)
    
    // Check if it's a database connection error
    if (error?.message?.includes('connect') || error?.message?.includes('ECONNREFUSED')) {
      console.error('🔌 [Calendar Connections] Database connection failed')
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch calendar connections',
        details: error?.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
    console.log('🔚 [Calendar Connections] Database disconnected')
  }
}

// POST - Initiate new calendar connection
export async function POST(request: NextRequest) {
  try {
    // No title required for initial connection - we'll get it after OAuth
    const state = Buffer.from(JSON.stringify({ connectFirst: true })).toString('base64')

    // Generate authorization URL
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ]

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state,
    })

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Error initiating calendar connection:', error)
    return NextResponse.json(
      { error: 'Failed to initiate calendar connection' },
      { status: 500 }
    )
  }
}
