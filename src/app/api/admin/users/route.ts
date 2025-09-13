import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  console.log('🔄 [Admin Users API] GET request started')
  
  try {
    console.log('📡 [Admin Users API] Creating Supabase client...')
    const supabase = await createClient()

    // Check if user is authenticated
    console.log('🔐 [Admin Users API] Checking authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('👤 [Admin Users API] Auth result:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    })
    
    if (authError || !user) {
      console.log('❌ [Admin Users API] Authentication failed')
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the protected domain from general settings
    console.log('🔧 [Admin Users API] Creating service client...')
    const serviceSupabase = createServiceClient()
    
    console.log('📋 [Admin Users API] Fetching general settings...')
    const { data: settings, error: settingsError } = await serviceSupabase
      .from('general_settings')
      .select('protected_domain')
      .limit(1)
      .single()

    console.log('📋 [Admin Users API] Settings result:', { 
      hasSettings: !!settings, 
      domain: settings?.protected_domain,
      settingsError: settingsError?.message 
    })

    if (settingsError || !settings?.protected_domain) {
      console.error('❌ [Admin Users API] Error fetching general settings:', settingsError)
      return NextResponse.json(
        { success: false, error: 'Protected domain not configured in general settings' },
        { status: 400 }
      )
    }

    const protectedDomain = settings.protected_domain.toLowerCase().trim()
    console.log(`🔒 [Admin Users API] Filtering users by domain: ${protectedDomain}`)

    // Fetch users from auth.users filtered by the protected domain
    console.log('👥 [Admin Users API] Fetching auth users...')
    const { data: authUsers, error: usersError } = await serviceSupabase.auth.admin.listUsers()

    console.log('👥 [Admin Users API] Auth users result:', { 
      hasUsers: !!authUsers?.users, 
      totalUsers: authUsers?.users?.length || 0,
      usersError: usersError?.message 
    })

    if (usersError) {
      console.error('❌ [Admin Users API] Error fetching auth users:', usersError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users from authentication system' },
        { status: 500 }
      )
    }

    // Filter users by the protected domain and transform the data
    const filteredUsers = authUsers.users
      .filter(authUser => {
        if (!authUser.email) return false
        const emailDomain = authUser.email.split('@')[1]?.toLowerCase()
        return emailDomain === protectedDomain
      })
      .map(authUser => {
        // Extract first name and last name from user metadata or email
        const userMetadata = authUser.user_metadata || {}
        const rawMetadata = authUser.raw_user_meta_data || {}
        
        // Try to get names from metadata, fallback to parsing email
        let firstName = userMetadata.firstName || userMetadata.first_name || rawMetadata.firstName || rawMetadata.first_name
        let lastName = userMetadata.lastName || userMetadata.last_name || rawMetadata.lastName || rawMetadata.last_name
        
        // If no names in metadata, try to parse from email
        if (!firstName && !lastName && authUser.email) {
          const emailPrefix = authUser.email.split('@')[0]
          const nameParts = emailPrefix.split(/[._-]/).map(part => 
            part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
          )
          firstName = nameParts[0] || ''
          lastName = nameParts.slice(1).join(' ') || ''
        }

        return {
          id: authUser.id,
          firstName: firstName || 'Unknown',
          lastName: lastName || 'User',
          email: authUser.email || '',
          role: userMetadata.role || rawMetadata.role || 'User',
          createdAt: authUser.created_at,
          updatedAt: authUser.updated_at || authUser.created_at,
          emailConfirmed: !!authUser.email_confirmed_at,
          lastSignIn: authUser.last_sign_in_at,
          provider: authUser.app_metadata?.provider || 'email'
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    console.log(`📊 [Admin Users API] Found ${filteredUsers.length} users for domain ${protectedDomain}`)

    return NextResponse.json({
      success: true,
      data: filteredUsers,
      domain: protectedDomain,
      totalAuthUsers: authUsers.users.length
    })

  } catch (error) {
    console.error('❌ [Admin Users API] Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, email } = body

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Get the protected domain from general settings
    const serviceSupabase = createServiceClient()
    const { data: settings, error: settingsError } = await serviceSupabase
      .from('general_settings')
      .select('protected_domain')
      .limit(1)
      .single()

    if (settingsError || !settings?.protected_domain) {
      console.error('Error fetching general settings:', settingsError)
      return NextResponse.json(
        { success: false, error: 'Protected domain not configured in general settings' },
        { status: 400 }
      )
    }

    const protectedDomain = settings.protected_domain.toLowerCase().trim()
    const emailDomain = email.split('@')[1]?.toLowerCase()

    // Validate email domain matches protected domain
    if (emailDomain !== protectedDomain) {
      return NextResponse.json(
        { success: false, error: `Email must be from the ${protectedDomain} domain` },
        { status: 400 }
      )
    }

    console.log(`➕ [Admin Users API] Creating new user: ${firstName} ${lastName} <${email}>`)

    // Create user in Supabase Auth
    const { data: newAuthUser, error: createError } = await serviceSupabase.auth.admin.createUser({
      email: email.trim(),
      email_confirm: false, // User will need to confirm their email
      user_metadata: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: 'User'
      }
    })

    if (createError) {
      console.error('Error creating auth user:', createError)
      
      // Handle specific error cases
      if (createError.message?.includes('already registered')) {
        return NextResponse.json(
          { success: false, error: 'A user with this email address already exists' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    console.log(`✅ [Admin Users API] Successfully created user with ID: ${newAuthUser.user?.id}`)

    return NextResponse.json({
      success: true,
      data: {
        id: newAuthUser.user?.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role: 'User',
        emailConfirmed: false,
        provider: 'email',
        createdAt: newAuthUser.user?.created_at,
        updatedAt: newAuthUser.user?.updated_at
      }
    })

  } catch (error) {
    console.error('❌ [Admin Users API] Error creating user:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
