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
  try {
    // For now, we'll use a hardcoded user ID
    // In production, this should come from the session/auth
    const userId = 'user-1' // This should be replaced with actual user authentication

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

    return NextResponse.json(connections)
  } catch (error) {
    console.error('Error fetching calendar connections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar connections' },
      { status: 500 }
    )
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
