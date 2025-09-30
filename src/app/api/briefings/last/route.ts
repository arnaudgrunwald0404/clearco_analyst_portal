import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireVendorScope } from '@/lib/vendor-context'

export async function GET(request: NextRequest) {
  try {
    const ctxOrResp = await requireVendorScope(request)
    if (ctxOrResp instanceof NextResponse) return ctxOrResp

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase env vars missing for briefings/last route')
      return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 })
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Fetch the most recent completed briefing
    const { data, error } = await supabase
      .from('briefings')
      .select('*')
      .eq('vendor_domain_id', ctxOrResp.id)
      .eq('status', 'COMPLETED')
      .order('completedAt', { ascending: false })
      .limit(1)
      .single()

    if (error && (error as any).code !== 'PGRST116') { // ignore No rows error
      console.error('Error fetching last briefing:', error)
      const devDetails = process.env.NODE_ENV !== 'production' ? { details: (error as any)?.message || String(error) } : {}
      return NextResponse.json({ success: false, error: 'Failed to fetch last briefing', ...devDetails }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || null })
  } catch (e) {
    console.error('Error in last briefing route:', e)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}


