import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const results: any = {
      social_posts: null,
      social_media_posts: null,
      analysts_with_very_high: null,
      error: null
    }
    
    // Test social_posts table
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select('id, platform, content, postedAt, analystId')
        .limit(1)
      results.social_posts = {
        exists: !error,
        error: error?.message,
        sampleCount: data?.length || 0,
        sample: data?.[0] || null
      }
    } catch (e) {
      results.social_posts = {
        exists: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }
    
    // Test social_media_posts table  
    try {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('id, platform, content, published_at, analyst_id')
        .limit(1)
      results.social_media_posts = {
        exists: !error,
        error: error?.message,
        sampleCount: data?.length || 0,
        sample: data?.[0] || null
      }
    } catch (e) {
      results.social_media_posts = {
        exists: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }
    
    // Test analysts with HIGH and VERY_HIGH influence
    try {
      const { data, error } = await supabase
        .from('analysts')
        .select('id, firstName, lastName, influence, twitterHandle')
        .in('influence', ['HIGH', 'VERY_HIGH'])
        .limit(10)
      results.analysts_with_high_influence = {
        exists: !error,
        error: error?.message,
        count: data?.length || 0,
        sample: data || [],
        breakdown: data ? {
          HIGH: data.filter(a => a.influence === 'HIGH').length,
          VERY_HIGH: data.filter(a => a.influence === 'VERY_HIGH').length
        } : {}
      }
    } catch (e) {
      results.analysts_with_high_influence = {
        exists: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }
    
    // Test the problematic join query to see the exact error
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          id,
          content,
          analystId,
          analysts!inner(id, firstName, lastName, influence)
        `)
        .eq('platform', 'TWITTER')
        .limit(1)
      results.join_test = {
        success: !error,
        error: error?.message,
        data: data?.[0] || null
      }
    } catch (e) {
      results.join_test = {
        success: false,
        error: e instanceof Error ? e.message : 'Join test failed'
      }
    }
    
    return NextResponse.json({
      success: true,
      debug: results
    })
    
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
