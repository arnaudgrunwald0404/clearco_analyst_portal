/**
 * Twitter API integration using RapidAPI's Twitter241 service
 * This service fetches Twitter posts for specific users
 * 
 * IMPORTANT: Limited to 500 requests/month - use sparingly!
 */

import { twitterUsageTracker } from './twitter-usage-tracker'

export interface TwitterPost {
  id: string
  text: string
  created_at: string
  user: {
    id: string
    screen_name: string
    name: string
    followers_count: number
    verified: boolean
    profile_image_url: string
  }
  retweet_count: number
  favorite_count: number
  reply_count?: number
  quote_count?: number
  entities?: {
    hashtags?: Array<{ text: string }>
    user_mentions?: Array<{ screen_name: string; name: string }>
    urls?: Array<{ expanded_url: string; display_url: string }>
  }
  is_retweet?: boolean
  retweeted_status?: any
}

export interface TwitterAPIResponse {
  success: boolean
  // Note: RapidAPI endpoints often return nested structures, not a flat array.
  // Callers must normalize/transform as needed.
  data?: any
  error?: string
  message?: string
}

export class RapidAPITwitterService {
  private apiKey: string
  private baseUrl: string = 'https://twitter241.p.rapidapi.com'
  private lastRequestTime: number = 0
  private minRequestInterval: number = 1000 // 1 second between requests to avoid rate limits

  constructor() {
    // Use the API key from environment variables or fallback to the provided key
    this.apiKey = process.env.RAPIDAPI_TWITTER_KEY || '3f2e665f7amshf6272adc6282602p136bb9jsn731ef45f1658'
  }

  /**
   * Enforce rate limiting between requests
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastRequestTime = Date.now()
  }

  /**
   * Get Twitter user information by username (to get user ID)
   * @param username - Twitter username (with or without @)
   * @param bypassUsageCheck - Skip usage check (for testing only)
   */
  async getUserByUsername(username: string, bypassUsageCheck: boolean = false): Promise<TwitterAPIResponse> {
    if (!bypassUsageCheck) {
      const usageCheck = await twitterUsageTracker.canMakeRequest(1)
      if (!usageCheck.allowed) {
        return {
          success: false,
          error: `API usage limit reached: ${usageCheck.reason}`,
          message: `Monthly usage: ${usageCheck.usage.totalRequests}/500. ${usageCheck.usage.warning || ''}`
        }
      }
    }

    await this.enforceRateLimit()

    try {
      const cleanUsername = username.replace('@', '') // Remove @ if present
      const url = `${this.baseUrl}/user?username=${encodeURIComponent(cleanUsername)}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': this.apiKey,
          'x-rapidapi-host': 'twitter241.p.rapidapi.com',
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })

      const responseData = await response.json()

      if (response.ok) {
        if (!bypassUsageCheck) {
          twitterUsageTracker.recordUsage('user-lookup', 1, cleanUsername).catch(console.error)
        }
        
        console.log(`🔍 User lookup for @${cleanUsername}:`, JSON.stringify(responseData, null, 2).substring(0, 300) + '...')
        
        return {
          success: true,
          data: responseData
        }
      } else {
        return {
          success: false,
          error: `API returned status ${response.status}`,
          message: responseData?.message || 'Unknown error'
        }
      }
    } catch (error) {
      console.error('Error fetching user by username:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Fetch tweets for a specific user
   * @param userId - Twitter user ID (numeric)
   * @param count - Number of tweets to fetch (max 100)
   * @param bypassUsageCheck - Skip usage check (for testing only)
   */
  async fetchUserTweets(userId: string, count: number = 20, bypassUsageCheck: boolean = false): Promise<TwitterAPIResponse> {
    // Check if we can make this request within our monthly limit
    if (!bypassUsageCheck) {
      const usageCheck = await twitterUsageTracker.canMakeRequest(1)
      if (!usageCheck.allowed) {
        return {
          success: false,
          error: `API usage limit reached: ${usageCheck.reason}`,
          message: `Monthly usage: ${usageCheck.usage.totalRequests}/500. ${usageCheck.usage.warning || ''}`
        }
      }
    }

    await this.enforceRateLimit()

    try {
      const url = `${this.baseUrl}/user-tweets?user=${encodeURIComponent(userId)}&count=${Math.min(count, 100)}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': this.apiKey,
          'x-rapidapi-host': 'twitter241.p.rapidapi.com',
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })

      const responseData = await response.json()

      if (response.ok) {
        // Record successful API usage
        if (!bypassUsageCheck) {
          twitterUsageTracker.recordUsage('user-tweets', 1, userId).catch(console.error)
        }
        
        // Debug: Log the raw response structure
        console.log('🔍 Raw Twitter API response:', JSON.stringify(responseData, null, 2).substring(0, 500) + '...')
        
        return {
          success: true,
          data: responseData
        }
      } else {
        return {
          success: false,
          error: `API returned status ${response.status}`,
          message: responseData?.message || 'Unknown error'
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          return {
            success: false,
            error: 'Request timeout',
            message: 'The API request took too long to complete'
          }
        }
        return {
          success: false,
          error: error.message,
          message: 'Network or parsing error occurred'
        }
      }
      return {
        success: false,
        error: 'Unknown error occurred',
        message: 'An unexpected error happened during the request'
      }
    }
  }

  /**
   * Fetch tweets for a user by username (converts to user ID first)
   * @param username - Twitter username (without @)
   * @param count - Number of tweets to fetch
   */
  async fetchUserTweetsByUsername(username: string, count: number = 20): Promise<TwitterAPIResponse> {
    try {
      // Clean username
      const cleanUsername = username.replace(/^@/, '').trim()
      
      // For this API, we need the user ID. This is a simplified approach.
      // In a real implementation, you might want to add a username-to-ID conversion endpoint
      console.log(`Fetching tweets for username: ${cleanUsername}`)
      
      // Since the API expects user ID, we'll return an error for now
      // You might want to implement a user lookup function
      return {
        success: false,
        error: 'Username lookup not implemented. Please use user ID instead.',
        message: 'This API requires numeric user IDs. Consider implementing user lookup functionality.'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Transform Twitter API response to match our internal format
   */
  transformToInternalFormat(tweets: TwitterPost[], analystId?: string): Array<{
    id: string
    content: string
    url: string
    platform: 'X'
    published_at: string
    engagement_metrics: {
      likes: number
      retweets: number
      replies: number
      quotes: number
    }
    analyst_id?: string
    user_data: {
      username: string
      display_name: string
      followers_count: number
      verified: boolean
      profile_image_url: string
    }
  }> {
    // Handle case where tweets might not be an array or might be undefined
    if (!tweets || !Array.isArray(tweets)) {
      console.warn('Invalid tweets data received:', tweets)
      return []
    }

    return tweets
      .filter(tweet => tweet && !tweet.is_retweet) // Filter out retweets and null/undefined tweets
      .map(tweet => ({
        id: tweet.id,
        content: tweet.text || '',
        url: `https://x.com/${tweet.user?.screen_name || 'unknown'}/status/${tweet.id}`,
        platform: 'X' as const,
        published_at: tweet.created_at,
        engagement_metrics: {
          likes: tweet.favorite_count || 0,
          retweets: tweet.retweet_count || 0,
          replies: tweet.reply_count || 0,
          quotes: tweet.quote_count || 0
        },
        analyst_id: analystId,
        user_data: {
          username: tweet.user?.screen_name || 'unknown',
          display_name: tweet.user?.name || 'Unknown User',
          followers_count: tweet.user?.followers_count || 0,
          verified: tweet.user?.verified || false,
          profile_image_url: tweet.user?.profile_image_url || ''
        }
      }))
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 10
  }

  /**
   * Get service status and configuration info
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'Not set',
      baseUrl: this.baseUrl,
      rateLimit: {
        minInterval: this.minRequestInterval,
        lastRequest: this.lastRequestTime
      }
    }
  }
}

// Export a singleton instance
export const rapidApiTwitterService = new RapidAPITwitterService()
