import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // First, find the analyst by email
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

    // Check if analyst has access credentials
    const { data: access, error: accessError } = await supabase
      .from('analyst_access')
      .select('password_hash, is_active, last_login')
      .eq('analyst_id', analyst.id)
      .single()

    if (accessError || !access) {
      return NextResponse.json(
        { success: false, error: 'Analyst portal access not configured' },
        { status: 401 }
      )
    }

    if (!access.is_active) {
      return NextResponse.json(
        { success: false, error: 'Analyst portal access is disabled' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, access.password_hash)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Update last login
    await supabase
      .from('analyst_access')
      .update({ last_login: new Date().toISOString() })
      .eq('analyst_id', analyst.id)

    // Create user session data
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
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 