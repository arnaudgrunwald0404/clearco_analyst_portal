import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Debug endpoint to check if required tables exist
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if social_posts table exists
    const { data: socialPostsData, error: socialPostsError, count: socialPostsCount } = await supabase
      .from('social_posts')
      .select('*', { count: 'exact', head: true })

    // Check if twitter_api_usage table exists  
    const { data: twitterUsageData, error: twitterUsageError, count: twitterUsageCount } = await supabase
      .from('twitter_api_usage')
      .select('*', { count: 'exact', head: true })

    // Check if analysts table exists
    const { data: analystsData, error: analystsError, count: analystsCount } = await supabase
      .from('analysts')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      tables: {
        social_posts: {
          exists: !socialPostsError,
          error: socialPostsError?.message,
          count: socialPostsCount || 0
        },
        twitter_api_usage: {
          exists: !twitterUsageError,
          error: twitterUsageError?.message,
          count: twitterUsageCount || 0
        },
        analysts: {
          exists: !analystsError,
          error: analystsError?.message,
          count: analystsCount || 0
        }
      }
    })

  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
