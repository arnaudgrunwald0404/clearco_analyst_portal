import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// In-memory cache
let cache: {
  data: any | null
  timestamp: number
  duration: number
} = {
  data: null,
  timestamp: 0,
  duration: 5 * 60 * 1000 // 5 minutes
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Social media activity API called')

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Check cache first
    const now = Date.now()
    if (cache.data && (now - cache.timestamp) < cache.duration) {
      console.log('📋 Returning cached social activity data')
      return NextResponse.json({
        success: true,
        ...cache.data,
        cached: true,
        cacheAge: Math.floor((now - cache.timestamp) / 1000)
      })
    }

    const supabase = await createClient()

    console.log('📊 Querying social posts...')

    // Get recent social posts with analyst information
    // Using the specific foreign key relationship to avoid ambiguity
    const { data: socialPosts, error: postsError } = await supabase
      .from('social_posts')
      .select(`
        id,
        content,
        platform,
        url,
        engagements,
        postedAt,
        isRelevant,
        sentiment,
        themes,
        createdAt,
        analysts!fk_social_posts_analyst(
          id,
          firstName,
          lastName,
          email,
          company,
          profileImageUrl
        )
      `)
      .eq('isRelevant', true)
      .order('postedAt', { ascending: false })
      .limit(limit)

    if (postsError) {
      console.error('Error fetching social posts:', postsError)
      return NextResponse.json(
        { error: 'Failed to fetch social posts' },
        { status: 500 }
      )
    }

    console.log(`📋 Found ${socialPosts?.length || 0} recent social posts`)

    // Calculate summary statistics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Get posts from today
    const { count: todayCount } = await supabase
      .from('social_posts')
      .select('*', { count: 'exact', head: true })
      .eq('isRelevant', true)
      .gte('postedAt', today.toISOString())

    // Get posts from this week
    const { count: weekCount } = await supabase
      .from('social_posts')
      .select('*', { count: 'exact', head: true })
      .eq('isRelevant', true)
      .gte('postedAt', weekAgo.toISOString())

    const summary = {
      todayPosts: todayCount || 0,
      weekPosts: weekCount || 0,
      totalRecentPosts: socialPosts?.length || 0
    }

    const result = {
      posts: socialPosts || [],
      summary
    }

    // Cache the result
    cache.data = result
    cache.timestamp = now

    console.log(`📊 Social activity summary: ${summary.todayPosts} today, ${summary.weekPosts} this week`)

    return NextResponse.json({
      success: true,
      ...result,
      cached: false,
      cacheAge: 0
    })

  } catch (error) {
    console.error('Error in social media activity API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
