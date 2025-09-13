import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase env vars missing for briefings/next route')
      return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 })
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const nowIso = new Date().toISOString()

    // Fetch the next scheduled/rescheduled briefing (soonest upcoming)
    const { data, error } = await supabase
      .from('briefings')
      .select('*')
      .in('status', ['SCHEDULED', 'RESCHEDULED'])
      .gte('scheduledAt', nowIso)
      .order('scheduledAt', { ascending: true })
      .limit(1)
      .single()

    if (error && (error as any).code !== 'PGRST116') { // ignore No rows error
      console.error('Error fetching next briefing:', error)
      const devDetails = process.env.NODE_ENV !== 'production' ? { details: (error as any)?.message || String(error) } : {}
      return NextResponse.json({ success: false, error: 'Failed to fetch next briefing', ...devDetails }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || null })
  } catch (e) {
    console.error('Error in next briefing route:', e)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}


