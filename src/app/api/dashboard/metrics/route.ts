import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Define engagement rate calculation
// Engagement rate = (Total meaningful interactions in last 30 days / Total active analysts) * 100
// Meaningful interactions include: newsletters opened/clicked, briefings completed, meetings held, social responses
async function calculateEngagementRate(): Promise<number> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Get total active analysts
  const totalActiveAnalysts = await prisma.analyst.count({
    where: {
      status: 'ACTIVE'
    }
  })

  if (totalActiveAnalysts === 0) return 0

  // Count meaningful interactions in the last 30 days
  const [
    newsletterEngagements,
    completedBriefings,
    recentInteractions,
    calendarMeetings
  ] = await Promise.all([
    // Newsletter opens and clicks
    prisma.newsletterSubscription.count({
      where: {
        OR: [
          { opened: true },
          { clicked: true }
        ],
        sentAt: {
          gte: thirtyDaysAgo
        }
      }
    }),

    // Completed briefings
    prisma.briefing.count({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: thirtyDaysAgo
        }
      }
    }),

    // Recent interactions (calls, meetings, emails, etc.)
    prisma.interaction.count({
      where: {
        date: {
          gte: thirtyDaysAgo
        }
      }
    }),

    // Calendar meetings with analysts
    prisma.calendarMeeting.count({
      where: {
        isAnalystMeeting: true,
        startTime: {
          gte: thirtyDaysAgo
        }
      }
    })
  ])

  const totalEngagements = newsletterEngagements + completedBriefings + recentInteractions + calendarMeetings
  
  // Calculate engagement rate
  const engagementRate = (totalEngagements / totalActiveAnalysts) * 100
  
  // Cap at 100% and round to nearest integer
  return Math.min(Math.round(engagementRate), 100)
}

// Calculate relationship health score
// Average relationship health weighted by influence score
async function calculateRelationshipHealth(): Promise<number> {
  const analysts = await prisma.analyst.findMany({
    where: {
      status: 'ACTIVE'
    },
    select: {
      relationshipHealth: true,
      influenceScore: true
    }
  })

  if (analysts.length === 0) return 0

  // Convert relationship health to numeric scores
  const healthScores = analysts.map(analyst => {
    let healthScore = 0
    switch (analyst.relationshipHealth) {
      case 'EXCELLENT': healthScore = 100; break
      case 'GOOD': healthScore = 80; break
      case 'FAIR': healthScore = 60; break
      case 'POOR': healthScore = 40; break
      case 'CRITICAL': healthScore = 20; break
      default: healthScore = 60; break
    }
    
    // Weight by influence score
    return healthScore * (analyst.influenceScore / 100)
  })

  const totalWeightedScore = healthScores.reduce((sum, score) => sum + score, 0)
  const totalWeight = analysts.reduce((sum, analyst) => sum + (analyst.influenceScore / 100), 0)
  
  return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'Missing DATABASE_URL environment variable' },
      { status: 500 }
    )
  }
  try {
    // Get basic counts
    const [
      totalAnalysts,
      activeAnalysts,
      newslettersSent,
      contentItems,
      activeAlerts,
      briefingsThisMonth
    ] = await Promise.all([
      prisma.analyst.count(),
      prisma.analyst.count({ where: { status: 'ACTIVE' } }),
      prisma.newsletter.count({ where: { status: 'SENT' } }),
      prisma.content.count(),
      prisma.alert.count({ where: { isRead: false } }),
      prisma.briefing.count({
        where: {
          scheduledAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ])

    // Calculate complex metrics
    const [engagementRate, relationshipHealth] = await Promise.all([
      calculateEngagementRate(),
      calculateRelationshipHealth()
    ])

    const metrics = {
      totalAnalysts,
      activeAnalysts,
      newslettersSent,
      contentItems,
      engagementRate,
      activeAlerts,
      briefingsThisMonth,
      relationshipHealth
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    )
  }
}
