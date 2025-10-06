import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireSuperAdminAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  console.log('🔄 [Admin Analysts API] GET request started')
  console.log('🕐 [Admin Analysts API] Timestamp:', new Date().toISOString())
  
  try {
    // Require Super Admin authentication
    console.log('🔐 [Admin Analysts API] Checking Super Admin authentication...')
    const authResult = await requireSuperAdminAuth()
    if (authResult instanceof NextResponse) {
      console.log('❌ [Admin Analysts API] Authentication failed')
      return authResult
    }
    
    console.log('✅ [Admin Analysts API] Authentication successful')

    // Use service-role client to bypass RLS and allow cross-domain admin reads
    const supabase = createServiceClient()

    // Fetch all analysts across all vendor domains
    console.log('🔍 [Admin Analysts API] Fetching analysts from database...')
    const { data: analysts, error } = await supabase
      .from('analysts')
      .select(`
        id,
        firstName,
        lastName,
        email,
        company,
        title,
        linkedinUrl,
        personalWebsite,
        type,
        influence,
        status,
        vendor_domain_id,
        createdAt,
        updatedAt,
        vendor_domains:vendor_domain_id (
          id,
          company_name,
          protected_domain
        )
      `)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('❌ [Admin Analysts API] Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analysts' },
        { status: 500 }
      )
    }
    
    console.log('✅ [Admin Analysts API] Successfully fetched analysts:', analysts?.length || 0)

    // Transform the data to match the expected format
    const transformedAnalysts = (analysts || []).map(analyst => ({
      ...analyst,
      vendor_domain: Array.isArray(analyst.vendor_domains) 
        ? analyst.vendor_domains[0] 
        : analyst.vendor_domains
    }))

    console.log('✅ [Admin Analysts API] Returning transformed analysts:', transformedAnalysts?.length || 0)
    return NextResponse.json({
      success: true,
      data: transformedAnalysts
    })

  } catch (error) {
    console.error('Error in analysts API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
