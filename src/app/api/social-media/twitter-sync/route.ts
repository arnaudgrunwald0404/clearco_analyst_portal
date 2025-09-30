import { NextRequest, NextResponse } from 'next/server'
import { twitterIntegrationService } from '@/lib/social-crawler/twitter-integration'
import { requireVendorScope } from '@/lib/vendor-context'

/**
 * API endpoint to sync Twitter posts for all analysts
 * This endpoint fetches tweets for analysts and stores them in the database
 */

export async function POST(request: NextRequest) {
  try {
    const ctxOrResp = await requireVendorScope(request)
    if (ctxOrResp instanceof NextResponse) return ctxOrResp

    const body = await request.json()
    const { 
      maxAnalysts = 10, 
      tweetsPerAnalyst = 20,
      dryRun = false 
    } = body

    console.log(`🐦 Starting Twitter sync for up to ${maxAnalysts} analysts (${tweetsPerAnalyst} tweets each)`)
    
    if (dryRun) {
      console.log('🧪 Running in dry-run mode - no data will be stored')
    }

    const result = await twitterIntegrationService.fetchPostsForAllAnalysts(
      maxAnalysts,
      tweetsPerAnalyst,
      ctxOrResp.id
    )

    return NextResponse.json({
      success: true,
      data: result,
      message: `Processed ${result.summary.totalAnalysts} analysts, stored ${result.summary.totalTweets} tweets`
    })

  } catch (error) {
    console.error('Twitter sync error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

/**
 * GET endpoint to check sync status and get summary
 */
export async function GET(request: NextRequest) {
  try {
    const ctxOrResp = await requireVendorScope(request)
    if (ctxOrResp instanceof NextResponse) return ctxOrResp

    const { searchParams } = new URL(request.url)
    const analystId = searchParams.get('analystId')
    const days = parseInt(searchParams.get('days') || '30')

    if (analystId) {
      // Get summary for specific analyst
      const summary = await twitterIntegrationService.getAnalystTwitterSummary(analystId, days, ctxOrResp.id)
      
      return NextResponse.json({
        success: true,
        data: {
          analystId,
          days,
          summary
        }
      })
    }

    // Return general status
    return NextResponse.json({
      success: true,
      data: {
        message: 'Twitter sync service is available',
        endpoints: {
          'POST /api/social-media/twitter-sync': 'Sync tweets for all analysts',
          'GET /api/social-media/twitter-sync?analystId=ID': 'Get analyst Twitter summary',
          'GET /api/social-media/twitter-fetch?userId=ID': 'Fetch tweets for specific user ID'
        }
      }
    })

  } catch (error) {
    console.error('Twitter sync status error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
