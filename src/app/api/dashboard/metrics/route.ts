import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Calculate date 90 days ago
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // Get basic counts using Prisma - with error handling for missing tables
    let totalAnalysts = 0
    let activeAnalysts = 0
    let analystsAddedPast90Days = 0
    let newslettersSentPast90Days = 0
    let contentItemsPast90Days = 0
    let activeAlerts = 0
    let briefingsPast90Days = 0

    try {
      totalAnalysts = await prisma.analyst.count()
    } catch (error) {
      console.log('Analyst table not available:', error)
    }

    try {
      activeAnalysts = await prisma.analyst.count({ where: { status: 'ACTIVE' } })
    } catch (error) {
      console.log('Active analysts query failed:', error)
    }

    try {
      analystsAddedPast90Days = await prisma.analyst.count({ where: { createdAt: { gte: ninetyDaysAgo } } })
    } catch (error) {
      console.log('Recent analysts query failed:', error)
    }

    try {
      newslettersSentPast90Days = await prisma.newsletter.count({ where: { status: 'SENT', sentAt: { gte: ninetyDaysAgo } } })
    } catch (error) {
      console.log('Newsletter table not available:', error)
    }

    try {
      contentItemsPast90Days = await prisma.content.count({ where: { createdAt: { gte: ninetyDaysAgo } } })
    } catch (error) {
      console.log('Content table not available:', error)
    }

    try {
      activeAlerts = await prisma.alert.count({ where: { isRead: false } })
    } catch (error) {
      console.log('Alert table not available:', error)
    }

    try {
      briefingsPast90Days = await prisma.briefing.count({ where: { scheduledAt: { gte: ninetyDaysAgo } } })
    } catch (error) {
      console.log('Briefing table not available:', error)
    }

    // Get detailed content items from past 90 days
    let recentContentItems: Array<{ id: string; title: string; type: string; createdAt: Date; isPublished: boolean }> = []
    try {
      recentContentItems = await prisma.content.findMany({
        where: { createdAt: { gte: ninetyDaysAgo } },
        select: { id: true, title: true, type: true, createdAt: true, isPublished: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    } catch (error) {
      console.log('Content items query failed:', error)
    }

    // Get newly added analysts from past 90 days
    let newAnalysts: Array<{ id: string; firstName: string; lastName: string; company: string | null; createdAt: Date }> = []
    try {
      newAnalysts = await prisma.analyst.findMany({
        where: { createdAt: { gte: ninetyDaysAgo } },
        select: { id: true, firstName: true, lastName: true, company: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    } catch (error) {
      console.log('New analysts query failed:', error)
    }

    // Calculate engagement metrics with error handling
    let newsletterEngagements = 0
    let completedBriefings = 0
    let recentInteractions = 0
    let calendarMeetings = 0

    try {
      newsletterEngagements = await prisma.newsletterSubscription.count({
        where: {
          OR: [{ opened: true }, { clicked: true }],
          sentAt: { gte: ninetyDaysAgo }
        }
      })
    } catch (error) {
      console.log('Newsletter engagements query failed:', error)
    }

    try {
      completedBriefings = await prisma.briefing.count({
        where: { status: 'COMPLETED', completedAt: { gte: ninetyDaysAgo } }
      })
    } catch (error) {
      console.log('Completed briefings query failed:', error)
    }

    try {
      recentInteractions = await prisma.interaction.count({ where: { date: { gte: ninetyDaysAgo } } })
    } catch (error) {
      console.log('Recent interactions query failed:', error)
    }

    try {
      calendarMeetings = await prisma.calendarMeeting.count({
        where: { isAnalystMeeting: true, startTime: { gte: ninetyDaysAgo } }
      })
    } catch (error) {
      console.log('Calendar meetings query failed:', error)
    }

    const totalEngagements = newsletterEngagements + completedBriefings + recentInteractions + calendarMeetings
    const engagementRate = activeAnalysts > 0
      ? Math.min(Math.round((totalEngagements / activeAnalysts) * 100), 100)
      : 0

    // Calculate relationship health
    let relationshipHealth = 0
    try {
      const analysts = await prisma.analyst.findMany({
        where: { status: 'ACTIVE' },
        select: { relationshipHealth: true, influenceScore: true }
      })

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
    } catch (error) {
      console.log('Relationship health calculation failed:', error)
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
