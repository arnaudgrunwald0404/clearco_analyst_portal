import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Debug endpoint to test inserting a social media post
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Create a test post for the social_posts table
    const testPost = {
      id: 'test-post-12345',
      content: 'This is a test tweet for debugging database insertion',
      platform: 'X',
      url: 'https://x.com/test/status/12345',
      postedAt: new Date().toISOString(),
      analystId: 'cladd367a2', // Use Josh Bersin's real ID
      engagements: 10,
      likes: 5,
      shares: 2,
      comments: 1
    }

    console.log('🧪 Attempting to insert test post:', JSON.stringify(testPost, null, 2))

    // Try to insert the test post
    const { data: insertedPost, error: insertError } = await supabase
      .from('social_posts')
      .insert([testPost])
      .select()

    if (insertError) {
      console.error('❌ Insert failed:', insertError)
      return NextResponse.json({
        success: false,
        error: insertError.message,
        code: insertError.code,
        hint: insertError.hint
      })
    } else {
      console.log('✅ Insert successful:', insertedPost)
      return NextResponse.json({
        success: true,
        message: 'Test post inserted successfully',
        data: insertedPost
      })
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
