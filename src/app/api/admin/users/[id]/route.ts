import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdminAuth } from '@/lib/auth-utils'

export async function DELETE(
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
    const userId = params.id

    // First, check if this user exists and get their info
    const { data: userProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, email, role, created_at')
      .eq('id', userId)
      .single()

    if (fetchError || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if this is the first admin for the domain (prevent deletion)
    // Only if the vendor_domain_id column exists
    if (userProfile.role === 'VENDOR_ADMIN') {
      try {
        const { data: cols } = await (supabase as any)
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'user_profiles')
        const hasVendorDomain = Array.isArray(cols)
          ? (cols as any[]).some((c: any) => c.column_name === 'vendor_domain_id')
          : false
        if (hasVendorDomain) {
          const { data: domainUsers, error: domainError } = await supabase
            .from('user_profiles')
            .select('id, created_at, role, vendor_domain_id')
            .eq('vendor_domain_id', (userProfile as any).vendor_domain_id)
            .eq('role', 'VENDOR_ADMIN')
            .order('created_at', { ascending: true })

          if (!domainError && domainUsers && domainUsers.length > 0 && domainUsers[0].id === userId) {
            return NextResponse.json(
              { success: false, error: 'Cannot delete the first admin user for this domain' },
              { status: 403 }
            )
          }
        }
      } catch {}
    }

    // Delete the user from auth.users (this will cascade to user_profiles due to foreign key)
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)
    
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete user from authentication system' },
        { status: 500 }
      )
    }

    // Also delete from user_profiles table (in case cascade didn't work)
    const { error: deleteProfileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (deleteProfileError) {
      console.warn('Error deleting user profile (may have been cascaded):', deleteProfileError)
      // Don't return error here as the auth deletion succeeded
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Error in delete user API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}







