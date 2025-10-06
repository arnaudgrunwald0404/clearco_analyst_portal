import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireSuperAdminAuth } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  console.log('🔄 [Grant Analyst Access API] POST request started')
  
  try {
    // Require Super Admin authentication
    console.log('🔐 [Grant Analyst Access API] Checking Super Admin authentication...')
    const authResult = await requireSuperAdminAuth()
    if (authResult instanceof NextResponse) {
      console.log('❌ [Grant Analyst Access API] Authentication failed')
      return authResult
    }
    
    console.log('✅ [Grant Analyst Access API] Super Admin authentication successful')
    // Use service-role client for admin operations (auth.admin + write bypass RLS)
    const supabase = createServiceClient()

    // Parse request body
    const { analystId } = await request.json()
    
    if (!analystId) {
      console.log('❌ [Grant Analyst Access API] Missing analystId')
      return NextResponse.json(
        { success: false, error: 'Analyst ID is required' },
        { status: 400 }
      )
    }

    console.log('🔍 [Grant Analyst Access API] Granting access for analyst:', analystId)

    // Get analyst details from the analysts table
    const { data: analyst, error: analystError } = await supabase
      .from('analysts')
      .select('id, firstName, lastName, email, company')
      .eq('id', analystId)
      .single()

    if (analystError || !analyst) {
      console.error('❌ [Grant Analyst Access API] Analyst not found:', analystError)
      return NextResponse.json(
        { success: false, error: 'Analyst not found' },
        { status: 404 }
      )
    }

    if (!analyst.email) {
      console.log('❌ [Grant Analyst Access API] Analyst has no email')
      return NextResponse.json(
        { success: false, error: 'Analyst must have an email address' },
        { status: 400 }
      )
    }

    console.log('📧 [Grant Analyst Access API] Creating auth user for:', analyst.email)

    // Check if user already exists in auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(u => u.email?.toLowerCase() === analyst.email.toLowerCase())

    if (existingUser) {
      console.log('⚠️ [Grant Analyst Access API] User already has auth account')
      return NextResponse.json(
        { success: false, error: 'Analyst already has login access' },
        { status: 400 }
      )
    }

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: analyst.email,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        firstName: analyst.firstName,
        lastName: analyst.lastName,
        role: 'ANALYST'
      }
    })

    if (authError || !authUser.user) {
      console.error('❌ [Grant Analyst Access API] Failed to create auth user:', authError)
      return NextResponse.json(
        { success: false, error: 'Failed to create login account' },
        { status: 500 }
      )
    }

    console.log('✅ [Grant Analyst Access API] Auth user created:', authUser.user.id)

    // Create user profile entry
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        email: analyst.email,
        first_name: analyst.firstName,
        last_name: analyst.lastName,
        role: 'ANALYST',
        name: `${analyst.firstName} ${analyst.lastName}`.trim(),
        company: analyst.company
      })

    if (profileError) {
      console.error('❌ [Grant Analyst Access API] Failed to create user profile:', profileError)
      // Try to clean up the auth user if profile creation failed
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json(
        { success: false, error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    console.log('✅ [Grant Analyst Access API] User profile created successfully')

    return NextResponse.json({
      success: true,
      message: 'Analyst access granted successfully',
      data: {
        userId: authUser.user.id,
        email: analyst.email,
        name: `${analyst.firstName} ${analyst.lastName}`.trim()
      }
    })

  } catch (error) {
    console.error('❌ [Grant Analyst Access API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}



