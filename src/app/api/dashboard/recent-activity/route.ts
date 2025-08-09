import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Cache duration in seconds
const CACHE_DURATION = 300; // 5 minutes
let activityCache: any = null;
let cacheTimestamp: number = 0;

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
  
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`
  if (diffInHours < 24) return `${diffInHours} hours ago`
  if (diffInDays === 1) return '1 day ago'
  return `${diffInDays} days ago`
}

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), { status: 500 })
    }
    const now = Date.now();
    
    // Return cached data if still valid
    if (activityCache && (now - cacheTimestamp) < (CACHE_DURATION * 1000)) {
      return NextResponse.json({
        ...activityCache,
        cached: true,
        cacheAge: Math.floor((now - cacheTimestamp) / 1000)
      });
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoISO = sevenDaysAgo.toISOString()

    const supabase = await createClient()

    // Fetch recent activities from different sources using Supabase with error handling
    let recentAnalystUpdates: any[] = []
    let recentBriefings: any[] = []
    let recentCalendarMeetings: any[] = []

    // Recent analyst updates
    try {
      const { data: analysts, error } = await supabase
        .from('analysts')
        .select('firstName, lastName, company, updatedAt')
        .gte('updatedAt', sevenDaysAgoISO)
        .order('updatedAt', { ascending: false })
        .limit(3)

      if (!error && analysts) {
        recentAnalystUpdates = analysts
      }
    } catch (error) {
      console.log('Recent analyst updates query failed:', error)
    }

    // Recent completed briefings
    try {
      const { data: briefings, error } = await supabase
        .from('briefings')
        .select('title, completedAt')
        .eq('status', 'COMPLETED')
        .gte('completedAt', sevenDaysAgoISO)
        .not('completedAt', 'is', null)
        .order('completedAt', { ascending: false })
        .limit(3)

      if (!error && briefings) {
        recentBriefings = briefings
      }
    } catch (error) {
      console.log('Recent briefings query failed:', error)
    }

    // Recent calendar meetings
    try {
      const { data: meetings, error } = await supabase
        .from('calendar_meetings')
        .select('title, startTime, endTime')
        .gte('startTime', sevenDaysAgoISO)
        .order('startTime', { ascending: false })
        .limit(3)

      if (!error && meetings) {
        recentCalendarMeetings = meetings
      }
    } catch (error) {
      console.log('Recent calendar meetings query failed:', error)
    }

    // Convert data to activity items
    const activities: ActivityItem[] = []

    // Add analyst updates
    recentAnalystUpdates.forEach(analyst => {
      activities.push({
        type: 'analyst_updated',
        message: `${analyst.firstName} ${analyst.lastName}${analyst.company ? ` (${analyst.company})` : ''} profile updated`,
        time: formatTimeAgo(new Date(analyst.updatedAt)),
        icon: 'Users',
        color: 'blue',
        timestamp: new Date(analyst.updatedAt)
      })
    })

    // Add completed briefings
    recentBriefings.forEach(briefing => {
      activities.push({
        type: 'briefing_completed',
        message: `Briefing "${briefing.title}" completed`,
        time: formatTimeAgo(new Date(briefing.completedAt)),
        icon: 'Calendar',
        color: 'green',
        timestamp: new Date(briefing.completedAt)
      })
    })

    // Add calendar meetings
    recentCalendarMeetings.forEach(meeting => {
      activities.push({
        type: 'calendar_meeting',
        message: `Calendar meeting: ${meeting.title}`,
        time: formatTimeAgo(new Date(meeting.startTime)),
        icon: 'Video',
        color: 'purple',
        timestamp: new Date(meeting.startTime)
      })
    })

    // Sort activities by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Take only top 10 activities
    const recentActivities = activities.slice(0, 10)

    // Cache the results
    activityCache = recentActivities;
    cacheTimestamp = now;

    console.log(`📈 Recent activity loaded: ${recentActivities.length} items (fresh)`);

    return NextResponse.json({
      data: recentActivities,
      cached: false,
      cacheAge: 0
    });

  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    )
  }
}
