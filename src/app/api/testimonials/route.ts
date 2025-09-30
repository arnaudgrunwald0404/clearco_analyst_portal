import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentVendorDomainId } from '@/lib/vendor-domain-utils'

export async function GET(request: NextRequest) {
  try {
    // Use service role client to ensure we can read testimonials
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get query parameters to determine if we want all testimonials or just published ones
    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get('all') === 'true'
    
    const vendorDomainId = await getCurrentVendorDomainId()
    if (!vendorDomainId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: missing vendor scope' }, { status: 403 })
    }

    let query = supabase
      .from('testimonials')
      .select(`
        id, 
        text, 
        author, 
        company, 
        rating, 
        created_at, 
        is_published, 
        display_order,
        analyst_id,
        analysts!testimonials_analyst_id_fkey (
          id,
          firstName,
          lastName,
          company,
          title,
          profileImageUrl
        )
      `)
      .eq('vendor_domain_id', vendorDomainId)
      .order('created_at', { ascending: false })
    
    // Only filter by published if not showing all
    if (!showAll) {
      query = query.eq('is_published', true)
    }
    
    const { data, error } = await query.limit(50)

    if (error) {
      console.error('Error fetching testimonials:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch testimonials' }, { status: 500 })
    }

    console.log(`📊 Fetched ${data?.length || 0} testimonials from database`)

    // Transform the data to match the expected format
    const normalized = (data || []).map((t: any) => {
      const analyst = t.analysts || {}
      const firstName = analyst.firstName || (t.author?.split(' ')[0] || t.author)
      const lastName = analyst.lastName || (t.author?.split(' ').slice(1).join(' ') || '')

      // Fallback avatar: deterministic pravatar URL so it looks real and stays consistent
      const unique = analyst.id || t.author || t.id
      const fallbackAvatar = unique
        ? `https://i.pravatar.cc/96?u=${encodeURIComponent(unique)}`
        : null

      return {
        id: t.id,
        quote: t.text, // Map 'text' to 'quote' for the frontend
        context: '', // Add empty context field
        isPublished: t.is_published, // Map 'is_published' to 'isPublished'
        displayOrder: t.display_order || 0, // Map 'display_order' to 'displayOrder'
        createdAt: t.created_at,
        analyst: {
          id: analyst.id || '',
          firstName,
          lastName,
          company: analyst.company || t.company || 'Unknown',
          title: analyst.title || 'Analyst',
          profileImageUrl: analyst.profileImageUrl || fallbackAvatar
        }
      }
    })

    return NextResponse.json({ success: true, data: normalized })
  } catch (error) {
    console.error('Error in testimonials list:', error)
    return NextResponse.json(
      { success: false, error: 'Testimonials list not implemented yet' },
      { status: 501 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Testimonials POST request received')
    const supabase = await createClient()
    const vendorDomainId = await getCurrentVendorDomainId()
    if (!vendorDomainId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: missing vendor scope' }, { status: 403 })
    }
    
    // Parse request body with better error handling
    let body: any = {}
    try {
      body = await request.json()
      console.log('📝 Request body:', body)
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }, { status: 400 })
    }

    // Validate and sanitize input
    const text = (body.text ?? '').toString().trim()
    const author = (body.author ?? '').toString().trim()
    const company = body.company ? body.company.toString().trim() : null
    const rating = Number.isFinite(Number(body.rating)) ? Number(body.rating) : 5
    const analystId = body.analystId ? body.analystId.toString().trim() : null
    const dateInput = body.date ? new Date(body.date) : new Date()
    const created_at = isNaN(dateInput.getTime()) ? new Date().toISOString() : dateInput.toISOString()

    console.log('📝 Processed data:', { text, author, company, rating, analystId, created_at })

    if (!text || !author) {
      console.error('❌ Missing required fields:', { text: !!text, author: !!author })
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: text and author' 
      }, { status: 400 })
    }

    // If analystId is provided, verify the analyst exists
    if (analystId) {
      const { data: analyst, error: analystError } = await supabase
        .from('analysts')
        .select('id, firstName, lastName, company')
        .eq('vendor_domain_id', vendorDomainId)
        .eq('id', analystId)
        .single()
      
      if (analystError || !analyst) {
        console.error('❌ Invalid analyst ID:', analystId)
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid analyst ID provided' 
        }, { status: 400 })
      }
      
      console.log('✅ Analyst found:', analyst)
    }

    // Insert testimonial
    console.log('📝 Inserting testimonial into database...')
    const { data, error } = await supabase
      .from('testimonials')
      .insert({
        text,
        author,
        company,
        rating,
        created_at,
        is_published: typeof body.isPublished === 'boolean' ? body.isPublished : false,
        analyst_id: analystId,
        vendor_domain_id: vendorDomainId
      })
      .select('id, text, author, company, rating, created_at, is_published, analyst_id')
      .single()

    if (error) {
      console.error('❌ Database error inserting testimonial:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create testimonial',
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ Testimonial created successfully:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('💥 Unexpected error in testimonials POST:', error)
    console.error('💥 Error type:', typeof error)
    console.error('💥 Error constructor:', error?.constructor?.name)
    
    // Better error handling to prevent [object Event] errors
    let errorMessage = 'Failed to create testimonial'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message)
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
} 
