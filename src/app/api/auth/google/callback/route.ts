import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  console.log('🔄 Google OAuth callback started')
  console.log('📍 Request URL:', request.url)
  
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const scopes = searchParams.get('scope')

    console.log('📋 OAuth Parameters:')
    console.log('  - Code:', code ? 'Present' : 'Missing')
    console.log('  - State:', state ? 'Present' : 'Missing')
    console.log('  - Error:', error || 'None')
    console.log('  - Scopes:', scopes || 'None')

    // Handle OAuth errors
    if (error) {
      console.error('❌ OAuth error:', error)
      return NextResponse.redirect(new URL('/login?error=oauth_error', request.url))
    }

    // Validate required parameters
    if (!code) {
      console.error('❌ Missing authorization code')
      return NextResponse.redirect(new URL('/login?error=missing_code', request.url))
    }

    // Parse state parameter
    let stateData = null
    if (state) {
      try {
        stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      } catch (e) {
        console.error('Invalid state parameter:', e)
      }
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url))
    }

    const tokens = await tokenResponse.json()

    // Get user profile information
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!profileResponse.ok) {
      console.error('Profile fetch failed:', await profileResponse.text())
      return NextResponse.redirect(new URL('/login?error=profile_fetch_failed', request.url))
    }

    const profile = await profileResponse.json()

    // Check if user exists in database
    let user = await prisma.user.findUnique({
      where: { email: profile.email }
    })

    // Create user if doesn't exist (for calendar integration)
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          password: '', // OAuth users don't need passwords
          role: 'ADMIN' // Default role for OAuth users
        }
      })
    }

    // Store calendar connection if calendar scope was granted
    // Store calendar connection if calendar scope was granted
    const scopesValue = scopes || ''
    if (scopesValue.includes('calendar.readonly')) {
      // Create or update calendar connection
      await prisma.calendarConnection.upsert({
        where: {
          userId_googleAccountId: {
            userId: user.id,
            googleAccountId: profile.id
          }
        },
        update: {
          title: stateData?.title || profile.name,
          email: profile.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
          isActive: true,
          lastSyncAt: new Date()
        },
        create: {
          userId: user.id,
          title: stateData?.title || profile.name,
          email: profile.email,
          googleAccountId: profile.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || '',
          tokenExpiry: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
          isActive: true,
          lastSyncAt: new Date()
        }
      })

      console.log(`Calendar connection created/updated for ${profile.email}`)
    }

    // Create a simple session (in production, use proper session management)
    console.log('✅ OAuth successful, redirecting to dashboard')
    const response = NextResponse.redirect(new URL('/?success=google_auth', request.url))
    
    // Set a simple session cookie (in production, use proper JWT or session management)
    response.cookies.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=internal_error', request.url))
  } finally {
    await prisma.$disconnect()
  }
}
