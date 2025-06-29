import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Find calendar meetings that are analyst meetings but don't have briefings yet
    const calendarMeetings = await prisma.calendarMeeting.findMany({
      where: {
        isAnalystMeeting: true,
        briefings: {
          none: {}
        },
        startTime: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: {
        analyst: true
      }
    })

    const createdBriefings = []

    for (const meeting of calendarMeetings) {
      try {
        // Parse attendees to find analysts
        const attendees = meeting.attendees ? JSON.parse(meeting.attendees) : []
        const analystEmails = attendees.filter((email: string) => 
          email && typeof email === 'string'
        )

        // Find analysts based on attendee emails
        const analysts = await prisma.analyst.findMany({
          where: {
            email: {
              in: analystEmails
            }
          }
        })

        // If we found analysts (or have the primary analyst from the meeting), create a briefing
        if (analysts.length > 0 || meeting.analyst) {
          const allAnalysts = meeting.analyst ? 
            [meeting.analyst, ...analysts.filter(a => a.id !== meeting.analystId)] : 
            analysts

          const briefing = await prisma.briefing.create({
            data: {
              title: meeting.title,
              description: meeting.description,
              scheduledAt: meeting.startTime,
              status: meeting.endTime < new Date() ? 'COMPLETED' : 'SCHEDULED',
              completedAt: meeting.endTime < new Date() ? meeting.endTime : null,
              calendarMeetingId: meeting.id,
              attendeeEmails: JSON.stringify(attendees),
              duration: Math.round((meeting.endTime.getTime() - meeting.startTime.getTime()) / (1000 * 60)),
              analysts: {
                create: allAnalysts.map((analyst, index) => ({
                  analystId: analyst.id,
                  role: index === 0 ? 'PRIMARY' : 'SECONDARY'
                }))
              }
            },
            include: {
              analysts: {
                include: {
                  analyst: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                      company: true
                    }
                  }
                }
              }
            }
          })

          createdBriefings.push({
            ...briefing,
            analysts: briefing.analysts.map(ba => ({
              ...ba.analyst,
              role: ba.role
            }))
          })
        }
      } catch (error) {
        console.error(`Error creating briefing for meeting ${meeting.id}:`, error)
        // Continue with other meetings
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdBriefings.length} briefings from calendar meetings`,
      data: createdBriefings
    })

  } catch (error) {
    console.error('Error syncing calendar meetings to briefings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sync calendar meetings' },
      { status: 500 }
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
