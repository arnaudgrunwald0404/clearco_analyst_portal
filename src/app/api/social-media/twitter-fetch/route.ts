import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rapidApiTwitterService } from '@/lib/social-crawler/rapidapi-twitter'
import { requireVendorScope } from '@/lib/vendor-context'

// Internal type representing our normalized tweet structure
type TransformedTweet = {
  id: string
  content: string
  platform: string
  url: string
  published_at: string
  analyst_id?: string | null | undefined
  engagement_metrics: {
    likes: number
    retweets: number
    replies: number
    quotes: number
  }
  user_data?: any
}

/**
 * Extract tweets from complex Twitter API response structure
 */
function extractTweetsFromResponse(responseData: any): any[] {
  const tweets: any[] = []
  
  try {
    // The Twitter API response structure: responseData.result.timeline.instructions
    const timeline = responseData.result?.timeline?.instructions
    
    if (Array.isArray(timeline)) {
      for (const instruction of timeline) {
        if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
          for (const entry of instruction.entries) {
            // Handle different entry types
            if (entry.content?.entryType === 'TimelineTimelineItem' && 
                entry.content?.itemContent?.itemType === 'TimelineTweet') {
              
              const tweetResult = entry.content.itemContent.tweet_results?.result
              if (tweetResult?.legacy && tweetResult?.core?.user_results?.result?.legacy) {
                const legacy = tweetResult.legacy
                const user = tweetResult.core.user_results.result.legacy
                
                tweets.push({
                  id: legacy.id_str,
                  text: legacy.full_text,
                  created_at: legacy.created_at,
                  user: {
                    id: user.id_str,
                    screen_name: user.screen_name,
                    name: user.name,
                    followers_count: user.followers_count,
                    verified: user.verified,
                    profile_image_url: user.profile_image_url_https
                  },
                  retweet_count: legacy.retweet_count,
                  favorite_count: legacy.favorite_count,
                  reply_count: legacy.reply_count,
                  quote_count: legacy.quote_count,
                  is_retweet: !!legacy.retweeted_status_id_str
                })
              }
            }
            // Handle conversation entries (nested tweets)
            else if (entry.content?.entryType === 'TimelineTimelineModule' && 
                     entry.content?.items) {
              for (const item of entry.content.items) {
                if (item.item?.itemContent?.itemType === 'TimelineTweet') {
                  const tweetResult = item.item.itemContent.tweet_results?.result
                  if (tweetResult?.legacy && tweetResult?.core?.user_results?.result?.legacy) {
                    const legacy = tweetResult.legacy
                    const user = tweetResult.core.user_results.result.legacy
                    
                    tweets.push({
                      id: legacy.id_str,
                      text: legacy.full_text,
                      created_at: legacy.created_at,
                      user: {
                        id: user.id_str,
                        screen_name: user.screen_name,
                        name: user.name,
                        followers_count: user.followers_count,
                        verified: user.verified,
                        profile_image_url: user.profile_image_url_https
                      },
                      retweet_count: legacy.retweet_count,
                      favorite_count: legacy.favorite_count,
                      reply_count: legacy.reply_count,
                      quote_count: legacy.quote_count,
                      is_retweet: !!legacy.retweeted_status_id_str
                    })
                  }
                }
              }
            }
          }
        }
      }
    }
    
    console.log(`🔍 Extracted ${tweets.length} tweets from complex response`)
  } catch (error) {
    console.error('Error extracting tweets from response:', error)
  }
  
  return tweets
}

/**
 * API endpoint to fetch Twitter posts using RapidAPI
 * Supports fetching by user ID and optionally storing to database
 */

