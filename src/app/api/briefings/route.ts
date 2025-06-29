import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const analystId = searchParams.get('analystId')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (analystId) {
      where.analysts = {
        some: {
          analystId: analystId
        }
      }
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { transcript: { contains: search, mode: 'insensitive' } },
        { aiSummary: { contains: search, mode: 'insensitive' } },
        { followUpSummary: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch briefings with related data
    const [briefings, total] = await Promise.all([
      prisma.briefing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          analysts: {
            include: {
              analyst: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  company: true,
                  title: true,
                  profileImageUrl: true
                }
              }
            }
          },
          calendarMeeting: {
            select: {
              id: true,
              title: true,
              startTime: true,
              endTime: true,
              attendees: true
            }
          }
        }
      }),
      prisma.briefing.count({ where })
    ])

    // Process briefings for better frontend consumption
    const processedBriefings = briefings.map(briefing => ({
      ...briefing,
      agenda: briefing.agenda ? JSON.parse(briefing.agenda) : [],
      outcomes: briefing.outcomes ? JSON.parse(briefing.outcomes) : [],
      followUpActions: briefing.followUpActions ? JSON.parse(briefing.followUpActions) : [],
      attendeeEmails: briefing.attendeeEmails ? JSON.parse(briefing.attendeeEmails) : [],
      analysts: briefing.analysts.map(ba => ({
        ...ba.analyst,
        role: ba.role
      })),
      calendarMeeting: briefing.calendarMeeting ? {
        ...briefing.calendarMeeting,
        attendees: briefing.calendarMeeting.attendees ? JSON.parse(briefing.calendarMeeting.attendees) : []
      } : null
    }))

    return NextResponse.json({
      success: true,
      data: processedBriefings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching briefings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch briefings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      scheduledAt,
      agenda,
      analystIds,
      calendarMeetingId,
      attendeeEmails,
      duration
    } = body

    // Create briefing
    const briefing = await prisma.briefing.create({
      data: {
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        agenda: agenda ? JSON.stringify(agenda) : null,
        calendarMeetingId,
        attendeeEmails: attendeeEmails ? JSON.stringify(attendeeEmails) : null,
        duration,
        analysts: {
          create: analystIds.map((analystId: string, index: number) => ({
            analystId,
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

    return NextResponse.json({
      success: true,
      data: {
        ...briefing,
        agenda: briefing.agenda ? JSON.parse(briefing.agenda) : [],
        attendeeEmails: briefing.attendeeEmails ? JSON.parse(briefing.attendeeEmails) : [],
        analysts: briefing.analysts.map(ba => ({
          ...ba.analyst,
          role: ba.role
        }))
      }
    })

  } catch (error) {
    console.error('Error creating briefing:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create briefing' },
      { status: 500 }
    )
  }
}
