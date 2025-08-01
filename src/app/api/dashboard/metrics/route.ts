import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// In-memory cache
let cache: {
  data: any | null
  timestamp: number
  duration: number
} = {
  data: null,
  timestamp: 0,
  duration: 10 * 60 * 1000 // 10 minutes
}

export async function GET() {
  try {
    // Check cache first
    const now = Date.now()
    if (cache.data && (now - cache.timestamp) < cache.duration) {
      console.log('📊 Returning cached dashboard metrics')
      return NextResponse.json({
        ...cache.data,
        cached: true,
        cacheAge: Math.floor((now - cache.timestamp) / 1000)
      })
    }

    const supabase = await createClient()

    console.log('📊 Fetching fresh dashboard metrics from Supabase...')

    // Execute all queries in parallel for better performance
    const [
      analystsResult,
      briefingsResult,
      upcomingBriefingsResult,
      actionItemsResult,
      socialPostsResult
    ] = await Promise.all([
      // Total analysts count and breakdown by status
      supabase
        .from('analysts')
        .select('status', { count: 'exact' }),
      
      // Total briefings and breakdown by status  
      supabase
        .from('briefings')
        .select('status', { count: 'exact' }),

      // Upcoming briefings (next 30 days)
      supabase
        .from('briefings')
        .select('*', { count: 'exact' })
        .gte('scheduledAt', new Date().toISOString())
        .lte('scheduledAt', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
        .eq('status', 'SCHEDULED'),

      // Action items breakdown
      supabase
        .from('action_items')
        .select('status', { count: 'exact' }),

      // Recent social activity (last 7 days)
      supabase
        .from('social_posts')
        .select('*', { count: 'exact' })
        .gte('postedAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ])

    // Check for errors
    if (analystsResult.error) {
      console.error('Error fetching analysts:', analystsResult.error)
      throw new Error('Failed to fetch analysts data')
    }
    if (briefingsResult.error) {
      console.error('Error fetching briefings:', briefingsResult.error)
      throw new Error('Failed to fetch briefings data')
    }
    if (upcomingBriefingsResult.error) {
      console.error('Error fetching upcoming briefings:', upcomingBriefingsResult.error)
      throw new Error('Failed to fetch upcoming briefings data')
    }
    if (actionItemsResult.error) {
      console.error('Error fetching action items:', actionItemsResult.error)
      throw new Error('Failed to fetch action items data')
    }
    if (socialPostsResult.error) {
      console.error('Error fetching social posts:', socialPostsResult.error)
      throw new Error('Failed to fetch social posts data')
    }

    // Process analyst status counts
    const analystStatusCounts = await Promise.all([
      supabase.from('analysts').select('*', { count: 'exact' }).eq('status', 'ACTIVE'),
      supabase.from('analysts').select('*', { count: 'exact' }).eq('status', 'INACTIVE'),
      supabase.from('analysts').select('*', { count: 'exact' }).eq('status', 'ARCHIVED')
    ])

    // Process briefing status counts
    const briefingStatusCounts = await Promise.all([
      supabase.from('briefings').select('*', { count: 'exact' }).eq('status', 'SCHEDULED'),
      supabase.from('briefings').select('*', { count: 'exact' }).eq('status', 'COMPLETED'),
      supabase.from('briefings').select('*', { count: 'exact' }).eq('status', 'CANCELLED')
    ])

    // Process action item status counts
    const actionItemStatusCounts = await Promise.all([
      supabase.from('action_items').select('*', { count: 'exact' }).eq('status', 'PENDING'),
      supabase.from('action_items').select('*', { count: 'exact' }).eq('status', 'IN_PROGRESS'),
      supabase.from('action_items').select('*', { count: 'exact' }).eq('status', 'COMPLETED')
    ])

    // Build metrics object
    const metrics = {
      analysts: {
        total: analystsResult.count || 0,
        active: analystStatusCounts[0].count || 0,
        inactive: analystStatusCounts[1].count || 0,
        archived: analystStatusCounts[2].count || 0
      },
      briefings: {
        total: briefingsResult.count || 0,
        scheduled: briefingStatusCounts[0].count || 0,
        completed: briefingStatusCounts[1].count || 0,
        cancelled: briefingStatusCounts[2].count || 0,
        upcoming: upcomingBriefingsResult.count || 0
      },
      actionItems: {
        total: actionItemsResult.count || 0,
        pending: actionItemStatusCounts[0].count || 0,
        inProgress: actionItemStatusCounts[1].count || 0,
        completed: actionItemStatusCounts[2].count || 0
      },
      socialActivity: {
        recentPosts: socialPostsResult.count || 0,
        thisWeek: socialPostsResult.count || 0 // Same as recent for 7-day period
      },
      lastUpdated: new Date().toISOString()
    }

    // Update cache
    cache.data = metrics
    cache.timestamp = now

    console.log('✅ Dashboard metrics calculated and cached')
    console.log(`📊 Metrics: ${metrics.analysts.total} analysts, ${metrics.briefings.total} briefings, ${metrics.actionItems.total} action items`)

    return NextResponse.json({
      ...metrics,
      cached: false,
      cacheAge: 0
    })

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard metrics',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
