import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function formatLastContact(date: Date | null): string {
  if (!date) return 'Never'
  
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return '1 day ago'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 14) return '1 week ago'
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 60) return '1 month ago'
  return `${Math.floor(diffInDays / 30)} months ago`
}

export async function GET() {
  try {
    // Get top analysts with their interactions and calendar meetings
    const analysts = await prisma.analyst.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        influenceScore: true,
        relationshipHealth: true,
        lastContactDate: true,
        interactions: {
          select: { date: true },
          orderBy: { date: 'desc' },
          take: 1
        },
        calendarMeetings: {
          select: { endTime: true },
          orderBy: { endTime: 'desc' },
          take: 1
        }
      },
      orderBy: { influenceScore: 'desc' },
      take: 5
    })

    const topAnalysts = analysts.map(analyst => {
      // Find the most recent contact date from various sources
      const contactDates = [
        analyst.lastContactDate,
        analyst.interactions?.[0]?.date,
        analyst.calendarMeetings?.[0]?.endTime
      ].filter(Boolean) as Date[]

      const lastContact = contactDates.length > 0 
        ? new Date(Math.max(...contactDates.map(d => new Date(d).getTime())))
        : null

      return {
        id: analyst.id,
        name: `${analyst.firstName} ${analyst.lastName}`,
        company: analyst.company || 'Unknown',
        influence: analyst.influenceScore,
        lastContact: formatLastContact(lastContact),
        health: analyst.relationshipHealth
      }
    })

    return NextResponse.json(topAnalysts)
  } catch (error) {
    console.error('Error fetching top analysts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top analysts' },
      { status: 500 }
    )
  }
}
