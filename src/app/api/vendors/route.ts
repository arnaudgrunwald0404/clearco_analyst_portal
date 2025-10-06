import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }
    
    const user = authResult
    const supabase = await createClient()

    // For analysts, we want to show all vendors they can potentially work with
    // For now, let's show all vendor domains that have analysts
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
      .order('company_name', { ascending: true })

    if (error) {
      console.error('Error fetching vendor domains:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch vendors' },
        { status: 500 }
      )
    }

    // Get briefing data for each vendor to determine last briefing date
    const vendorIds = vendorDomains?.map(v => v.id) || []
    const { data: briefings } = await supabase
      .from('briefings')
      .select('id, vendor_domain_id, scheduledAt, completedAt, status')
      .in('vendor_domain_id', vendorIds)
      .order('scheduledAt', { ascending: false })

    // Get analyst count for each vendor
    const { data: analystCounts } = await supabase
      .from('analysts')
      .select('vendor_domain_id')
      .in('vendor_domain_id', vendorIds)

    // Transform the data to match the expected format
    const transformedVendors = (vendorDomains || []).map(vendor => {
      // Find the most recent briefing for this vendor
      const vendorBriefings = briefings?.filter(b => b.vendor_domain_id === vendor.id) || []
      const lastBriefing = vendorBriefings.find(b => b.status === 'COMPLETED' && b.completedAt)
      
      // Count analysts for this vendor
      const analystCount = analystCounts?.filter(a => a.vendor_domain_id === vendor.id).length || 0
      
      // Determine tier based on analyst count (simple logic for now)
      let tier: 'STRATEGIC' | 'IMPORTANT' | 'STANDARD' | 'LOW' = 'LOW'
      if (analystCount >= 20) tier = 'STRATEGIC'
      else if (analystCount >= 10) tier = 'IMPORTANT'
      else if (analystCount >= 5) tier = 'STANDARD'

      return {
        id: vendor.id,
        companyName: vendor.company_name,
        website: `https://${vendor.protected_domain}`,
        category: vendor.industry_name || 'Technology',
        tier,
        description: `${vendor.industry_name || 'Technology'} company`,
        lastBriefingDate: lastBriefing?.completedAt ? new Date(lastBriefing.completedAt).toISOString().split('T')[0] : undefined,
        relationshipHealth: analystCount > 0 ? 'Active' : 'No Analysts',
        createdAt: vendor.created_at,
        updatedAt: vendor.updated_at,
        logoUrl: vendor.logo_url,
        analystCount
      }
    })

    console.log(`✅ Fetched ${transformedVendors.length} vendors for analyst`)

    return NextResponse.json({
      success: true,
      data: transformedVendors
    })

  } catch (error) {
    console.error('Error in vendors API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
