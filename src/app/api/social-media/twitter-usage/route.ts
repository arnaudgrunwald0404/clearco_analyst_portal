import { NextResponse } from 'next/server'
import { twitterUsageTracker } from '@/lib/social-crawler/twitter-usage-tracker'

/**
 * API endpoint to get Twitter API usage statistics
 * Returns monthly and weekly usage data for the dashboard
 */

export async function GET() {
  try {
    console.log('📊 Fetching Twitter API usage statistics...')

    // Get monthly and weekly usage data
    const [monthlyUsage, weeklyUsage] = await Promise.all([
      twitterUsageTracker.getMonthlyUsage(),
      twitterUsageTracker.getWeeklyUsage()
    ])

    return NextResponse.json({
      success: true,
      data: {
        monthly: monthlyUsage,
        weekly: weeklyUsage,
        limits: {
          monthlyLimit: 500,
          dailySafeLimit: 16,
          weeklyBudget: 115
        },
        recommendations: [
          'Run weekly sync on Sundays to refresh analyst Twitter data',
          'Limit manual testing to 2-3 requests per day maximum',
          'Process 8-10 analysts per week (10 tweets each = ~10 requests)',
          'Monitor usage daily to avoid exceeding monthly limit',
          'Use dry-run mode for testing whenever possible'
        ]
      },
      meta: {
        fetchedAt: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    })

  } catch (error) {
    console.error('Twitter usage API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

/**
 * POST endpoint to reset usage (for testing or new month)
 * Requires confirmation parameter
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, confirmation } = body

    if (action === 'reset') {
      if (confirmation !== 'RESET_TWITTER_USAGE') {
        return NextResponse.json({
          success: false,
          error: 'Invalid confirmation. Use "RESET_TWITTER_USAGE" to confirm.'
        }, { status: 400 })
      }

      const resetSuccess = await twitterUsageTracker.resetUsage(confirmation)
      
      if (resetSuccess) {
        console.log('🔄 Twitter API usage has been reset')
        return NextResponse.json({
          success: true,
          message: 'Twitter API usage has been reset',
          data: {
            resetAt: new Date().toISOString()
          }
        })
      } else {
        throw new Error('Failed to reset usage data')
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Supported actions: reset'
    }, { status: 400 })

  } catch (error) {
    console.error('Twitter usage reset error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
