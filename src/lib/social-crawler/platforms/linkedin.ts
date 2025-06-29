import { BasePlatformCrawler } from './base'
import { RawSocialPost, AnalystSocialHandle, SocialPlatformConfig } from '../types'
import { LOOKBACK_DAYS, MAX_POSTS_PER_ANALYST_PER_DAY } from '../config'

interface LinkedInAPIResponse {
  elements: LinkedInPost[]
  paging?: {
    start: number
    count: number
    total: number
  }
}

interface LinkedInPost {
  id: string
  created: {
    time: number
  }
  author: string
  specificContent: {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary?: {
        text: string
      }
      shareMediaCategory: string
    }
  }
  ugcPostUrn?: string
  socialDetail?: {
    totalSocialActivityCounts: {
      numLikes: number
      numComments: number
      numShares: number
    }
  }
}

interface LinkedInProfile {
  id: string
  firstName: {
    localized: Record<string, string>
  }
  lastName: {
    localized: Record<string, string>
  }
  profilePicture?: {
    'displayImage~': {
      elements: Array<{
        identifiers: Array<{
          identifier: string
        }>
      }>
    }
  }
  vanityName?: string
}

export class LinkedInCrawler extends BasePlatformCrawler {
  private accessToken: string

  constructor(config: SocialPlatformConfig) {
    super(config)
    this.accessToken = process.env.LINKEDIN_ACCESS_TOKEN || ''
    
    if (!this.accessToken) {
      console.warn('LinkedIn Access Token not found. LinkedIn crawling will be disabled.')
    }
  }

  async crawlAnalystPosts(
    handle: AnalystSocialHandle,
    sinceDate?: Date
  ): Promise<RawSocialPost[]> {
    if (!this.accessToken) {
      throw new Error('LinkedIn Access Token not configured')
    }

    await this.enforceRateLimit()

    try {
      // LinkedIn requires person URN, which we need to get from profile
      const personUrn = await this.getPersonUrn(handle.handle)
      
      if (!personUrn) {
        throw new Error(`Person URN not found for ${handle.handle}`)
      }

      const since = sinceDate || new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
      const posts = await this.fetchPersonPosts(personUrn, since)
      
      return posts.slice(0, MAX_POSTS_PER_ANALYST_PER_DAY)
    } catch (error) {
      console.error(`Error crawling LinkedIn posts for ${handle.handle}:`, error)
      return []
    }
  }

  async searchPosts(
    keywords: string[],
    sinceDate?: Date,
    maxResults: number = 100
  ): Promise<RawSocialPost[]> {
    // LinkedIn's API doesn't provide public search for posts
    // This would require LinkedIn's Marketing API or Partner access
    console.warn('LinkedIn post search is not available with basic API access')
    return []
  }

  async validateHandle(handle: string): Promise<boolean> {
    try {
      const personUrn = await this.getPersonUrn(handle)
      return personUrn !== null
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
    if (!this.accessToken) return null

    await this.enforceRateLimit()

    try {
      const vanityName = this.extractVanityName(handle)
      
      // Get person by vanity name
      const response = await fetch(
        `https://api.linkedin.com/v2/people/(vanityName:${vanityName})?projection=(id,firstName,lastName,vanityName,profilePicture(displayImage~:playableStreams))`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'User-Agent': 'AnalystPortalCrawler/1.0'
          }
        }
      )

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`LinkedIn API error: ${response.status}`)
      }

      const profile: LinkedInProfile = await response.json()
      
      // Get the first available localized name
      const firstNameLocalized = Object.values(profile.firstName.localized)[0] || ''
      const lastNameLocalized = Object.values(profile.lastName.localized)[0] || ''

      return {
        id: profile.id,
        username: profile.vanityName || vanityName,
        displayName: `${firstNameLocalized} ${lastNameLocalized}`.trim(),
        followerCount: undefined, // Not available in basic API
        verified: undefined // LinkedIn doesn't have public verification status
      }
    } catch (error) {
      console.error(`Error fetching LinkedIn profile for ${handle}:`, error)
      return null
    }
  }

  private async getPersonUrn(handle: string): Promise<string | null> {
    const profile = await this.getProfile(handle)
    return profile ? `urn:li:person:${profile.id}` : null
  }

  private async fetchPersonPosts(personUrn: string, since: Date): Promise<RawSocialPost[]> {
    const sinceTimestamp = since.getTime()
    
    const response = await fetch(
      `https://api.linkedin.com/v2/shares?q=owners&owners=${encodeURIComponent(personUrn)}&sortBy=CREATED&sharesPerOwner=50&projection=(id,created,author,specificContent,ugcPostUrn,socialDetail)`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'User-Agent': 'AnalystPortalCrawler/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.status}`)
    }

    const data: LinkedInAPIResponse = await response.json()
    return this.transformLinkedInPosts(data, since)
  }

  private transformLinkedInPosts(data: LinkedInAPIResponse, since: Date): RawSocialPost[] {
    if (!data.elements || data.elements.length === 0) return []

    return data.elements
      .filter(post => {
        const postDate = new Date(post.created.time)
        return postDate >= since
      })
      .map(post => {
        const content = post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || ''
        const authorId = post.author.replace('urn:li:person:', '')
        
        // Extract LinkedIn profile URL from author URN
        const linkedInUrl = `https://www.linkedin.com/feed/update/${post.id}/`

        return {
          id: post.id,
          content: this.cleanContent(content),
          url: linkedInUrl,
          publishedAt: new Date(post.created.time),
          engagements: this.calculateEngagement(
            post.socialDetail?.totalSocialActivityCounts?.numLikes || 0,
            post.socialDetail?.totalSocialActivityCounts?.numShares || 0,
            post.socialDetail?.totalSocialActivityCounts?.numComments || 0
          ),
          author: {
            id: authorId,
            username: authorId, // LinkedIn doesn't expose usernames in this API
            displayName: 'LinkedIn User' // Would need separate API call to get name
          },
          platform: 'linkedin' as const,
          hashtags: this.extractHashtags(content),
          mentions: this.extractMentions(content)
        }
      })
  }

  private extractVanityName(handle: string): string {
    // Extract vanity name from LinkedIn URL or handle
    return handle
      .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')
      .replace(/^https?:\/\/(www\.)?linkedin\.com\/pub\//, '')
      .split('/')[0]
      .split('?')[0]
      .toLowerCase()
  }

  // Override mention extraction for LinkedIn
  protected extractMentions(content: string): string[] {
    // LinkedIn uses different mention format, but we'll stick with @ for now
    const mentionRegex = /@[\w\s]+/g
    const matches = content.match(mentionRegex)
    return matches ? matches.map(mention => mention.substring(1).trim().toLowerCase()) : []
  }
}
