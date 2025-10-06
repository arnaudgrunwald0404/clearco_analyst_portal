import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireSuperAdminAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  console.log('🔄 [All Analysts API] GET request started')
  
  try {
    // Require Super Admin authentication
    console.log('🔐 [All Analysts API] Checking Super Admin authentication...')
    const authResult = await requireSuperAdminAuth()
    if (authResult instanceof NextResponse) {
      console.log('❌ [All Analysts API] Authentication failed')
      return authResult
    }
    
    console.log('✅ [All Analysts API] Super Admin authentication successful')
    // Use service-role client for admin operations (bypass RLS and allow auth.admin)
    const supabase = createServiceClient()

    // Fetch all analysts from the analysts table
    console.log('🔍 [All Analysts API] Fetching all analysts from database...')
    const { data: analysts, error } = await supabase
      .from('analysts')
      .select(`
        id,
        firstName,
        lastName,
        email,
        company
      `)
      .order('firstName', { ascending: true })

    if (error) {
      console.error('❌ [All Analysts API] Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analysts' },
        { status: 500 }
      )
    }
    
    console.log('✅ [All Analysts API] Successfully fetched analysts:', analysts?.length || 0)

    // Get list of analyst IDs that already have login access
    console.log('🔍 [All Analysts API] Checking existing login access...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ [All Analysts API] Auth users error:', authError)
      return NextResponse.json(
        { success: false, error: 'Failed to check existing access' },
        { status: 500 }
      )
    }

    // Get analyst emails that already have login access
    const existingEmails = new Set(authUsers.users.map(user => user.email?.toLowerCase()))
    console.log('📋 [All Analysts API] Found existing auth emails:', existingEmails.size)

    // Transform the data to include login access status
    const analystOptions = (analysts || []).map(analyst => ({
      id: analyst.id,
      firstName: analyst.firstName || '',
      lastName: analyst.lastName || '',
      email: analyst.email || '',
      company: analyst.company,
      hasLoginAccess: existingEmails.has(analyst.email?.toLowerCase())
    }))

    console.log('✅ [All Analysts API] Returning analyst options:', analystOptions?.length || 0)
    return NextResponse.json({
      success: true,
      data: analystOptions
    })

  } catch (error) {
    console.error('❌ [All Analysts API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}



