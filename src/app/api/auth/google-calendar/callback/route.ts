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

export async function GET(request: NextRequest) {
  console.log('📅 Google Calendar OAuth callback started')
  console.log('📍 Request URL:', request.nextUrl.toString())
  
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const scope = searchParams.get('scope')

    console.log('📋 Calendar OAuth Parameters:')
    console.log('  - Code:', code ? 'Present' : 'Missing')
    console.log('  - State:', state ? 'Present' : 'Missing')
    console.log('  - Error:', error || 'None')
    console.log('  - Scope:', scope || 'None')

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
      const decodedState = Buffer.from(state, 'base64').toString('utf-8')
      connectionData = JSON.parse(decodedState)
    } catch (e) {
      return NextResponse.redirect(
        new URL('/settings?error=invalid_state', request.url)
      )
    }

    // Exchange the authorization code for access and refresh tokens
    const { tokens } = await oauth2Client.getToken(code)
    
    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL('/settings?error=no_access_token', request.url)
      )
    }

    // Set credentials to get user info and calendar info
    oauth2Client.setCredentials(tokens)

    // Get user information
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()

    if (!userInfo.data.email) {
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

    // For now, we'll use a hardcoded user ID
    // In production, this should come from the session/auth
    const userId = 'user-1'

    // Check if this Google account is already connected
    const existingConnection = await prisma.calendarConnection.findFirst({
      where: {
        userId: userId,
        googleAccountId: userInfo.data.id!,
      },
    })

    let connectionId: string
    
    if (existingConnection) {
      // Update existing connection with new tokens
      const updatedConnection = await prisma.calendarConnection.update({
        where: {
          id: existingConnection.id,
        },
        data: {
          title: connectionData.title || calendarName, // Use provided title or calendar name as default
          accessToken: encryptToken(tokens.access_token),
          refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isActive: true,
          updatedAt: new Date(),
        },
      })
      connectionId = updatedConnection.id
    } else {
      // Create new calendar connection with calendar name as default title
      const newConnection = await prisma.calendarConnection.create({
        data: {
          userId: userId,
          title: connectionData.title || calendarName, // Use provided title or calendar name as default
          email: userInfo.data.email,
          googleAccountId: userInfo.data.id!,
          accessToken: encryptToken(tokens.access_token),
          refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isActive: true,
        },
      })
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
    console.error('Error in Google Calendar OAuth callback:', error)
    return NextResponse.redirect(
      new URL('/settings?error=oauth_callback_failed', request.url)
    )
  }
}
