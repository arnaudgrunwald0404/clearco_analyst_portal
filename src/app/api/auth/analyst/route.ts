import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Use service-role client for lookup to bypass RLS during impersonation/login
    let supabase: any
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      supabase = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    } else {
      // Fallback to session client if service creds are not configured
      supabase = await createClient()
    }

    // Find analyst by email; any analyst can access the portal
    const { data: analyst, error: analystError } = await supabase
      .from('analysts')
      .select('id, firstName, lastName, email, company, title, profileImageUrl')
      .eq('email', email)
      .single()

    if (analystError || !analyst) {
      return NextResponse.json(
        { success: false, error: 'Analyst not found' },
        { status: 401 }
      )
    }

    // For now: accept DEFAULT_ANALYST_PASSWORD as the shared password
    const expected = process.env.DEFAULT_ANALYST_PASSWORD || 'changeme123!'
    if (password !== expected) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Create user session payload
    const userData = {
      id: analyst.id,
      email: analyst.email,
      name: `${analyst.firstName} ${analyst.lastName}`,
      role: 'ANALYST' as const,
      company: analyst.company,
      title: analyst.title,
      profileImageUrl: analyst.profileImageUrl,
      analystId: analyst.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      user: userData,
      message: 'Analyst login successful'
    })

  } catch (error) {
    console.error('Analyst login error:', error)
    const details = process.env.NODE_ENV !== 'production' ? { details: (error as any)?.message || String(error) } : {}
    return NextResponse.json(
      { success: false, error: 'Internal server error', ...details },
      { status: 500 }
    )
  }
} 
