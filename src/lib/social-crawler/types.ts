export interface SocialPlatformConfig {
  name: 'twitter' | 'linkedin'
  apiKey?: string
  apiSecret?: string
  accessToken?: string
  rateLimit: number // requests per hour
  searchDelay: number // milliseconds between requests
}

export interface AnalystSocialHandle {
  analystId: string
  platform: 'twitter' | 'linkedin'
  handle: string
  lastCrawledAt?: Date
}

export interface RawSocialPost {
  id: string
  content: string
  url: string
  publishedAt: Date
  engagements: number
  author: {
    id: string
    username: string
    displayName: string
  }
  platform: 'twitter' | 'linkedin'
  mediaUrls?: string[]
  hashtags?: string[]
  mentions?: string[]
}

export interface PostAnalysis {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  themes: string[]
  relevanceScore: number // 0-100, how relevant to HR/tech industry
  keyEntities: string[] // companies, products, people mentioned
  topicCategories: string[] // AI, HR Tech, Future of Work, etc.
  language: string
}

export interface ProcessedSocialPost extends RawSocialPost {
  analysis: PostAnalysis
  shouldStore: boolean
  reason?: string // why it was filtered out
}

export interface CrawlerJob {
  id: string
  analystId: string
  platform: 'twitter' | 'linkedin'
  handle: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt?: Date
  completedAt?: Date
  postsFound: number
  postsStored: number
  error?: string
}

export interface CrawlerStats {
  totalAnalysts: number
  activeCrawlers: number
  postsFoundToday: number
  postsStoredToday: number
  lastSuccessfulRun: Date
  failedJobs: number
}
