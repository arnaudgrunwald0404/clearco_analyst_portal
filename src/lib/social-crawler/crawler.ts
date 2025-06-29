import { PrismaClient } from '@prisma/client'
import { PostAnalyzer } from './analyzer'
import { TwitterCrawler } from './platforms/twitter'
// import { LinkedInCrawler } from './platforms/linkedin'
import { BasePlatformCrawler } from './platforms/base'
import { 
  CrawlerJob, 
  CrawlerStats, 
  AnalystSocialHandle, 
  RawSocialPost, 
  ProcessedSocialPost 
} from './types'
import { PLATFORM_CONFIGS } from './config'

export class SocialMediaCrawler {
  private prisma: PrismaClient
  private analyzer: PostAnalyzer
  private crawlers: Map<string, BasePlatformCrawler>
  private isRunning: boolean = false

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    this.analyzer = new PostAnalyzer()
    this.crawlers = new Map()
    
    // Initialize platform crawlers
    this.crawlers.set('twitter', new TwitterCrawler(PLATFORM_CONFIGS.twitter))
    // this.crawlers.set('linkedin', new LinkedInCrawler(PLATFORM_CONFIGS.linkedin))
  }

  /**
   * Starts the daily crawling process for all analysts
   */
  async startDailyCrawl(): Promise<CrawlerStats> {
    if (this.isRunning) {
      throw new Error('Crawler is already running')
    }

    this.isRunning = true
    console.log('🚀 Starting daily social media crawl...')

    try {
      const stats: CrawlerStats = {
        totalAnalysts: 0,
        activeCrawlers: 0,
        postsFoundToday: 0,
        postsStoredToday: 0,
        lastSuccessfulRun: new Date(),
        failedJobs: 0
      }

      // Get all analysts with social media handles
      const analysts = await this.getAnalystsWithSocialHandles()
      stats.totalAnalysts = analysts.length

      console.log(`📊 Found ${analysts.length} analysts with social handles`)

      // Process each analyst
      for (const analyst of analysts) {
        for (const handle of analyst.handles) {
          try {
            const job = await this.crawlAnalyst(analyst.id, handle)
            stats.activeCrawlers++
            stats.postsFoundToday += job.postsFound
            stats.postsStoredToday += job.postsStored

            if (job.status === 'failed') {
              stats.failedJobs++
            }

            // Add delay between analysts to be respectful
            await new Promise(resolve => setTimeout(resolve, 2000))
          } catch (error) {
            console.error(`❌ Error processing ${analyst.id} on ${handle.platform}:`, error)
            stats.failedJobs++
          }
        }
      }

      console.log(`✅ Daily crawl completed:`)
      console.log(`   - Analysts processed: ${stats.totalAnalysts}`)
      console.log(`   - Posts found: ${stats.postsFoundToday}`)
      console.log(`   - Posts stored: ${stats.postsStoredToday}`)
      console.log(`   - Failed jobs: ${stats.failedJobs}`)

      return stats
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Crawls posts for a specific analyst
   */
  async crawlAnalyst(analystId: string, handle: AnalystSocialHandle): Promise<CrawlerJob> {
    const job: CrawlerJob = {
      id: `${analystId}-${handle.platform}-${Date.now()}`,
      analystId,
      platform: handle.platform,
      handle: handle.handle,
      status: 'running',
      startedAt: new Date(),
      postsFound: 0,
      postsStored: 0
    }

    try {
      console.log(`🔍 Crawling ${handle.platform} for analyst ${analystId}: ${handle.handle}`)

      const crawler = this.crawlers.get(handle.platform)
      if (!crawler) {
        throw new Error(`No crawler available for platform: ${handle.platform}`)
      }

      // Get posts since last crawl or default lookback
      const sinceDate = handle.lastCrawledAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const rawPosts = await crawler.crawlAnalystPosts(handle, sinceDate)
      job.postsFound = rawPosts.length

      console.log(`   📄 Found ${rawPosts.length} posts`)

      // Process and analyze each post
      let storedCount = 0
      for (const rawPost of rawPosts) {
        try {
          // Check if post already exists
          const existing = await this.prisma.socialPost.findFirst({
            where: {
              url: rawPost.url,
              analystId: analystId
            }
          })

          if (existing) {
            console.log(`   ⏭️  Skipping existing post: ${rawPost.id}`)
            continue
          }

          // Analyze the post
          const analysis = await this.analyzer.analyzePost(rawPost)
          
          // Only store if it meets relevance threshold
          if (this.analyzer.shouldStorePost(analysis)) {
            await this.storePost(analystId, rawPost, analysis)
            storedCount++
            console.log(`   ✅ Stored relevant post (score: ${analysis.relevanceScore})`)
          } else {
            console.log(`   ⏭️  Skipped irrelevant post (score: ${analysis.relevanceScore})`)
          }
        } catch (error) {
          console.error(`   ❌ Error processing post ${rawPost.id}:`, error)
        }
      }

      job.postsStored = storedCount
      job.status = 'completed'
      job.completedAt = new Date()

      // Update last crawled timestamp
      await this.updateLastCrawledTime(analystId, handle.platform)

      console.log(`   📊 Stored ${storedCount} relevant posts`)

    } catch (error) {
      console.error(`❌ Crawl job failed for ${analystId}:`, error)
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
      job.completedAt = new Date()
    }

    return job
  }

  /**
   * Validates and adds a social handle for an analyst
   */
  async addAnalystSocialHandle(
    analystId: string, 
    platform: 'twitter', // | 'linkedin', 
    handle: string
  ): Promise<boolean> {
    const crawler = this.crawlers.get(platform)
    if (!crawler) {
      throw new Error(`No crawler available for platform: ${platform}`)
    }

    // Validate the handle exists
    const isValid = await crawler.validateHandle(handle)
    if (!isValid) {
      throw new Error(`Handle ${handle} not found on ${platform}`)
    }

    // Update analyst with social handle
    const updateData: any = {}
    if (platform === 'twitter') {
      updateData.twitter = handle
    }
    // else if (platform === 'linkedin') {
    //   updateData.linkedIn = handle
    // }

    await this.prisma.analyst.update({
      where: { id: analystId },
      data: updateData
    })

    return true
  }

  /**
   * Gets recent posts for an analyst with search and filtering
   */
  async getAnalystPosts(
    analystId: string,
    options: {
      platform?: 'twitter' // | 'linkedin'
      themes?: string[]
      sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
      minRelevanceScore?: number
      limit?: number
      offset?: number
    } = {}
  ) {
    const where: any = { analystId }

    if (options.platform) {
      where.platform = options.platform.toUpperCase()
    }

    if (options.sentiment) {
      where.sentiment = options.sentiment
    }

    const posts = await this.prisma.socialPost.findMany({
      where,
      include: {
        analyst: {
          select: {
            firstName: true,
            lastName: true,
            company: true
          }
        }
      },
      orderBy: { postedAt: 'desc' },
      take: options.limit || 50,
      skip: options.offset || 0
    })

    // Filter by themes and relevance score in memory
    return posts.filter(post => {
      if (options.themes && options.themes.length > 0) {
        const postThemes = post.themes ? JSON.parse(post.themes) : []
        const hasMatchingTheme = options.themes.some(theme => 
          postThemes.includes(theme)
        )
        if (!hasMatchingTheme) return false
      }

      if (options.minRelevanceScore && post.themes) {
        // We'd need to store relevance score separately or calculate it
        // For now, assume highly engaged posts are more relevant
        const relevanceScore = Math.min(100, post.engagements / 10)
        if (relevanceScore < options.minRelevanceScore) return false
      }

      return true
    })
  }

  /**
   * Gets trending themes across all analysts
   */
  async getTrendingThemes(days: number = 7): Promise<Array<{ theme: string; count: number }>> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const posts = await this.prisma.socialPost.findMany({
      where: {
        postedAt: { gte: since },
        themes: { not: null }
      },
      select: { themes: true }
    })

    const themeCount = new Map<string, number>()
    
    posts.forEach(post => {
      if (post.themes) {
        try {
          const themes = JSON.parse(post.themes) as string[]
          themes.forEach(theme => {
            themeCount.set(theme, (themeCount.get(theme) || 0) + 1)
          })
        } catch (error) {
          console.error('Error parsing themes:', error)
        }
      }
    })

    return Array.from(themeCount.entries())
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
  }

  private async getAnalystsWithSocialHandles(): Promise<Array<{
    id: string
    handles: AnalystSocialHandle[]
  }>> {
    const analysts = await this.prisma.analyst.findMany({
      where: {
        OR: [
          { twitter: { not: null } },
          { linkedIn: { not: null } }
        ],
        status: 'ACTIVE'
      },
      select: {
        id: true,
        twitter: true,
        linkedIn: true
      }
    })

    return analysts.map(analyst => ({
      id: analyst.id,
      handles: [
        ...(analyst.twitter ? [{
          analystId: analyst.id,
          platform: 'twitter' as const,
          handle: analyst.twitter
        }] : []),
        ...(analyst.linkedIn ? [{
          analystId: analyst.id,
          platform: 'linkedin' as const,
          handle: analyst.linkedIn
        }] : [])
      ]
    }))
  }

  private async storePost(
    analystId: string,
    rawPost: RawSocialPost,
    analysis: any
  ): Promise<void> {
    await this.prisma.socialPost.create({
      data: {
        analystId,
        platform: rawPost.platform.toUpperCase() as any,
        content: rawPost.content,
        url: rawPost.url,
        engagements: rawPost.engagements,
        postedAt: rawPost.publishedAt,
        sentiment: analysis.sentiment,
        themes: JSON.stringify(analysis.themes),
        isRelevant: true
      }
    })
  }

  private async updateLastCrawledTime(
    analystId: string,
    platform: string
  ): Promise<void> {
    // Note: We'd need to add a separate table for tracking crawl timestamps
    // or add fields to the analyst table. For now, we'll skip this.
    console.log(`Updated last crawled time for ${analystId} on ${platform}`)
  }
}
