import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/auth/callback`
      }
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Magic link sent' })

  } catch (error) {
    console.error('Analyst login error:', error)
    const details = process.env.NODE_ENV !== 'production' ? { details: (error as any)?.message || String(error) } : {}
    return NextResponse.json(
      { success: false, error: 'Internal server error', ...details },
      { status: 500 }
    )
  }
} 
