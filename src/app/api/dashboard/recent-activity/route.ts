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

interface ActivityItem {
  type: string
  message: string
  time: string
  icon: string
  color: string
  timestamp: Date
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  if (diffInHours < 24) return `${diffInHours} hours ago`
  if (diffInDays === 1) return '1 day ago'
  return `${diffInDays} days ago`
}

export async function GET() {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString()

    // Fetch recent activities from different sources
    const [
      { data: recentAnalystUpdates },
      { data: recentNewsletters },
      { data: recentBriefings },
      { data: recentAlerts },
      { data: recentInteractions },
      { data: recentCalendarMeetings }
    ] = await Promise.all([
      // Recent analyst updates
      supabase
        .from('Analyst')
        .select('firstName, lastName, company, updatedAt')
        .gte('updatedAt', sevenDaysAgoStr)
        .order('updatedAt', { ascending: false })
        .limit(3),

      // Recent newsletters sent
      supabase
        .from('Newsletter')
        .select(`
          title,
          sentAt,
          subscriptions (
            id
          )
        `)
        .eq('status', 'SENT')
        .gte('sentAt', sevenDaysAgoStr)
        .order('sentAt', { ascending: false })
        .limit(3),

      // Recent completed briefings
      supabase
        .from('Briefing')
        .select('title, completedAt')
        .eq('status', 'COMPLETED')
        .gte('completedAt', sevenDaysAgoStr)
        .order('completedAt', { ascending: false })
        .limit(3),

      // Recent alerts
      supabase
        .from('Alert')
        .select(`
          title,
          type,
          createdAt,
          analyst (
            firstName,
            lastName
          )
        `)
        .gte('createdAt', sevenDaysAgoStr)
        .order('createdAt', { ascending: false })
        .limit(3),

      // Recent interactions
      supabase
        .from('Interaction')
        .select(`
          type,
          subject,
          date,
          analyst (
            firstName,
            lastName,
            company
          )
        `)
        .gte('date', sevenDaysAgoStr)
        .order('date', { ascending: false })
        .limit(3),

      // Recent calendar meetings
      supabase
        .from('CalendarMeeting')
        .select(`
          title,
          startTime,
          analyst (
            firstName,
            lastName,
            company
          )
        `)
        .eq('isAnalystMeeting', true)
        .gte('startTime', sevenDaysAgoStr)
        .order('startTime', { ascending: false })
        .limit(3)
    ])

    const activities: ActivityItem[] = []

    // Add analyst updates
    if (recentAnalystUpdates) {
      recentAnalystUpdates.forEach(analyst => {
        activities.push({
          type: 'analyst_updated',
          message: `${analyst.firstName} ${analyst.lastName}${analyst.company ? ` (${analyst.company})` : ''} profile updated`,
          time: formatTimeAgo(new Date(analyst.updatedAt)),
          icon: 'Users',
          color: 'text-blue-600',
          timestamp: new Date(analyst.updatedAt)
        })
      })
    }

    // Add newsletter sends
    if (recentNewsletters) {
      recentNewsletters.forEach(newsletter => {
        if (newsletter.sentAt) {
          activities.push({
            type: 'newsletter_sent',
            message: `"${newsletter.title}" newsletter sent to ${newsletter.subscriptions?.length || 0} analysts`,
            time: formatTimeAgo(new Date(newsletter.sentAt)),
            icon: 'Mail',
            color: 'text-green-600',
            timestamp: new Date(newsletter.sentAt)
          })
        }
      })
    }

    // Add completed briefings
    if (recentBriefings) {
      recentBriefings.forEach(briefing => {
        if (briefing.completedAt) {
          activities.push({
            type: 'briefing_completed',
            message: `Briefing completed: "${briefing.title}"`,
            time: formatTimeAgo(new Date(briefing.completedAt)),
            icon: 'Calendar',
            color: 'text-purple-600',
            timestamp: new Date(briefing.completedAt)
          })
        }
      })
    }

    // Add alert triggers
    if (recentAlerts) {
      recentAlerts.forEach(alert => {
        const alertTypeLabel = alert.type.toLowerCase().replace('_', ' ')
        activities.push({
          type: 'alert_triggered',
          message: `${alertTypeLabel} alert: ${alert.title}`,
          time: formatTimeAgo(new Date(alert.createdAt)),
          icon: 'AlertTriangle',
          color: 'text-orange-600',
          timestamp: new Date(alert.createdAt)
        })
      })
    }

    // Add interactions
    if (recentInteractions) {
      recentInteractions.forEach(interaction => {
        const typeLabel = interaction.type.toLowerCase()
        activities.push({
          type: 'interaction_logged',
          message: `${typeLabel} with ${interaction.analyst.firstName} ${interaction.analyst.lastName}: "${interaction.subject}"`,
          time: formatTimeAgo(new Date(interaction.date)),
          icon: 'MessageSquare',
          color: 'text-indigo-600',
          timestamp: new Date(interaction.date)
        })
      })
    }

    // Add calendar meetings
    if (recentCalendarMeetings) {
      recentCalendarMeetings.forEach(meeting => {
        if (meeting.analyst) {
          activities.push({
            type: 'meeting_held',
            message: `Meeting with ${meeting.analyst.firstName} ${meeting.analyst.lastName}: "${meeting.title}"`,
            time: formatTimeAgo(new Date(meeting.startTime)),
            icon: 'Video',
            color: 'text-teal-600',
            timestamp: new Date(meeting.startTime)
          })
        }
      })
    }

    // Sort all activities by timestamp (most recent first) and take top 10
    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)
      .map(({ timestamp, ...activity }) => activity) // Remove timestamp from response

    return NextResponse.json(sortedActivities)
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    )
  }
}
