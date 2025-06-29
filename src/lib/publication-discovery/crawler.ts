import { PrismaClient } from '@prisma/client'
import { ComprehensiveSearchEngine } from './search-engines'
import { AlternativeComprehensiveSearchEngine } from './alternative-search'
import { PublicationAnalyzer } from './analyzer'
import { SearchQuery, AnalyzedResult, NewsFeedItem } from './types'
import { SIGNIFICANCE_INDICATORS } from './config'

export interface PublicationDiscoveryStats {
  totalAnalysts: number
  searchesPerformed: number
  publicationsFound: number
  publicationsStored: number
  failedSearches: number
  avgRelevanceScore: number
  topSources: string[]
}

export class PublicationDiscoveryCrawler {
  private searchEngine: ComprehensiveSearchEngine | AlternativeComprehensiveSearchEngine
  private analyzer: PublicationAnalyzer
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    
    // Use alternative search engines if Google API is not available
    const hasGoogleAPI = process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID
    const hasBingAPI = process.env.BING_SEARCH_API_KEY
    
    if (hasGoogleAPI) {
      console.log('🔍 Using Google Custom Search API')
      this.searchEngine = new ComprehensiveSearchEngine()
    } else {
      console.log('🔍 Using alternative search engines (DuckDuckGo, Direct Web, etc.)')
      if (!hasGoogleAPI && !hasBingAPI) {
        console.log('⚠️  Running in limited mode - consider adding search API keys for better results')
      }
      this.searchEngine = new AlternativeComprehensiveSearchEngine()
    }
    
