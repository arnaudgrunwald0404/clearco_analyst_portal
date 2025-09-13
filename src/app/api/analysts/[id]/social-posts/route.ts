import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()

    // Fetch latest 5 social media posts from LinkedIn and X
    const { data: socialPosts, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('analystId', id)
      .in('platform', ['LINKEDIN', 'X'])
      .order('postedAt', { ascending: false })
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
