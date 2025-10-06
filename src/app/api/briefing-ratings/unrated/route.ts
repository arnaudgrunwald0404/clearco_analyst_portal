import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireVendorScope } from '@/lib/vendor-context'

export async function GET(request: NextRequest) {
  try {
    const ctxOrResp = await requireVendorScope(request)
    if (ctxOrResp instanceof NextResponse) return ctxOrResp

    const vendorDomainId = ctxOrResp.id
    const supabase = await createClient()
    const service = createServiceClient()

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)

    // Identify analyst
    const { data: { user } } = await supabase.auth.getUser()
    const analystEmailHeader = request.headers.get('x-analyst-email')?.toLowerCase() || ''
    const analystIdHeader = request.headers.get('x-analyst-id') || ''

    let email = user?.email?.toLowerCase() || analystEmailHeader
    if (!email) {
      return NextResponse.json({ success: false, error: 'Analyst context required' }, { status: 401 })
    }

    const { data: analystRow, error: analystErr } = await service
      .from('analysts')
      .select('id, email')
      .eq('email', email)
      .single()

    if (analystErr || !analystRow?.id) {
      return NextResponse.json({ success: false, error: 'Analyst not found' }, { status: 404 })
    }

    const analystId = analystRow.id

    // Fetch completed briefings for this analyst within last X days
    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data: baRows, error: baErr } = await service
      .from('briefing_analysts')
      .select('briefings!inner(id, title, scheduledAt, completedAt, status)')
      .eq('analystId', analystId)
      .eq('briefings.vendor_domain_id', vendorDomainId)
      .eq('briefings.status', 'COMPLETED')
      .gte('briefings.scheduledAt', since.toISOString())
      .order('briefings(scheduledAt)', { ascending: false })

    if (baErr) {
      console.error('Error fetching completed briefings for analyst:', baErr)
      return NextResponse.json({ success: false, error: 'Failed to fetch briefings' }, { status: 500 })
    }

    const briefings = (baRows || []).map((r: any) => r.briefings)

    // Fetch ratings for these briefings by this analyst
    const briefingIds = briefings.map((b: any) => b.id)
    let ratedIds: string[] = []
    if (briefingIds.length > 0) {
      const { data: ratings } = await service
        .from('briefing_ratings')
        .select('briefingId')
        .eq('vendor_domain_id', vendorDomainId)
        .eq('analystId', analystId)
        .in('briefingId', briefingIds)
      ratedIds = (ratings || []).map(r => (r as any).briefingId)
    }

    const unrated = briefings.filter((b: any) => !ratedIds.includes(b.id))

    return NextResponse.json({ success: true, data: unrated })
  } catch (error) {
    console.error('Error listing unrated briefings:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
