import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireVendorScope } from '@/lib/vendor-context'

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: briefingId } = await params
    const ctxOrResp = await requireVendorScope(request)
    if (ctxOrResp instanceof NextResponse) return ctxOrResp

    const supabase = await createClient()
    const service = createServiceClient()

    const vendorDomainId = ctxOrResp.id
    const { searchParams } = new URL(request.url)
    const analystIdFilter = searchParams.get('analystId')

    // Fetch ratings for this briefing (scoped to vendor)
    let query = service
      .from('briefing_ratings')
      .select('*')
      .eq('vendor_domain_id', vendorDomainId)
      .eq('briefingId', briefingId)

    if (analystIdFilter) {
      query = query.eq('analystId', analystIdFilter)
    }

    const { data: ratings, error } = await query

    if (error) {
      console.error('Error fetching briefing ratings:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch ratings' },
        { status: 500 }
      )
    }

    // Compute simple aggregate
    const count = (ratings || []).length
    const averageOverall = count > 0
      ? (ratings!.reduce((sum, r) => sum + (r as any).overallScore, 0) / count)
      : null

    return NextResponse.json({ success: true, data: ratings || [], stats: { count, averageOverall } })
  } catch (error) {
    console.error('Error in ratings GET:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: briefingId } = await params
    const ctxOrResp = await requireVendorScope(request)
    if (ctxOrResp instanceof NextResponse) return ctxOrResp

    const vendorDomainId = ctxOrResp.id
    const body = await request.json()
    const {
      overallScore,
      strategyScore,
      materialsClarityScore,
      featuresDesignScore,
      valueScore,
      engagementScore,
      comments
    } = body || {}

    // Identify analyst: allow either Supabase auth or analyst headers
    const supabase = await createClient()
    const service = createServiceClient()

    const analystEmailHeader = request.headers.get('x-analyst-email')?.toLowerCase() || ''
    const analystIdHeader = request.headers.get('x-analyst-id') || ''

    let analystId: string | null = null

    // Try to resolve via supabase auth user -> analysts table
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const email = user?.email?.toLowerCase() || analystEmailHeader
      if (email) {
        const { data: analystRow } = await supabase
          .from('analysts')
          .select('id, email')
          .eq('email', email)
          .single()
        if (analystRow?.id) analystId = analystRow.id
      }
    } catch {}

    // Fallback to header-provided id if verified against service
    if (!analystId && analystIdHeader && analystEmailHeader) {
      try {
        const { data: verified } = await service
          .from('analysts')
          .select('id, email')
          .eq('id', analystIdHeader)
          .eq('email', analystEmailHeader)
          .single()
        if (verified?.id) analystId = verified.id
      } catch {}
    }

    if (!analystId) {
      return NextResponse.json(
        { success: false, error: 'Analyst identity required' },
        { status: 401 }
      )
    }

    if (!overallScore || typeof overallScore !== 'number' || overallScore < 1 || overallScore > 5) {
      return NextResponse.json(
        { success: false, error: 'overallScore (1-5) is required' },
        { status: 400 }
      )
    }

    // Upsert rating for (briefingId, analystId)
    const now = new Date().toISOString()

    // First try to find existing
    const { data: existing } = await service
      .from('briefing_ratings')
      .select('id')
      .eq('briefingId', briefingId)
      .eq('analystId', analystId)
      .eq('vendor_domain_id', vendorDomainId)
      .single()

    let result
    if (existing?.id) {
      const { data, error } = await service
        .from('briefing_ratings')
        .update({
          overallScore,
          strategyScore,
          materialsClarityScore,
          featuresDesignScore,
          valueScore,
          engagementScore,
          comments,
          updatedAt: now
        })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) {
        console.error('Error updating briefing rating:', error)
        return NextResponse.json({ success: false, error: 'Failed to save rating' }, { status: 500 })
      }
      result = data
    } else {
      const { data, error } = await service
        .from('briefing_ratings')
        .insert({
          id: generateId(),
          briefingId,
          analystId,
          vendor_domain_id: vendorDomainId,
          overallScore,
          strategyScore,
          materialsClarityScore,
          featuresDesignScore,
          valueScore,
          engagementScore,
          comments,
          createdAt: now,
          updatedAt: now
        })
        .select()
        .single()
      if (error) {
        console.error('Error inserting briefing rating:', error)
        return NextResponse.json({ success: false, error: 'Failed to save rating' }, { status: 500 })
      }
      result = data
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error in ratings POST:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