    this.analyzer = new PublicationAnalyzer()
  }

  /**
   * Runs the full discovery process for all analysts
   */
  async startFullDiscovery(): Promise<PublicationDiscoveryStats> {
    console.log('🔍 Starting publication discovery crawl...')
    
    const stats: PublicationDiscoveryStats = {
      totalAnalysts: 0,
      searchesPerformed: 0,
      publicationsFound: 0,
      publicationsStored: 0,
      failedSearches: 0,
      avgRelevanceScore: 0,
      topSources: []
    }

    try {
      // Fetch all active analysts
      const analysts = await this.prisma.analyst.findMany({
        where: {
          status: 'ACTIVE'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          keyThemes: true,
          coveredTopics: {
            select: {
              topic: true
            }
          }
        }
      })

      stats.totalAnalysts = analysts.length
      console.log(`📊 Found ${analysts.length} active analysts to process`)

      // Process each analyst
      for (const analyst of analysts) {
        try {
          console.log(`\n🔍 Processing ${analyst.firstName} ${analyst.lastName}...`)
          
          const analystStats = await this.discoverPublicationsForAnalyst(analyst)
          
          // Update cumulative stats
          stats.searchesPerformed += analystStats.searchesPerformed
          stats.publicationsFound += analystStats.publicationsFound
          stats.publicationsStored += analystStats.publicationsStored
          stats.failedSearches += analystStats.failedSearches

          // Add delay between analysts to be respectful to APIs
          await new Promise(resolve => setTimeout(resolve, 5000))
          
        } catch (error) {
          console.error(`❌ Failed to process analyst ${analyst.firstName} ${analyst.lastName}:`, error)
          stats.failedSearches++
        }
      }

      // Calculate final stats
      await this.calculateFinalStats(stats)
      
      console.log('✅ Publication discovery completed successfully')
      return stats

    } catch (error) {
      console.error('❌ Publication discovery failed:', error)
      throw error
    }
  }

  /**
   * Discovers publications for a single analyst
   */
  async discoverPublicationsForAnalyst(analyst: any): Promise<{
    searchesPerformed: number
    publicationsFound: number
    publicationsStored: number
    failedSearches: number
  }> {
    const stats = {
      searchesPerformed: 0,
      publicationsFound: 0,
      publicationsStored: 0,
      failedSearches: 0
    }

    try {
      // Build search query
      const searchQuery: SearchQuery = {
        analystName: `${analyst.firstName} ${analyst.lastName}`,
        company: analyst.company || '',
        searchTerms: this.extractSearchTerms(analyst),
        timeRange: {
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          endDate: new Date()
        }
      }

      console.log(`   🔎 Searching for: ${searchQuery.analystName}`)
      
      // Perform comprehensive search
      const searchResults = await this.searchEngine.searchAnalyst(searchQuery)
      stats.searchesPerformed = 1
      stats.publicationsFound = searchResults.length

      console.log(`   📄 Found ${searchResults.length} potential publications`)

      if (searchResults.length === 0) {
        return stats
      }

      // Analyze each result
      const analyzedResults: AnalyzedResult[] = []
      for (const result of searchResults) {
        try {
          const analysis = await this.analyzer.analyzeResult(
            result, 
            `${analyst.firstName} ${analyst.lastName}`, 
            analyst.company || ''
          )
          if (analysis.relevanceScore >= 60) { // Only keep relevant results (score is 0-100)
            // Convert to AnalyzedResult format
            const analyzedResult: AnalyzedResult = {
              rawResult: result,
              relevanceScore: analysis.relevanceScore / 100, // Convert to 0-1 scale
              significanceScore: analysis.estimatedImpact / 100, // Convert to 0-1 scale
              themes: analysis.themes,
              summary: `${analysis.significance} significance ${analysis.publicationType.toLowerCase()} covering ${analysis.themes.slice(0, 3).join(', ')}`
            }
            analyzedResults.push(analyzedResult)
          }
        } catch (error) {
          console.error(`   ⚠️  Failed to analyze result: ${result.title}`, error)
        }
      }

      console.log(`   ✅ ${analyzedResults.length} results passed analysis`)

      // Store significant publications
      let storedCount = 0
      for (const analyzed of analyzedResults) {
        try {
          if (analyzed.significanceScore >= 0.7) { // Only store significant results
            await this.storePublication(analyst.id, analyzed)
            storedCount++
          }
        } catch (error) {
          console.error(`   ⚠️  Failed to store publication: ${analyzed.rawResult.title}`, error)
        }
      }

      stats.publicationsStored = storedCount
      console.log(`   💾 Stored ${storedCount} significant publications`)

      return stats

    } catch (error) {
      console.error(`   ❌ Search failed for ${analyst.firstName} ${analyst.lastName}:`, error)
      stats.failedSearches = 1
      return stats
    }
  }

  /**
   * Stores a publication in the database
   */
  private async storePublication(analystId: string, analyzed: AnalyzedResult): Promise<void> {
    try {
      // Check if publication already exists
      const existing = await this.prisma.publication.findFirst({
        where: {
          analystId,
          url: analyzed.rawResult.url
        }
      })

      if (existing) {
        console.log(`   📋 Publication already exists: ${analyzed.rawResult.title}`)
        return
      }

      // Determine publication type based on analysis
      const publicationType = this.mapToPublicationType(analyzed)

      // Create publication record
      await this.prisma.publication.create({
        data: {
          analystId,
          title: analyzed.rawResult.title,
          url: analyzed.rawResult.url,
          summary: analyzed.summary || analyzed.rawResult.snippet,
          type: publicationType,
          publishedAt: analyzed.rawResult.publishedDate 
            ? new Date(analyzed.rawResult.publishedDate) 
            : new Date(),
          isTracked: true
        }
      })

      console.log(`   ✅ Stored publication: ${analyzed.rawResult.title}`)

    } catch (error) {
      console.error('Failed to store publication:', error)
      throw error
    }
  }

  /**
   * Maps analyzed content to Prisma publication type
   */
  private mapToPublicationType(analyzed: AnalyzedResult): string {
    const title = analyzed.rawResult.title.toLowerCase()
    const domain = analyzed.rawResult.domain.toLowerCase()

    // Research reports
    if (title.includes('magic quadrant') || 
        title.includes('forrester wave') || 
        title.includes('market guide') ||
        title.includes('critical capabilities') ||
        title.includes('marketscape')) {
      return 'RESEARCH_REPORT'
    }

    // Blog posts and articles
    if (domain.includes('blog') || 
        domain.includes('medium') || 
        title.includes('blog') ||
        analyzed.rawResult.source.includes('LinkedIn')) {
      return 'BLOG_POST'
    }

    // Webinars and podcasts
    if (title.includes('webinar') || 
        title.includes('podcast') || 
        title.includes('interview')) {
      return 'WEBINAR'
    }

    // Whitepapers
    if (title.includes('whitepaper') || 
        title.includes('white paper') ||
        title.includes('research paper')) {
      return 'WHITEPAPER'
    }

    // Default to article
    return 'ARTICLE'
  }

  /**
   * Extracts search terms from analyst data
   */
  private extractSearchTerms(analyst: any): string[] {
    const terms: string[] = []

    // Add covered topics
    if (analyst.coveredTopics) {
      terms.push(...analyst.coveredTopics.map((t: any) => t.topic))
    }

    // Add key themes if available
    if (analyst.keyThemes) {
      try {
        const themes = JSON.parse(analyst.keyThemes)
        if (Array.isArray(themes)) {
          terms.push(...themes)
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    return terms.slice(0, 5) // Limit to prevent too many search terms
  }

  /**
   * Calculates final statistics
   */
  private async calculateFinalStats(stats: PublicationDiscoveryStats): Promise<void> {
    // Calculate average relevance score from recent publications
    const recentPublications = await this.prisma.publication.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      take: 100
    })

    // Get top domains/sources
    const sourceCounts = new Map<string, number>()
    
    for (const pub of recentPublications) {
      if (pub.url) {
        try {
          const domain = new URL(pub.url).hostname
          sourceCounts.set(domain, (sourceCounts.get(domain) || 0) + 1)
        } catch (error) {
          // Ignore URL parsing errors
        }
      }
    }

    stats.topSources = Array.from(sourceCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([domain]) => domain)

    // Set a baseline relevance score (would be calculated from actual analysis)
    stats.avgRelevanceScore = 0.75
  }

  /**
   * Gets recent discoveries for the news feed
   */
  async getRecentDiscoveries(limit: number = 20): Promise<NewsFeedItem[]> {
    const publications = await this.prisma.publication.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        analyst: {
          select: {
            firstName: true,
            lastName: true,
            company: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return publications.map(pub => ({
      id: pub.id,
      title: pub.title,
      description: pub.summary || 'New publication discovered',
      url: pub.url,
      date: pub.publishedAt,
      type: 'PUBLICATION_DISCOVERY',
      metadata: {
        analystName: `${pub.analyst.firstName} ${pub.analyst.lastName}`,
        company: pub.analyst.company,
        publicationType: pub.type
      },
      priority: 'MEDIUM',
      isRead: false
    }))
  }

  /**
   * Gets trending themes from recent discoveries
   */
  async getTrendingThemes(days: number = 7): Promise<Array<{theme: string, count: number}>> {
    // This would analyze recent publications for trending themes
    // For now, return some example data
    return [
      { theme: 'Artificial Intelligence', count: 15 },
      { theme: 'Cloud Computing', count: 12 },
      { theme: 'Cybersecurity', count: 10 },
      { theme: 'Digital Transformation', count: 8 },
      { theme: 'Data Analytics', count: 7 }
    ]
  }
}
