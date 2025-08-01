import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Placeholder implementation
    return NextResponse.json({
      success: true,
      message: 'Calendar sync endpoint - to be implemented'
    })
  } catch (error) {
    console.error('Error in calendar sync:', error)
    return NextResponse.json(
      { success: false, error: 'Calendar sync not implemented yet' },
      { status: 501 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get analytics about calendar meeting to briefing conversion
    const [
      totalCalendarMeetings,
      analystMeetings,
      briefingsFromCalendar,
      recentMeetings
    ] = await Promise.all([
      prisma.calendarMeeting.count(),
      prisma.calendarMeeting.count({
        where: { isAnalystMeeting: true }
      }),
      prisma.briefing.count({
        where: { calendarMeetingId: { not: null } }
      }),
      prisma.calendarMeeting.findMany({
        where: {
          isAnalystMeeting: true,
          startTime: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        include: {
          briefings: true,
          analyst: {
            select: {
              firstName: true,
              lastName: true,
              company: true
            }
          }
        },
        orderBy: { startTime: 'desc' },
        take: 10
      })
    ])

    const meetingsWithoutBriefings = recentMeetings.filter(m => m.briefings.length === 0)

    return NextResponse.json({
      success: true,
      analytics: {
        totalCalendarMeetings,
        analystMeetings,
        briefingsFromCalendar,
        conversionRate: analystMeetings > 0 ? Math.round((briefingsFromCalendar / analystMeetings) * 100) : 0,
        recentMeetingsWithoutBriefings: meetingsWithoutBriefings.length
      },
      recentMeetings: recentMeetings.map(meeting => ({
        id: meeting.id,
        title: meeting.title,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        analyst: meeting.analyst,
        hasBriefing: meeting.briefings.length > 0,
        attendees: meeting.attendees ? JSON.parse(meeting.attendees) : []
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
