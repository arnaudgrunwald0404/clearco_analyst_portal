import { NextRequest, NextResponse } from 'next/server'
import { rapidApiTwitterService } from '@/lib/social-crawler/rapidapi-twitter'
import { requireVendorScope } from '@/lib/vendor-context'

/**
 * API endpoint to look up Twitter user information by username
 * This is used to get the user ID from a username
 */
export async function GET(request: NextRequest) {
  try {
    const ctxOrResp = await requireVendorScope(request)
    if (ctxOrResp instanceof NextResponse) return ctxOrResp
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({
        success: false,
        error: 'Username parameter is required'
      }, { status: 400 })
    }

    console.log(`🔍 Looking up Twitter user: @${username}`)

    // Fetch user data from Twitter API
    const result = await rapidApiTwitterService.getUserByUsername(username)

    if (result.success && result.data) {
      // Extract user information from the complex nested response
      const raw: any = result.data as any
      const userData = raw.result?.data?.user?.result
      
      if (userData) {
        const userInfo = {
          id: userData.rest_id,
          username: userData.legacy?.screen_name || userData.core?.screen_name,
          display_name: userData.legacy?.name || userData.core?.name,
          description: userData.legacy?.description,
          followers_count: userData.legacy?.followers_count,
          following_count: userData.legacy?.friends_count,
          verified: userData.legacy?.verified || userData.verification?.verified,
          profile_image_url: userData.legacy?.profile_image_url_https || userData.avatar?.image_url,
          created_at: userData.legacy?.created_at || userData.core?.created_at,
          location: userData.legacy?.location || userData.location?.location,
          url: userData.legacy?.url
        }

        console.log(`✅ Found user @${username}: ID=${userInfo.id}`)

        return NextResponse.json({
          success: true,
          data: {
            user: userInfo,
            raw: result.data // Include raw data for debugging
          }
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'User not found or invalid response format',
          data: result.data
        }, { status: 404 })
      }
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to fetch user data',
        message: result.message
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Twitter user lookup API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
