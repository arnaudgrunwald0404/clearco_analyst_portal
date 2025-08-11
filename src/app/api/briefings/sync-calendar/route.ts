import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const origin = request.nextUrl.origin

    // Fetch all active calendar connections
    const { data: connections, error } = await supabase
      .from('calendar_connections')
      .select('id, title, email, is_active')
      .eq('is_active', true)

    if (error) {
      throw new Error('Failed to load calendar connections')
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active calendar connections found',
        triggered: 0
      })
    }

    // Trigger per-connection syncs
    const internalSecret = process.env.INTERNAL_JOB_SECRET
    const results = await Promise.allSettled(
      connections.map((c) =>
        fetch(`${origin}/api/settings/calendar-connections/${c.id}/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(internalSecret ? { 'X-Internal-Job': internalSecret } : {})
          },
          body: JSON.stringify({ forceSync: true })
        })
      )
    )

    // Count only successful 2xx responses
    const triggered = results.filter(
      (r) => r.status === 'fulfilled' && r.value && 'ok' in r.value && r.value.ok
    ).length

    return NextResponse.json({
      success: true,
      message: `Triggered sync for ${triggered} connection(s)`,
      triggered,
      totalConnections: connections.length
    })
  } catch (error) {
    console.error('Error in calendar sync dispatch:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to trigger calendar sync' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Counts using Supabase
    const [{ count: totalCalendarMeetings }, { count: analystMeetings }, { count: recentAnalystMeetings }] = await Promise.all([
      supabase.from('calendar_meetings').select('*', { count: 'exact', head: true }),
      supabase.from('calendar_meetings').select('*', { count: 'exact', head: true }).eq('is_analyst_meeting', true),
      supabase.from('calendar_meetings').select('*', { count: 'exact', head: true }).eq('is_analyst_meeting', true).gte('start_time', sevenDaysAgo)
    ])

    // Recent meetings list (limited fields)
    const { data: recentMeetings } = await supabase
      .from('calendar_meetings')
      .select('id, title, start_time, end_time, attendees, analyst_id, is_analyst_meeting')
      .eq('is_analyst_meeting', true)
      .gte('start_time', sevenDaysAgo)
      .order('start_time', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      analytics: {
        totalCalendarMeetings: totalCalendarMeetings || 0,
        analystMeetings: analystMeetings || 0,
        recentAnalystMeetings: recentAnalystMeetings || 0
      },
      recentMeetings: (recentMeetings || []).map((m) => ({
        id: m.id,
        title: m.title,
        startTime: m.start_time,
        endTime: m.end_time,
        hasBriefing: false, // Could be enhanced by joining to briefings if linked
        attendees: m.attendees ? JSON.parse(m.attendees) : []
      }))
    })
  } catch (error) {
    console.error('Error fetching calendar sync analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
