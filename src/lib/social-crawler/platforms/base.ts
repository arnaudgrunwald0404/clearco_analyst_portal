import { RawSocialPost, AnalystSocialHandle, SocialPlatformConfig } from '../types'

export abstract class BasePlatformCrawler {
  protected config: SocialPlatformConfig
  protected lastRequestTime: number = 0

  constructor(config: SocialPlatformConfig) {
    this.config = config
  }

  /**
   * Crawls posts for a specific analyst handle
   */
  abstract crawlAnalystPosts(
    handle: AnalystSocialHandle, 
    sinceDate?: Date
  ): Promise<RawSocialPost[]>

  /**
   * Searches for posts by keyword (for discovery)
   */
  abstract searchPosts(
    keywords: string[], 
    sinceDate?: Date,
    maxResults?: number
  ): Promise<RawSocialPost[]>

  /**
   * Validates if a social handle exists and is accessible
   */
  abstract validateHandle(handle: string): Promise<boolean>

  /**
   * Gets user profile information
   */
  abstract getProfile(handle: string): Promise<{
    id: string
    username: string
    displayName: string
    followerCount?: number
    verified?: boolean
  } | null>

  /**
   * Enforces rate limiting between API calls
   */
  protected async enforceRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.config.searchDelay) {
      const waitTime = this.config.searchDelay - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastRequestTime = Date.now()
  }

  /**
   * Extracts hashtags from post content
   */
  protected extractHashtags(content: string): string[] {
    const hashtagRegex = /#\w+/g
    const matches = content.match(hashtagRegex)
    return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : []
  }

  /**
   * Extracts mentions from post content
   */
  protected extractMentions(content: string): string[] {
    const mentionRegex = /@\w+/g
    const matches = content.match(mentionRegex)
    return matches ? matches.map(mention => mention.substring(1).toLowerCase()) : []
  }

  /**
   * Normalizes URLs to ensure they're complete
   */
  protected normalizeUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return baseUrl + url
    return url
  }

  /**
   * Calculates engagement rate for a post
   */
  protected calculateEngagement(
    likes: number = 0,
    shares: number = 0,
    comments: number = 0,
    views: number = 0
  ): number {
    // Simple engagement calculation
    const totalEngagements = likes + shares + comments
    if (views > 0) {
      return Math.round((totalEngagements / views) * 100)
    }
    return totalEngagements
  }

  /**
   * Cleans and normalizes post content
   */
  protected cleanContent(content: string): string {
    return content
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  }
}
