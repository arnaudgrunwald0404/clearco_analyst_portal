import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireVendorScope } from '@/lib/vendor-context'

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
    const ctxOrResp = await requireVendorScope(request)
    if (ctxOrResp instanceof NextResponse) return ctxOrResp

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
    // Using the correct table name and column mappings
    console.log('🔍 Executing social posts query...')
    const { data: socialPosts, error: postsError } = await supabase
      .from('social_media_posts')
      .select(`
        id,
        content,
        platform,
        url,
        engagement_metrics,
        published_at,
        created_at,
        analyst_id
      `)
      .eq('vendor_domain_id', ctxOrResp.id)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (postsError) {
      console.error('❌ Error fetching social posts:', postsError)
      console.error('❌ Error details:', {
        message: postsError.message,
        details: postsError.details,
        hint: postsError.hint,
        code: postsError.code
      })
      
      // If the table doesn't exist yet, return empty data instead of error
      if (postsError.code === '42P01' || postsError.message?.includes('does not exist')) {
        console.log('📋 Social media posts table not found, returning empty data')
        return NextResponse.json({
          success: true,
          posts: [],
          summary: {
            todayPosts: 0,
            weekPosts: 0,
            totalRecentPosts: 0
          },
          cached: false,
          cacheAge: 0
        })
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch social posts', details: postsError.message },
        { status: 500 }
      )
    }

    console.log(`📋 Found ${socialPosts?.length || 0} recent social posts`)

    // Calculate summary statistics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Get posts from today (with error handling)
    let todayCount = 0
    try {
      const { count } = await supabase
        .from('social_media_posts')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_domain_id', ctxOrResp.id)
        .gte('published_at', today.toISOString())
      todayCount = count || 0
    } catch (error) {
      console.log('Could not fetch today count, using 0')
    }

    // Get posts from this week (with error handling)
    let weekCount = 0
    try {
      const { count } = await supabase
        .from('social_media_posts')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_domain_id', ctxOrResp.id)
        .gte('published_at', weekAgo.toISOString())
      weekCount = count || 0
    } catch (error) {
      console.log('Could not fetch week count, using 0')
    }

    const summary = {
      todayPosts: todayCount || 0,
      weekPosts: weekCount || 0,
      totalRecentPosts: socialPosts?.length || 0
    }

    // Transform the data to match frontend expectations
    const transformedPosts = (socialPosts || []).map(post => ({
      id: post.id,
      content: post.content,
      platform: post.platform,
      url: post.url,
      engagements: post.engagement_metrics || {},
      postedAt: post.published_at,
      createdAt: post.created_at,
      analystId: post.analyst_id,
      // Add fallback values for fields not in the current schema
      isRelevant: true, // All posts returned are relevant
      sentiment: 'neutral', // Default sentiment
      themes: [], // Default empty themes
      analysts: null // Will be populated later if needed
    }))

    const result = {
      posts: transformedPosts,
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
