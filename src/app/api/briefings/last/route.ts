import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Fetch the most recent completed briefing
    const { data, error } = await supabase
      .from('briefings')
      .select('*')
      .eq('status', 'COMPLETED')
      .order('completedAt', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // ignore No rows error
      console.error('Error fetching last briefing:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch last briefing' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || null })
  } catch (e) {
    console.error('Error in last briefing route:', e)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}


