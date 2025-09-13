/**
 * Integration utilities for Twitter API with existing analyst data
 */

import { createClient } from '@/lib/supabase/server'
import { rapidApiTwitterService } from './rapidapi-twitter'

export interface AnalystTwitterData {
  id: string
  firstName: string
  lastName: string
  company: string
  twitterHandle?: string
  twitterUserId?: string
  profileImageUrl?: string
}

export interface TwitterFetchJob {
  analystId: string
  userId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  tweetsFound: number
  tweetsStored: number
  error?: string
  startedAt: Date
  completedAt?: Date
}

export class TwitterIntegrationService {
  /**
   * Fetch Twitter posts for all analysts with Twitter handles
   */
  async fetchPostsForAllAnalysts(
    maxAnalysts: number = 10,
    tweetsPerAnalyst: number = 20
  ): Promise<{
    success: boolean
    jobs: TwitterFetchJob[]
    summary: {
      totalAnalysts: number
      successful: number
      failed: number
      totalTweets: number
    }
  }> {
    const supabase = await createClient()
    
    // Get analysts with Twitter handles or user IDs
    const { data: analysts, error: analystsError } = await supabase
      .from('analysts')
      .select('id, firstName, lastName, company, twitterHandle, twitterUserId, profileImageUrl')
      .or('twitterHandle.neq.,twitterUserId.neq.')
      .limit(maxAnalysts)

    if (analystsError) {
      throw new Error(`Failed to fetch analysts: ${analystsError.message}`)
    }

    if (!analysts || analysts.length === 0) {
      return {
        success: true,
        jobs: [],
        summary: { totalAnalysts: 0, successful: 0, failed: 0, totalTweets: 0 }
      }
    }

    const jobs: TwitterFetchJob[] = []
    let totalTweets = 0

    for (const analyst of analysts) {
      const job: TwitterFetchJob = {
        analystId: analyst.id,
        userId: analyst.twitterUserId || this.extractUserIdFromHandle(analyst.twitterHandle),
        status: 'pending',
        tweetsFound: 0,
        tweetsStored: 0,
        startedAt: new Date()
      }

      if (!job.userId) {
        job.status = 'failed'
        job.error = 'No valid Twitter User ID found'
        job.completedAt = new Date()
        jobs.push(job)
        continue
      }

      try {
        job.status = 'running'
        
        const result = await rapidApiTwitterService.fetchUserTweets(job.userId, tweetsPerAnalyst)
        
        if (result.success && result.data) {
          const transformedTweets = rapidApiTwitterService.transformToInternalFormat(
            result.data, 
            analyst.id
          )
          
          job.tweetsFound = transformedTweets.length

          // Store tweets in database
          if (transformedTweets.length > 0) {
            const postsToInsert = transformedTweets.map(tweet => ({
              id: tweet.id,
              content: tweet.content,
              platform: tweet.platform,
              url: tweet.url,
              engagement_metrics: tweet.engagement_metrics,
              published_at: new Date(tweet.published_at).toISOString(),
              created_at: new Date().toISOString(),
              analyst_id: analyst.id,
              user_data: tweet.user_data
            }))

            const { data: insertedPosts, error: insertError } = await supabase
              .from('social_media_posts')
              .upsert(postsToInsert, { 
                onConflict: 'id',
                ignoreDuplicates: true 
              })
              .select()

            if (insertError) {
              job.status = 'failed'
              job.error = `Database error: ${insertError.message}`
            } else {
              job.status = 'completed'
              job.tweetsStored = insertedPosts?.length || 0
              totalTweets += job.tweetsStored
            }
          } else {
            job.status = 'completed'
            job.tweetsStored = 0
          }
        } else {
          job.status = 'failed'
          job.error = result.error || 'Failed to fetch tweets'
        }
      } catch (error) {
        job.status = 'failed'
        job.error = error instanceof Error ? error.message : 'Unknown error'
      } finally {
        job.completedAt = new Date()
        jobs.push(job)
      }

      // Add delay between requests to respect rate limits
      if (analysts.indexOf(analyst) < analysts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
    }

    const successful = jobs.filter(job => job.status === 'completed').length
    const failed = jobs.filter(job => job.status === 'failed').length

    return {
      success: true,
      jobs,
      summary: {
        totalAnalysts: analysts.length,
        successful,
        failed,
        totalTweets
      }
    }
  }

  /**
   * Update analyst Twitter user ID from handle
   */
  async updateAnalystTwitterUserId(analystId: string, twitterUserId: string): Promise<boolean> {
    try {
      const supabase = await createClient()
      
      const { error } = await supabase
        .from('analysts')
        .update({ twitterUserId })
        .eq('id', analystId)

      return !error
    } catch {
      return false
    }
  }

  /**
   * Get Twitter engagement summary for an analyst
   */
  async getAnalystTwitterSummary(analystId: string, days: number = 30): Promise<{
    totalPosts: number
    totalEngagements: number
    averageEngagements: number
    topPost?: {
      content: string
      engagements: number
      url: string
    }
  }> {
    const supabase = await createClient()
    
    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data: posts, error } = await supabase
      .from('social_media_posts')
      .select('content, engagement_metrics, url')
      .eq('analyst_id', analystId)
      .eq('platform', 'TWITTER')
      .gte('published_at', since.toISOString())
      .order('published_at', { ascending: false })

    if (error || !posts) {
      return {
        totalPosts: 0,
        totalEngagements: 0,
        averageEngagements: 0
      }
    }

    const totalPosts = posts.length
    const totalEngagements = posts.reduce((sum, post) => {
      const metrics = post.engagement_metrics as any
      return sum + (metrics?.likes || 0) + (metrics?.retweets || 0) + (metrics?.replies || 0)
    }, 0)

    const averageEngagements = totalPosts > 0 ? Math.round(totalEngagements / totalPosts) : 0

    // Find top post by engagement
    const topPost = posts.reduce((top, post) => {
      const metrics = post.engagement_metrics as any
      const engagements = (metrics?.likes || 0) + (metrics?.retweets || 0) + (metrics?.replies || 0)
      
      if (!top || engagements > top.engagements) {
        return {
          content: post.content,
          engagements,
          url: post.url
        }
      }
      return top
    }, null as any)

    return {
      totalPosts,
      totalEngagements,
      averageEngagements,
      topPost
    }
  }

  /**
   * Extract numeric user ID from Twitter handle/URL
   * Note: This is a placeholder - in reality, you'd need to use Twitter's user lookup API
   */
  private extractUserIdFromHandle(handle?: string): string | null {
    if (!handle) return null
    
    // If it's already a numeric ID, return it
    if (/^\d+$/.test(handle)) {
      return handle
    }
    
    // For actual implementation, you'd need to:
    // 1. Use Twitter's user lookup API to convert username to user ID
    // 2. Store the mapping in your database
    // 3. Return the stored user ID
    
    return null
  }
}

// Export singleton instance
export const twitterIntegrationService = new TwitterIntegrationService()