export async function GET(request: NextRequest) {
  try {
    const ctxOrResp = await requireVendorScope(request)
    if (ctxOrResp instanceof NextResponse) return ctxOrResp
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const count = parseInt(searchParams.get('count') || '20')
    const store = searchParams.get('store') === 'true'
    const analystId = searchParams.get('analystId')
    const analystIdParam: string | undefined = analystId ?? undefined

    // Validate required parameters
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: userId'
      }, { status: 400 })
    }

    // Check if service is configured
    if (!rapidApiTwitterService.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Twitter API service not properly configured',
        status: rapidApiTwitterService.getStatus()
      }, { status: 500 })
    }

    console.log(`🐦 Fetching ${count} tweets for user ID: ${userId}`)

    // Fetch tweets from RapidAPI
    const result = await rapidApiTwitterService.fetchUserTweets(userId, count)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: result.message
      }, { status: 400 })
    }

    const tweets = result.data || []
    console.log(`🐦 Successfully fetched ${tweets.length} tweets`)

    // Debug: Log what we received
    console.log('🔍 Raw tweets data type:', typeof tweets, 'Length:', Array.isArray(tweets) ? tweets.length : 'Not array')
    console.log('🔍 First few characters of tweets:', JSON.stringify(tweets).substring(0, 200))

    // Transform to internal format - handle the complex Twitter API response
    let transformedTweets: TransformedTweet[] = []
    if (tweets && typeof tweets === 'object') {
      // Handle different possible response structures
      if (Array.isArray(tweets)) {
        transformedTweets = rapidApiTwitterService.transformToInternalFormat(tweets, analystIdParam)
      } else if ((tweets as any).data && Array.isArray((tweets as any).data)) {
        transformedTweets = rapidApiTwitterService.transformToInternalFormat((tweets as any).data, analystIdParam)
      } else {
        // Try to extract tweets from the complex nested structure
        const extractedTweets = extractTweetsFromResponse(tweets as any)
        transformedTweets = rapidApiTwitterService.transformToInternalFormat(extractedTweets, analystIdParam)
      }
    }

    // Optionally store in database
    if (store && transformedTweets.length > 0) {
      try {
        // Use service role client to bypass RLS for social posts insertion
        const supabase = createServiceClient()
        
        // Prepare data for database insertion using the correct table structure
        const postsToInsert = transformedTweets.map(tweet => ({
          id: tweet.id, // Platform-specific ID
          content: tweet.content,
          platform: tweet.platform,
          url: tweet.url,
          postedAt: new Date(tweet.published_at).toISOString(),
          analystId: tweet.analyst_id,
          engagements: tweet.engagement_metrics.likes + tweet.engagement_metrics.retweets + tweet.engagement_metrics.replies + tweet.engagement_metrics.quotes,
          likes: tweet.engagement_metrics.likes,
          shares: tweet.engagement_metrics.retweets,
          comments: tweet.engagement_metrics.replies,
          vendor_domain_id: ctxOrResp.id
        }))

        // Insert posts (using upsert to handle duplicates)
        const { data: insertedPosts, error: insertError } = await supabase
          .from('social_posts')
          .upsert(postsToInsert, { 
            onConflict: 'id', // Use the primary key
            ignoreDuplicates: true 
          })
          .select()

        if (insertError) {
          console.error('Error storing posts to database:', insertError)
          console.error('Failed posts data sample:', JSON.stringify(postsToInsert[0], null, 2))
          // Continue with response even if storage fails
        } else {
          console.log(`📝 Successfully stored ${insertedPosts?.length || 0} posts to database`)
        }

        return NextResponse.json({
          success: true,
          data: {
            tweets: transformedTweets,
            stored: insertedPosts?.length || 0,
            total: transformedTweets.length
          },
          meta: {
            userId,
            count: transformedTweets.length,
            stored: !!insertedPosts?.length,
            analystId
          }
        })

      } catch (dbError) {
        console.error('Database error:', dbError)
        // Return tweets even if database storage fails
        return NextResponse.json({
          success: true,
          data: {
            tweets: transformedTweets,
            stored: 0,
            total: transformedTweets.length
          },
          meta: {
            userId,
            count: transformedTweets.length,
            stored: false,
            analystId,
            warning: 'Failed to store tweets in database'
          }
        })
      }
    }

    // Return tweets without storing
    return NextResponse.json({
      success: true,
      data: {
        tweets: transformedTweets,
        total: transformedTweets.length
      },
      meta: {
        userId,
        count: transformedTweets.length,
        stored: false,
        analystId
      }
    })

  } catch (error) {
    console.error('Twitter fetch API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

/**
 * POST endpoint for batch fetching tweets for multiple users
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userIds, count = 20, store = false, analystMapping = {} } = body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing or invalid userIds array'
      }, { status: 400 })
    }

    if (!rapidApiTwitterService.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Twitter API service not properly configured'
      }, { status: 500 })
    }

    console.log(`🐦 Batch fetching tweets for ${userIds.length} users`)

    const results = []
    const errors = []

    // Process each user ID
    for (const userId of userIds) {
      try {
        const result = await rapidApiTwitterService.fetchUserTweets(userId, count)
        
        if (result.success && result.data) {
          const analystId = analystMapping[userId]
          const transformedTweets = rapidApiTwitterService.transformToInternalFormat(result.data, analystId)
          
          results.push({
            userId,
            tweets: transformedTweets,
            count: transformedTweets.length,
            analystId
          })
        } else {
          errors.push({
            userId,
            error: result.error || 'Unknown error'
          })
        }
      } catch (error) {
        errors.push({
          userId,
          error: error instanceof Error ? error.message : 'Processing error'
        })
      }

      // Add delay between requests to respect rate limits
      if (userIds.indexOf(userId) < userIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Optionally store all tweets
    if (store && results.length > 0) {
      try {
        const supabase = await createClient()
        const allTweets = results.flatMap(result => 
          result.tweets.map(tweet => ({
            id: tweet.id,
            content: tweet.content,
            platform: tweet.platform,
            url: tweet.url,
            engagement_metrics: tweet.engagement_metrics,
            published_at: new Date(tweet.published_at).toISOString(),
            created_at: new Date().toISOString(),
            analyst_id: tweet.analyst_id,
            user_data: tweet.user_data
          }))
        )

        const { data: insertedPosts, error: insertError } = await supabase
          .from('social_media_posts')
          .upsert(allTweets, { 
            onConflict: 'id',
            ignoreDuplicates: true 
          })
          .select()

        if (!insertError) {
          console.log(`📝 Successfully stored ${insertedPosts?.length || 0} posts from batch operation`)
        }
      } catch (dbError) {
        console.error('Batch storage error:', dbError)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        errors,
        summary: {
          totalUsers: userIds.length,
          successfulUsers: results.length,
          failedUsers: errors.length,
          totalTweets: results.reduce((sum, result) => sum + result.count, 0)
        }
      }
    })

  } catch (error) {
    console.error('Twitter batch fetch API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
