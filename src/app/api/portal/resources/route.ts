import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/portal/resources
 * Serves vendor content to analysts based on the vendor domain they're viewing
 * This endpoint is used by the analyst portal to display vendor content
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorDomain = searchParams.get('vendorDomain')
    
    if (!vendorDomain) {
      return NextResponse.json({ error: 'vendorDomain parameter is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the vendor domain ID from the vendor domain string
    const { data: vendorDomainData, error: vendorError } = await supabase
      .from('vendor_domains')
      .select('id, company_name, protected_domain')
      .eq('protected_domain', vendorDomain.toLowerCase())
      .single()

    if (vendorError || !vendorDomainData) {
      console.error('Error fetching vendor domain:', vendorError)
      return NextResponse.json({ error: 'Vendor domain not found' }, { status: 404 })
    }

    // Fetch content for this vendor's domain
    const { data: content, error } = await supabase
      .from('vendor_portal_content')
      .select(`
        id,
        title,
        description,
        category,
        url,
        "createdAt",
        "updatedAt",
        vendor_domains!inner(company_name, protected_domain)
      `)
      .eq('vendor_domain_id', vendorDomainData.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching vendor portal content:', error)
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
    }

    // Transform the data to match the expected format for the analyst portal
    const transformedContent = (content || []).map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      url: item.url,
      updatedAt: item.createdAt, // Use createdAt as updatedAt for display
      // Add any additional fields that the analyst portal expects
      sizeLabel: undefined, // No file size for URLs
      kind: inferContentKind(item.category, item.url)
    }))

    return NextResponse.json(transformedContent)

  } catch (error) {
    console.error('Error in portal resources API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Infer content kind from category and URL
 */
function inferContentKind(category: string, url: string): string {
  const urlLower = url.toLowerCase()
  
  if (urlLower.includes('video') || urlLower.includes('youtube') || urlLower.includes('vimeo')) {
    return 'video'
  } else if (urlLower.includes('demo') || urlLower.includes('presentation')) {
    return 'demo'
  } else if (urlLower.includes('case-study') || urlLower.includes('casestudy')) {
    return 'case-study'
  } else if (urlLower.includes('whitepaper') || urlLower.includes('report')) {
    return 'whitepaper'
  } else if (urlLower.includes('guide') || urlLower.includes('documentation')) {
    return 'guide'
  } else if (urlLower.includes('api') || urlLower.includes('spec')) {
    return 'api'
  }
  
  // Default based on category
  switch (category) {
    case 'VIDEO':
      return 'video'
    case 'DEMO':
      return 'demo'
    case 'CASE_STUDY':
      return 'case-study'
    case 'REPORT':
      return 'whitepaper'
    case 'WEBINAR':
      return 'video'
    default:
      return 'other'
  }
}
