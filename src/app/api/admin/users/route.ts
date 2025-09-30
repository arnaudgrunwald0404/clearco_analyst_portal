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
    
    console.log('📋 [Admin Users API] Fetching vendor domain settings...')
    const { data: settings, error: settingsError } = await serviceSupabase
      .from('vendor_domains')
      .select('protected_domain')
      .limit(1)
      .single()

    console.log('📋 [Admin Users API] Settings result:', { 
      hasSettings: !!settings, 
      domain: settings?.protected_domain,
      settingsError: settingsError?.message 
    })

    if (settingsError || !settings?.protected_domain) {
      console.error('❌ [Admin Users API] Error fetching vendor domain settings:', settingsError)
      return NextResponse.json(
        { success: false, error: 'Protected domain not configured in vendor domain settings' },
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

    // Fetch user profiles to check for corresponding entries
    console.log('👤 [Admin Users API] Fetching user profiles...')
    const { data: userProfiles, error: profilesError } = await serviceSupabase
      .from('user_profiles')
      .select('id, name, role, company, email')

    console.log('👤 [Admin Users API] User profiles result:', { 
      hasProfiles: !!userProfiles, 
      totalProfiles: userProfiles?.length || 0,
      profilesError: profilesError?.message
    })

    if (profilesError) {
      console.error('❌ [Admin Users API] Error fetching user profiles:', profilesError)
      // Continue without profiles data, just log the error
    }

    // Create a map of user profiles by ID for quick lookup
    const profilesMap = new Map()
    if (userProfiles) {
      userProfiles.forEach(profile => {
        profilesMap.set(profile.id, profile)
      })
    }

    // Filter users by the protected domain and transform the data
    const filteredUsers = authUsers.users
      .filter(authUser => {
        if (!authUser.email) return false
        const emailDomain = authUser.email.split('@')[1]?.toLowerCase()
        return emailDomain === protectedDomain
      })
      .map(authUser => {
        // Check if user has a corresponding profile
        const userProfile = profilesMap.get(authUser.id)
        const hasProfile = !!userProfile
        
        // Debug logging (can be removed in production)
        if (process.env.NODE_ENV === 'development' && authUser.email?.includes('debug')) {
          console.log(`🔍 [Admin Users API] Debug for ${authUser.email}:`, {
            authUserId: authUser.id,
            hasProfile,
            userProfile: userProfile ? { id: userProfile.id, name: userProfile.name } : null
          })
        }

        // Extract first name and last name from user metadata or email
        const userMetadata = authUser.user_metadata || {}
        const rawMetadata = (authUser as any)?.user_metadata || {}
        
        // Try to get names from profile first, then metadata, then fallback to parsing email
        // Note: user_profiles table uses 'name' field, not separate first_name/last_name
        let firstName = userMetadata.firstName || userMetadata.first_name || rawMetadata.firstName || rawMetadata.first_name
        let lastName = userMetadata.lastName || userMetadata.last_name || rawMetadata.lastName || rawMetadata.last_name
        
        // If we have a profile with name, try to split it
        if (userProfile?.name && !firstName && !lastName) {
          const nameParts = userProfile.name.trim().split(/\s+/)
          firstName = nameParts[0] || ''
          lastName = nameParts.slice(1).join(' ') || ''
        }
        
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
          role: userProfile?.role || userMetadata.role || rawMetadata.role || 'EDITOR',
          createdAt: authUser.created_at,
          updatedAt: authUser.updated_at || authUser.created_at,
          emailConfirmed: !!authUser.email_confirmed_at,
          lastSignIn: authUser.last_sign_in_at,
          provider: authUser.app_metadata?.provider || 'email',
          hasProfile: hasProfile,
          company: userProfile?.company || null
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

    // Get the protected domain from vendor domains
    const serviceSupabase = createServiceClient()
    const { data: settings, error: settingsError } = await serviceSupabase
      .from('vendor_domains')
      .select('protected_domain')
      .limit(1)
      .single()

    if (settingsError || !settings?.protected_domain) {
      console.error('Error fetching vendor domain settings:', settingsError)
      return NextResponse.json(
        { success: false, error: 'Protected domain not configured in vendor domain settings' },
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

export async function DELETE(request: NextRequest) {
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
    const { userId } = body

    // Validate required fields
    if (!userId?.trim()) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log(`🗑️ [Admin Users API] Deleting user with ID: ${userId}`)

    // Use service client to delete user from auth.users
    const serviceSupabase = createServiceClient()
    
    // First, check if the user has a corresponding profile
    const { data: userProfile, error: profileCheckError } = await serviceSupabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .eq('id', userId)
      .single()

    if (profileCheckError && profileCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking user profile:', profileCheckError)
      return NextResponse.json(
        { success: false, error: 'Failed to check user profile' },
        { status: 500 }
      )
    }

    // If user has a profile, don't allow deletion
    if (userProfile) {
      console.log(`❌ [Admin Users API] User ${userId} has a corresponding profile, deletion not allowed`)
      return NextResponse.json(
        { success: false, error: 'Cannot delete user with existing profile data. User has associated profile information.' },
        { status: 400 }
      )
    }

    console.log(`✅ [Admin Users API] User ${userId} has no corresponding profile, proceeding with deletion`)

    // Delete user from Supabase Auth
    const { data: deletedUser, error: deleteError } = await serviceSupabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError)
      
      // Handle specific error cases
      if (deleteError.message?.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to delete user account' },
        { status: 500 }
      )
    }

    console.log(`✅ [Admin Users API] Successfully deleted user with ID: ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'User successfully deleted'
    })

  } catch (error) {
    console.error('❌ [Admin Users API] Error deleting user:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
