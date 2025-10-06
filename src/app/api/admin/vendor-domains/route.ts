import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdminAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  console.log('🔄 [Vendor Domains API] GET request started')
  
  try {
    // Require Super Admin authentication
    console.log('🔐 [Vendor Domains API] Checking Super Admin authentication...')
    const authResult = await requireSuperAdminAuth()
    if (authResult instanceof NextResponse) {
      console.log('❌ [Vendor Domains API] Authentication failed')
      return authResult
    }
    
    console.log('✅ [Vendor Domains API] Super Admin authentication successful')
    const supabase = await createClient()

    // Fetch all vendor domains with user counts
    console.log('🔍 [Vendor Domains API] Fetching all vendor domains...')
    const { data: vendorDomains, error } = await supabase
      .from('vendor_domains')
      .select(`
        id,
        company_name,
        protected_domain,
        logo_url,
        industry_name,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ [Vendor Domains API] Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch vendor domains' },
        { status: 500 }
      )
    }
    
    console.log('✅ [Vendor Domains API] Found vendor domains:', vendorDomains?.length || 0)
    console.log('📋 [Vendor Domains API] Domains:', vendorDomains?.map(d => d.protected_domain) || [])

    // Get user counts for each domain
    const domainsWithCounts = await Promise.all(
      (vendorDomains || []).map(async (domain) => {
        const { count } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_domain_id', domain.id)

        return {
          ...domain,
          user_count: count || 0
        }
      })
    )

    console.log('✅ [Vendor Domains API] Returning domains with counts:', domainsWithCounts?.length || 0)
    return NextResponse.json({
      success: true,
      data: domainsWithCounts
    })

  } catch (error) {
    console.error('Error in vendor-domains API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
