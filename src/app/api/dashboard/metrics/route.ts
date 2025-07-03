import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Calculate date 90 days ago
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // Get basic counts using Prisma
    const [
      totalAnalysts,
      activeAnalysts,
      analystsAddedPast90Days,
      newslettersSentPast90Days,
      contentItemsPast90Days,
      activeAlerts,
      briefingsPast90Days
    ] = await Promise.all([
      prisma.analyst.count(),
      prisma.analyst.count({ where: { status: 'ACTIVE' } }),
      prisma.analyst.count({ where: { createdAt: { gte: ninetyDaysAgo } } }),
      prisma.newsletter.count({ where: { status: 'SENT', sentAt: { gte: ninetyDaysAgo } } }),
      prisma.content.count({ where: { createdAt: { gte: ninetyDaysAgo } } }),
      prisma.alert.count({ where: { isRead: false } }),
      prisma.briefing.count({ where: { scheduledAt: { gte: ninetyDaysAgo } } })
    ])

    // Get detailed content items from past 90 days
    const recentContentItems = await prisma.content.findMany({
      where: { createdAt: { gte: ninetyDaysAgo } },
      select: { id: true, title: true, type: true, createdAt: true, isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Get newly added analysts from past 90 days
    const newAnalysts = await prisma.analyst.findMany({
      where: { createdAt: { gte: ninetyDaysAgo } },
      select: { id: true, firstName: true, lastName: true, company: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Calculate engagement metrics
    const [
      newsletterEngagements,
      completedBriefings,
      recentInteractions,
      calendarMeetings
    ] = await Promise.all([
      prisma.newsletterSubscription.count({
        where: {
          OR: [{ opened: true }, { clicked: true }],
          sentAt: { gte: ninetyDaysAgo }
        }
      }),
      prisma.briefing.count({
        where: { status: 'COMPLETED', completedAt: { gte: ninetyDaysAgo } }
      }),
      prisma.interaction.count({ where: { date: { gte: ninetyDaysAgo } } }),
      prisma.calendarMeeting.count({
        where: { isAnalystMeeting: true, startTime: { gte: ninetyDaysAgo } }
      })
    ])

    const totalEngagements = newsletterEngagements + completedBriefings + recentInteractions + calendarMeetings
    const engagementRate = activeAnalysts > 0
      ? Math.min(Math.round((totalEngagements / activeAnalysts) * 100), 100)
      : 0

    // Calculate relationship health
    const analysts = await prisma.analyst.findMany({
      where: { status: 'ACTIVE' },
      select: { relationshipHealth: true, influenceScore: true }
    })

    let relationshipHealth = 0
    if (analysts.length > 0) {
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
        return healthScore * (analyst.influenceScore / 100)
      })

      const totalWeightedScore = healthScores.reduce((sum, score) => sum + score, 0)
      const totalWeight = analysts.reduce((sum, analyst) => sum + (analyst.influenceScore / 100), 0)
      relationshipHealth = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0
    }

    const metrics = {
      totalAnalysts,
      activeAnalysts,
      analystsAddedPast90Days,
      newslettersSentPast90Days,
      contentItemsPast90Days,
      engagementRate,
      activeAlerts,
      briefingsPast90Days,
      relationshipHealth,
      recentContentItems,
      newAnalysts
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
