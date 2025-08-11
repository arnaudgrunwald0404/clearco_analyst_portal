import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

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

    if (error && error.code !== 'PGRST116') { // ignore No rows error
      console.error('Error fetching next briefing:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch next briefing' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || null })
  } catch (e) {
    console.error('Error in next briefing route:', e)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}


