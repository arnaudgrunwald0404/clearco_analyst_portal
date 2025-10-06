import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdminAuth } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require Super Admin authentication
    const authResult = await requireSuperAdminAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = await createClient()
    const domainId = params.id

    // Fetch users for the specific vendor domain
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        created_at,
        updated_at
      `)
      .eq('vendor_domain_id', domainId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching domain users:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch domain users' },
        { status: 500 }
      )
    }

    // Get auth users data for additional info like last_sign_in_at
    const authUserIds = (users || []).map(u => u.id)
    
    let authUsers: any[] = []
    if (authUserIds.length > 0) {
      const { data: authData } = await supabase.auth.admin.listUsers()
      authUsers = authData?.users?.filter(u => authUserIds.includes(u.id)) || []
    }

    // Combine user profile data with auth data
    const enrichedUsers = (users || []).map((user, index) => {
      const authUser = authUsers.find(au => au.id === user.id)
      
      return {
        id: user.id,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_sign_in_at: authUser?.last_sign_in_at,
        isFirstAdmin: index === 0 && user.role === 'VENDOR_ADMIN' // First user is typically the domain admin
      }
    })

    return NextResponse.json({
      success: true,
      data: enrichedUsers
    })

  } catch (error) {
    console.error('Error in domain users API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}






