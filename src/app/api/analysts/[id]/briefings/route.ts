import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireVendorScope } from '@/lib/vendor-context'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const ctxOrResp = await requireVendorScope(request)
    if (ctxOrResp instanceof NextResponse) return ctxOrResp

    // Fetch briefing history via briefing_analysts table
    const { data: briefingAnalysts, error } = await supabase
      .from('briefing_analysts')
      .select(`
        briefings!inner(
          id,
          title,
          description,
          scheduledAt,
          duration,
          status,
          location,
          meetingUrl,
          agenda,
          notes,
          followUpItems,
          recordingUrl,
          isRecurring,
          recurringPattern,
          reminderSent,
          createdAt,
          updatedAt
        )
      `)
      .eq('analystId', id)
      .eq('vendor_domain_id', ctxOrResp.id)
      .eq('briefings.vendor_domain_id', ctxOrResp.id)
      .order('briefings(scheduledAt)', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching analyst briefings:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch briefings' },
        { status: 500 }
      )
    }

    // Extract and process briefings
    const briefings = (briefingAnalysts || []).map(ba => ba.briefings).filter(Boolean)

    console.log(`📋 Found ${briefings.length} briefings for analyst ${id}`)

    return NextResponse.json({
      success: true,
      data: briefings
    })

  } catch (error) {
    console.error('Error fetching analyst briefings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch briefings' },
      { status: 500 }
    )
  }
}
