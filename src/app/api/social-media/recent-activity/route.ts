import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()

    // Get recent posts with analysis
    const { data: recentPosts, error: postsError } = await supabase
      .from('SocialPost')
      .select(`
        *,
        analyst:Analyst (
          id,
          firstName,
          lastName,
          company,
          title
        )
      `)
      .eq('isRelevant', true)
      .gte('createdAt', sevenDaysAgo)
      .order('postedAt', { ascending: false })
      .limit(limit)

    if (postsError) throw postsError

    // Calculate stats
    const [
      { count: postsToday },
      { count: totalPostsThisWeek },
      { data: engagementStats },
      { data: themePosts }
    ] = await Promise.all([
      // Posts today
      supabase
        .from('SocialPost')
        .select('*', { count: 'exact', head: true })
        .eq('isRelevant', true)
        .gte('postedAt', todayStr),

      // Posts this week
      supabase
        .from('SocialPost')
        .select('*', { count: 'exact', head: true })
        .eq('isRelevant', true)
        .gte('postedAt', sevenDaysAgo),

      // Average engagements
      supabase
        .from('SocialPost')
        .select('engagements')
        .eq('isRelevant', true)
        .gte('postedAt', sevenDaysAgo),

      // Top themes
      supabase
        .from('SocialPost')
        .select('themes')
        .eq('isRelevant', true)
        .gte('postedAt', sevenDaysAgo)
        .not('themes', 'is', null)
    ])

    // Calculate average engagements
    const avgEngagements = engagementStats
      ? engagementStats.reduce((sum, post) => sum + (post.engagements || 0), 0) / engagementStats.length
      : 0

    // Process themes
    const themeCount: Record<string, number> = {}
    if (themePosts) {
      themePosts.forEach(post => {
        try {
          let themes = post.themes
          if (typeof themes === 'string') {
            themes = JSON.parse(themes)
          }
          if (Array.isArray(themes)) {
            themes.forEach((theme: string) => {
              themeCount[theme] = (themeCount[theme] || 0) + 1
            })
          }
        } catch (error) {
          // Skip invalid JSON themes
          console.warn('Invalid themes JSON:', post.themes)
        }
      })
    }

    const topThemes = Object.entries(themeCount)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Format posts for response
    const formattedPosts = recentPosts ? recentPosts.map(post => {
      let themes = []
      try {
        if (typeof post.themes === 'string') {
          themes = JSON.parse(post.themes || '[]')
        } else if (Array.isArray(post.themes)) {
          themes = post.themes
        }
      } catch (error) {
        console.warn('Invalid themes JSON for post:', post.id)
        themes = []
      }

      return {
        id: post.id,
        analystId: post.analystId,
        platform: post.platform,
        content: post.content,
        url: post.url,
        postedAt: post.postedAt,
        engagements: post.engagements || 0,
        relevanceScore: 85, // Mock relevance score since it's not in the schema
        themes,
        sentiment: post.sentiment || 'NEUTRAL',
        mentionsCompany: post.content?.toLowerCase().includes('clearcompany') || post.content?.toLowerCase().includes('hr tech') || false,
        analyst: post.analyst
      }
    }) : []

    const stats = {
      totalPosts: totalPostsThisWeek || 0,
      postsToday: postsToday || 0,
      avgRelevanceScore: Math.round(avgEngagements), // Using avg engagements as proxy
      topThemes
    }

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      stats
    })

  } catch (error) {
    console.error('Error fetching recent social media activity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch social media activity' },
      { status: 500 }
    )
  }
}
