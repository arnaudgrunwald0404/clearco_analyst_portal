import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Fetch latest 5 social media posts from LinkedIn and Twitter
    const { data: socialPosts, error } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('analyst_id', id)
      .in('platform', ['LINKEDIN', 'TWITTER'])
      .order('published_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching social posts:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch social posts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: socialPosts || []
    })

  } catch (error) {
    console.error('Error fetching social posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch social posts' },
      { status: 500 }
    )
  }
}
