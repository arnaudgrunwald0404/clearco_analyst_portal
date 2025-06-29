import { BasePlatformCrawler } from './base'
import { RawSocialPost, AnalystSocialHandle, SocialPlatformConfig } from '../types'
import { LOOKBACK_DAYS, MAX_POSTS_PER_ANALYST_PER_DAY } from '../config'

interface TwitterAPIResponse {
  data?: TwitterPost[]
  includes?: {
    users?: TwitterUser[]
  }
  meta?: {
    result_count: number
    next_token?: string
  }
}

interface TwitterPost {
  id: string
  text: string
  created_at: string
  author_id: string
  public_metrics: {
    retweet_count: number
    like_count: number
    reply_count: number
    quote_count: number
  }
  entities?: {
    hashtags?: { tag: string }[]
    mentions?: { username: string }[]
    urls?: { expanded_url: string }[]
  }
}

interface TwitterUser {
  id: string
  username: string
  name: string
  public_metrics?: {
    followers_count: number
    following_count: number
  }
  verified?: boolean
}

export class TwitterCrawler extends BasePlatformCrawler {
  private bearerToken: string

  constructor(config: SocialPlatformConfig) {
    super(config)
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN || ''
    
    if (!this.bearerToken) {
      console.warn('Twitter Bearer Token not found. Twitter crawling will be disabled.')
    }
  }

  async crawlAnalystPosts(
    handle: AnalystSocialHandle,
    sinceDate?: Date
  ): Promise<RawSocialPost[]> {
    if (!this.bearerToken) {
      throw new Error('Twitter Bearer Token not configured')
    }

    await this.enforceRateLimit()

    try {
      const username = this.extractUsername(handle.handle)
      const user = await this.getProfile(username)
      
      if (!user) {
        throw new Error(`User ${username} not found`)
      }

      const since = sinceDate || new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
      const posts = await this.fetchUserTweets(user.id, since)
      
      return posts.slice(0, MAX_POSTS_PER_ANALYST_PER_DAY)
    } catch (error) {
      console.error(`Error crawling Twitter posts for ${handle.handle}:`, error)
      return []
    }
  }

  async searchPosts(
    keywords: string[],
    sinceDate?: Date,
    maxResults: number = 100
  ): Promise<RawSocialPost[]> {
    if (!this.bearerToken) {
      throw new Error('Twitter Bearer Token not configured')
    }

    await this.enforceRateLimit()

    try {
      const query = keywords.map(k => `"${k}"`).join(' OR ')
      const since = sinceDate || new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
      
      return await this.searchTweets(query, since, maxResults)
    } catch (error) {
      console.error('Error searching Twitter posts:', error)
      return []
    }
  }

  async validateHandle(handle: string): Promise<boolean> {
    try {
      const username = this.extractUsername(handle)
      const profile = await this.getProfile(username)
      return profile !== null
    } catch {
      return false
    }
  }

  async getProfile(handle: string): Promise<{
    id: string
    username: string
    displayName: string
    followerCount?: number
    verified?: boolean
  } | null> {
    if (!this.bearerToken) return null

    await this.enforceRateLimit()

    try {
      const username = this.extractUsername(handle)
      const response = await fetch(
        `https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics,verified`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'User-Agent': 'AnalystPortalCrawler/1.0'
          }
        }
      )

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`Twitter API error: ${response.status}`)
      }

      const data = await response.json()
      const user = data.data as TwitterUser

      return {
        id: user.id,
        username: user.username,
        displayName: user.name,
        followerCount: user.public_metrics?.followers_count,
        verified: user.verified
      }
    } catch (error) {
      console.error(`Error fetching Twitter profile for ${handle}:`, error)
      return null
    }
  }

  private async fetchUserTweets(userId: string, since: Date): Promise<RawSocialPost[]> {
    const sinceString = since.toISOString().split('T')[0] // YYYY-MM-DD format
    
    const response = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?` +
      `max_results=100&` +
      `start_time=${since.toISOString()}&` +
      `tweet.fields=created_at,public_metrics,entities&` +
      `expansions=author_id&` +
      `user.fields=username,name,verified`,
      {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'User-Agent': 'AnalystPortalCrawler/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`)
    }

    const data: TwitterAPIResponse = await response.json()
    return this.transformTwitterPosts(data)
  }

  private async searchTweets(
    query: string,
    since: Date,
    maxResults: number
  ): Promise<RawSocialPost[]> {
    const response = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?` +
      `query=${encodeURIComponent(query)}&` +
      `max_results=${Math.min(maxResults, 100)}&` +
      `start_time=${since.toISOString()}&` +
      `tweet.fields=created_at,public_metrics,entities&` +
      `expansions=author_id&` +
      `user.fields=username,name,verified`,
      {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'User-Agent': 'AnalystPortalCrawler/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`)
    }

    const data: TwitterAPIResponse = await response.json()
    return this.transformTwitterPosts(data)
  }

  private transformTwitterPosts(data: TwitterAPIResponse): RawSocialPost[] {
    if (!data.data || data.data.length === 0) return []

    const users = data.includes?.users || []
    const userMap = new Map(users.map(user => [user.id, user]))

    return data.data.map(tweet => {
      const author = userMap.get(tweet.author_id)
      const hashtags = tweet.entities?.hashtags?.map(h => h.tag) || []
      const mentions = tweet.entities?.mentions?.map(m => m.username) || []

      return {
        id: tweet.id,
        content: this.cleanContent(tweet.text),
        url: `https://twitter.com/${author?.username || 'unknown'}/status/${tweet.id}`,
        publishedAt: new Date(tweet.created_at),
        engagements: this.calculateEngagement(
          tweet.public_metrics.like_count,
          tweet.public_metrics.retweet_count,
          tweet.public_metrics.reply_count
        ),
        author: {
          id: tweet.author_id,
          username: author?.username || 'unknown',
          displayName: author?.name || 'Unknown'
        },
        platform: 'twitter' as const,
        hashtags,
        mentions
      }
    })
  }

  private extractUsername(handle: string): string {
    // Remove @ symbol and twitter.com URL parts if present
    return handle
      .replace(/^@/, '')
      .replace(/^https?:\/\/(www\.)?twitter\.com\//, '')
      .replace(/^https?:\/\/(www\.)?x\.com\//, '')
      .split('/')[0]
      .split('?')[0]
  }
}
