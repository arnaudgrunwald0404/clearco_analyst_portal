import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// Create a Supabase client with the service role key for API routes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET() {
  try {
    // Get basic counts using Supabase queries
    const [
      { count: totalAnalysts },
      { count: activeAnalysts },
      { count: newslettersSent },
      { count: contentItems },
      { count: activeAlerts },
      { count: briefingsThisMonth }
    ] = await Promise.all([
      supabase.from('Analyst').select('*', { count: 'exact', head: true }),
      supabase.from('Analyst').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('Newsletter').select('*', { count: 'exact', head: true }).eq('status', 'SENT'),
      supabase.from('Content').select('*', { count: 'exact', head: true }),
      supabase.from('Alert').select('*', { count: 'exact', head: true }).eq('isRead', false),
      supabase.from('Briefing').select('*', { count: 'exact', head: true }).gte('scheduledAt', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ])

    // Calculate engagement rate
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

    const [
      { count: newsletterEngagements },
      { count: completedBriefings },
      { count: recentInteractions },
      { count: calendarMeetings }
    ] = await Promise.all([
      supabase
        .from('NewsletterSubscription')
        .select('*', { count: 'exact', head: true })
        .or('opened.eq.true,clicked.eq.true')
        .gte('sentAt', thirtyDaysAgoStr),
      supabase
        .from('Briefing')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'COMPLETED')
        .gte('completedAt', thirtyDaysAgoStr),
      supabase
        .from('Interaction')
        .select('*', { count: 'exact', head: true })
        .gte('date', thirtyDaysAgoStr),
      supabase
        .from('CalendarMeeting')
        .select('*', { count: 'exact', head: true })
        .eq('isAnalystMeeting', true)
        .gte('startTime', thirtyDaysAgoStr)
    ])

    // Calculate engagement rate
    const totalEngagements = (newsletterEngagements || 0) + (completedBriefings || 0) + 
                           (recentInteractions || 0) + (calendarMeetings || 0)
    const engagementRate = (activeAnalysts || 0) > 0 
      ? Math.min(Math.round((totalEngagements / (activeAnalysts || 1)) * 100), 100)
      : 0

    // Calculate relationship health
    const { data: analysts } = await supabase
      .from('Analyst')
      .select('relationshipHealth, influenceScore')
      .eq('status', 'ACTIVE')

    let relationshipHealth = 0
    if (analysts && analysts.length > 0) {
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
      totalAnalysts: totalAnalysts || 0,
      activeAnalysts: activeAnalysts || 0,
      newslettersSent: newslettersSent || 0,
      contentItems: contentItems || 0,
      engagementRate,
      activeAlerts: activeAlerts || 0,
      briefingsThisMonth: briefingsThisMonth || 0,
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
