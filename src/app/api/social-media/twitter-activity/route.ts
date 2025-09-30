import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireVendorScope } from '@/lib/vendor-context'

// Types to improve type safety in this route
type AnalystSummary = {
  id: string
  firstName: string | null
  lastName: string | null
  company: string | null
  title: string | null
  influence: string | null
  profileImageUrl: string | null
  twitterHandle: string | null
}

type NormalizedPost = {
  id: string
  content: string | null
  url: string | null
  postedAt: string
  engagements?: number
  likes?: number
  shares?: number
  comments?: number
  sentiment?: any
  themes?: any[] | any
  isRelevant?: boolean
  analystId: string
  analysts: AnalystSummary
}

export async function GET(request: NextRequest) {
  try {
    const ctxOrResp = await requireVendorScope(request)
    if (ctxOrResp instanceof NextResponse) return ctxOrResp
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '3', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    
    const supabase = await createClient()
    
    // Calculate date threshold (last 3 days by default)
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)
    
    console.log(`🐦 [Twitter Activity API] Fetching posts from last ${days} days for VERY_HIGH influence analysts...`)
    
    // First, let's try to get recent posts from social_posts table
    let posts: NormalizedPost[] = []
    
    // Try the social_posts table first (newer schema)
    // Use separate queries to avoid relationship ambiguity
    try {
      // First, get HIGH and VERY_HIGH influence analysts
      const { data: highInfluenceAnalysts, error: analystsError } = await supabase
        .from('analysts')
        .select('id, firstName, lastName, company, title, influence, profileImageUrl, twitterHandle')
        .eq('vendor_domain_id', ctxOrResp.id)
        .in('influence', ['HIGH', 'VERY_HIGH'])
      
      if (analystsError) throw analystsError
      
      if (!highInfluenceAnalysts || highInfluenceAnalysts.length === 0) {
        console.log('📝 [Twitter Activity API] No HIGH or VERY_HIGH influence analysts found')
        posts = []
      } else {
        const analystIds = highInfluenceAnalysts.map(a => a.id)
        
        // Then get social posts from those analysts
        const { data: socialPosts, error: postsError } = await supabase
          .from('social_posts')
          .select(`
            id,
            content,
            url,
            postedAt,
            engagements,
            sentiment,
            themes,
            isRelevant,
            analystId
          `)
          .eq('platform', 'TWITTER')
          .eq('vendor_domain_id', ctxOrResp.id)
          .in('analystId', analystIds)
          .gte('postedAt', dateThreshold.toISOString())
          .order('postedAt', { ascending: false })
          .limit(limit)
        
        if (postsError) throw postsError
        
        // Combine posts with analyst data
        const analystMap = new Map(highInfluenceAnalysts.map(a => [a.id, a]))
        const tmpPosts = (socialPosts || []).map((post: any) => ({
          ...post,
          analysts: analystMap.get(post.analystId) as AnalystSummary | undefined
        })) as Array<Omit<NormalizedPost, 'analysts'> & { analysts?: AnalystSummary }>
        posts = tmpPosts.filter((p): p is NormalizedPost => Boolean(p.analysts)) // Only include posts with valid analyst data
      }
    } catch (socialPostsError) {
      console.log('📝 [Twitter Activity API] social_posts table not available, trying social_media_posts...')
      
      // Fallback to social_media_posts table (older schema with snake_case)
      try {
        // First, get HIGH and VERY_HIGH influence analysts
        const { data: highInfluenceAnalysts, error: analystsError } = await supabase
          .from('analysts')
          .select('id, firstName, lastName, company, title, influence, profileImageUrl, twitterHandle')
          .eq('vendor_domain_id', ctxOrResp.id)
          .in('influence', ['HIGH', 'VERY_HIGH'])
        
        if (analystsError) throw analystsError
        
        if (!highInfluenceAnalysts || highInfluenceAnalysts.length === 0) {
          console.log('📝 [Twitter Activity API] No HIGH or VERY_HIGH influence analysts found')
          posts = []
        } else {
          const analystIds = highInfluenceAnalysts.map(a => a.id)
          
          // Get social media posts from those analysts
          const { data: socialMediaPosts, error: postsError } = await supabase
            .from('social_media_posts')
            .select(`
              id,
              content,
              url,
              published_at,
              engagement_metrics,
              analyst_id
            `)
            .eq('platform', 'TWITTER')
            .eq('vendor_domain_id', ctxOrResp.id)
            .in('analyst_id', analystIds)
            .gte('published_at', dateThreshold.toISOString())
            .order('published_at', { ascending: false })
            .limit(limit)
          
          if (postsError) throw postsError
          
          // Combine posts with analyst data and transform to consistent format
          const analystMap = new Map(highInfluenceAnalysts.map(a => [a.id, a]))
          const tmpPosts = (socialMediaPosts || []).map((post: any) => ({
            id: post.id,
            content: post.content,
            url: post.url,
            postedAt: post.published_at,
            engagements: (post.engagement_metrics as any)?.total || 0,
            likes: (post.engagement_metrics as any)?.likes || 0,
            shares: (post.engagement_metrics as any)?.shares || 0,
            comments: (post.engagement_metrics as any)?.comments || 0,
            sentiment: null, // Not available in this schema
            themes: [], // Not available in this schema
            isRelevant: true, // Assume relevant
            analystId: post.analyst_id,
            analysts: analystMap.get(post.analyst_id) as AnalystSummary | undefined
          })) as Array<Omit<NormalizedPost, 'analysts'> & { analysts?: AnalystSummary }>
          posts = tmpPosts.filter((p): p is NormalizedPost => Boolean(p.analysts)) // Only include posts with valid analyst data
        }
      } catch (socialMediaPostsError) {
        console.error('❌ [Twitter Activity API] Neither social_posts nor social_media_posts table available:', socialMediaPostsError)
        // Return empty data instead of error for better UX
        posts = []
      }
    }


    // Transform data for frontend consumption
    const transformedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      url: post.url,
      postedAt: post.postedAt,
      engagements: post.engagements || 0,
      likes: post.likes || 0,
      shares: post.shares || 0,
      comments: post.comments || 0,
      sentiment: post.sentiment,
      themes: Array.isArray(post.themes as any[]) ? (post.themes as any[]) : (post.themes ? [post.themes] : []),
      isRelevant: post.isRelevant !== false, // Default to true if not specified
      analyst: {
        id: post.analysts.id,
        firstName: post.analysts.firstName,
        lastName: post.analysts.lastName,
        company: post.analysts.company,
        title: post.analysts.title,
        influence: post.analysts.influence,
        profileImageUrl: post.analysts.profileImageUrl,
        twitterHandle: post.analysts.twitterHandle
      }
    }))

    // Get summary statistics
    const totalPosts = transformedPosts.length
    const totalEngagements = transformedPosts.reduce((sum, post) => sum + post.engagements, 0)
    const uniqueAnalysts = new Set(transformedPosts.map(post => post.analyst.id)).size
    const avgEngagements = totalPosts > 0 ? Math.round(totalEngagements / totalPosts) : 0

    // Get total number of analysts with X handles using service client
    const serviceSupabase = createServiceClient()
    const { count: totalAnalystsWithHandles, error: handlesError } = await serviceSupabase
      .from('analysts')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_domain_id', ctxOrResp.id)
      .not('twitterHandle', 'is', null)
      .neq('twitterHandle', '')
      .like('twitterHandle', '@%')

    console.log(`📊 [Twitter Activity API] Found ${totalPosts} posts from ${uniqueAnalysts}/${totalAnalystsWithHandles} analysts with X handles`)

    return NextResponse.json({
      success: true,
      data: {
        posts: transformedPosts,
        summary: {
          totalPosts,
          totalEngagements,
          uniqueAnalysts,
          totalAnalystsWithHandles,
          avgEngagements,
          timeRange: {
            from: dateThreshold.toISOString(),
            to: new Date().toISOString(),
            days
          }
        }
      }
    })

  } catch (error) {
    console.error('❌ [Twitter Activity API] Unexpected error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
