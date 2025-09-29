import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client, TokenPayload } from 'google-auth-library'
import { createClient } from '@/lib/supabase/server'

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()
    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    }

    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload() as TokenPayload | undefined
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 })
    }

    // Domain allowlist (optional)
    const email = payload.email
    const domain = email.split('@')[1]?.toLowerCase() || ''
    const allowedDomains = (process.env.NEXT_PUBLIC_SUPABASE_ALLOWED_DOMAINS || '').split(',').map(d => d.trim().toLowerCase()).filter(d => d.length > 0)
    if (allowedDomains.length && !allowedDomains.includes(domain)) {
      return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403 })
    }

    const supabase = await createClient()

    // Upsert user record in a lightweight table if present; otherwise rely on Supabase auth profile
    // Here we simply ensure an analysts record exists if applicable (best-effort)
    try {
      await supabase
        .from('users')
        .upsert({
          id: payload.sub,
          email,
          name: payload.name || '',
          picture: payload.picture || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
    } catch {}

    // Create app session using Supabase: sign in with ID token via OAuth could be used,
    // but here we store a lightweight cookie for middleware domain checks and rely on RLS by email.
    const response = NextResponse.json({ success: true, user: { email, name: payload.name || '' } })
    response.cookies.set('sb-email', email, { httpOnly: false, sameSite: 'lax', path: '/' })

    return response
  } catch (error) {
    console.error('Error in /api/auth/google:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}


