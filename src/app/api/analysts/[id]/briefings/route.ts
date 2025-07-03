import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch briefing history ordered by most recent first
    const briefings = await prisma.briefing.findMany({
      where: {
        analysts: {
          some: {
            analystId: id
          }
        }
      },
      include: {
        analysts: {
          include: {
            analyst: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      },
      take: 20 // Limit to most recent 20 briefings
    })

    // Parse JSON fields for better frontend consumption
    const processedBriefings = briefings.map(briefing => ({
      ...briefing,
      agenda: briefing.agenda ? JSON.parse(briefing.agenda) : [],
      outcomes: briefing.outcomes ? JSON.parse(briefing.outcomes) : [],
      followUpActions: briefing.followUpActions ? JSON.parse(briefing.followUpActions) : []
    }))

    return NextResponse.json({
      success: true,
      data: processedBriefings
    })

  } catch (error) {
    console.error('Error fetching briefings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch briefings' },
      { status: 500 }
    )
  }
}
