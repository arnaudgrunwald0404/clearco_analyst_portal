import { RawSearchResult, SearchQuery } from './types'
import { RATE_LIMITS, SEARCH_TEMPLATES } from './config'

export abstract class BaseSearchEngine {
  protected lastRequestTime: number = 0
  protected requestCount: number = 0
  protected dailyRequestCount: number = 0
  protected lastResetDate: string = ''

  constructor(protected engineName: string) {}

  abstract search(query: string, maxResults?: number): Promise<RawSearchResult[]>

  /**
   * Enforces rate limiting
   */
  protected async enforceRateLimit(): Promise<void> {
    const config = RATE_LIMITS[this.engineName as keyof typeof RATE_LIMITS]
    if (!config) return

    // Reset daily count if new day
    const today = new Date().toDateString()
    if (this.lastResetDate !== today) {
      this.dailyRequestCount = 0
      this.lastResetDate = today
    }

    // Check daily limit
    if (this.dailyRequestCount >= config.requestsPerDay) {
      throw new Error(`Daily rate limit exceeded for ${this.engineName}`)
    }

    // Check rate limiting
    const timeSinceLastRequest = Date.now() - this.lastRequestTime
    if (timeSinceLastRequest < config.delayBetweenRequests) {
      const waitTime = config.delayBetweenRequests - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.lastRequestTime = Date.now()
    this.dailyRequestCount++
  }

  /**
   * Generates search queries for an analyst
   */
  generateQueries(analystName: string, company: string, year: number = new Date().getFullYear()): string[] {
    const queries: string[] = []
    
    // Use all search templates
    Object.values(SEARCH_TEMPLATES).flat().forEach(template => {
      const query = template
        .replace('{name}', analystName)
        .replace('{company}', company)
        .replace('{year}', year.toString())
      queries.push(query)
    })

    return queries
  }
}

export class GoogleSearchEngine extends BaseSearchEngine {
  private apiKey: string
  private searchEngineId: string

  constructor() {
    super('google')
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || ''
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || ''
  }

  async search(query: string, maxResults: number = 10): Promise<RawSearchResult[]> {
    if (!this.apiKey || !this.searchEngineId) {
      console.warn('Google Search API not configured')
      return []
    }

    await this.enforceRateLimit()

    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.searchEngineId}&q=${encodeURIComponent(query)}&num=${Math.min(maxResults, 10)}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Google Search API error: ${response.status}`)
      }

      const data = await response.json()
      return this.transformGoogleResults(data.items || [])
    } catch (error) {
      console.error('Google search error:', error)
      return []
    }
  }

  private transformGoogleResults(items: any[]): RawSearchResult[] {
    return items.map(item => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      publishedDate: item.pagemap?.metatags?.[0]?.['article:published_time'],
      source: 'Google Search',
      domain: new URL(item.link).hostname,
      searchEngine: 'google' as const
    }))
  }
}

export class BingSearchEngine extends BaseSearchEngine {
  private apiKey: string

  constructor() {
    super('bing')
    this.apiKey = process.env.BING_SEARCH_API_KEY || ''
  }

  async search(query: string, maxResults: number = 10): Promise<RawSearchResult[]> {
    if (!this.apiKey) {
      console.warn('Bing Search API not configured')
      return []
    }

    await this.enforceRateLimit()

    try {
      const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${Math.min(maxResults, 50)}`
      
      const response = await fetch(url, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey
        }
      })

      if (!response.ok) {
        throw new Error(`Bing Search API error: ${response.status}`)
      }

      const data = await response.json()
      return this.transformBingResults(data.webPages?.value || [])
    } catch (error) {
      console.error('Bing search error:', error)
      return []
    }
  }

  private transformBingResults(results: any[]): RawSearchResult[] {
    return results.map(result => ({
      title: result.name,
      url: result.url,
      snippet: result.snippet,
      publishedDate: result.dateLastCrawled,
      source: 'Bing Search',
      domain: new URL(result.url).hostname,
      searchEngine: 'bing' as const
    }))
  }
}

export class LinkedInSearchEngine extends BaseSearchEngine {
  constructor() {
    super('linkedin')
  }

  async search(query: string, maxResults: number = 10): Promise<RawSearchResult[]> {
    await this.enforceRateLimit()

    try {
      // Use Google to search LinkedIn specifically
      const linkedinQuery = `site:linkedin.com ${query}`
      const googleEngine = new GoogleSearchEngine()
      const results = await googleEngine.search(linkedinQuery, maxResults)
      
      return results.map(result => ({
        ...result,
        source: 'LinkedIn Search',
        searchEngine: 'linkedin' as const
      }))
    } catch (error) {
      console.error('LinkedIn search error:', error)
      return []
    }
  }
}

export class ComprehensiveSearchEngine {
  private engines: BaseSearchEngine[]

  constructor() {
    this.engines = [
      new GoogleSearchEngine(),
      new BingSearchEngine(),
      new LinkedInSearchEngine()
    ]
  }

  /**
   * Searches across all available engines
   */
  async searchAll(query: string, maxResults: number = 20): Promise<RawSearchResult[]> {
    const allResults: RawSearchResult[] = []
    const resultsPerEngine = Math.ceil(maxResults / this.engines.length)

    for (const engine of this.engines) {
      try {
        const results = await engine.search(query, resultsPerEngine)
        allResults.push(...results)
      } catch (error) {
        console.error(`Error with ${engine.constructor.name}:`, error)
        continue
      }
    }

    // Remove duplicates and limit results
    const uniqueResults = this.removeDuplicates(allResults)
    return uniqueResults.slice(0, maxResults)
  }

  /**
   * Searches for an analyst across multiple queries and engines
   */
  async searchAnalyst(searchQuery: SearchQuery): Promise<RawSearchResult[]> {
    const allResults: RawSearchResult[] = []
    
    // Generate search queries
    const queries = this.generateAnalystQueries(searchQuery)
    
    for (const query of queries) {
      try {
        const results = await this.searchAll(query, 10)
        allResults.push(...results)
        
        // Add delay between queries to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`Error searching for query "${query}":`, error)
        continue
      }
    }

    return this.removeDuplicates(allResults)
  }

  /**
   * Generates comprehensive search queries for an analyst
   */
  private generateAnalystQueries(searchQuery: SearchQuery): string[] {
    const { analystName, company } = searchQuery
    const currentYear = new Date().getFullYear()
    const queries: string[] = []

    // High-priority searches
    queries.push(
      `"${analystName}" Magic Quadrant ${currentYear}`,
      `"${analystName}" Forrester Wave ${currentYear}`,
      `"${analystName}" research report ${currentYear}`,
      `"${analystName}" ${company} analysis`,
      `"${analystName}" survey results ${currentYear}`,
      `"${analystName}" market analysis ${currentYear}`
    )

    // LinkedIn specific searches
    queries.push(
      `site:linkedin.com "${analystName}" "research shows"`,
      `site:linkedin.com "${analystName}" "top companies"`,
      `site:linkedin.com "${analystName}" "market trends"`
    )

    // Domain specific searches
    const domains = ['gartner.com', 'forrester.com', 'idc.com', 'nelsonhall.com']
    domains.forEach(domain => {
      queries.push(`site:${domain} "${analystName}" ${currentYear}`)
    })

    // Topic-specific searches with search terms
    if (searchQuery.searchTerms?.length > 0) {
      searchQuery.searchTerms.forEach(term => {
        queries.push(`"${analystName}" "${term}" ${currentYear}`)
      })
    }

    return queries.slice(0, 15) // Limit to prevent rate limiting
  }

  /**
   * Removes duplicate results based on URL and title similarity
   */
  private removeDuplicates(results: RawSearchResult[]): RawSearchResult[] {
    const seen = new Set<string>()
    const unique: RawSearchResult[] = []

    for (const result of results) {
      // Check for exact URL duplicates
      if (seen.has(result.url)) {
        continue
      }

      // Check for title similarity (simple approach)
      const isDuplicate = unique.some(existing => {
        const titleSimilarity = this.calculateTitleSimilarity(
          existing.title.toLowerCase(),
          result.title.toLowerCase()
        )
        return titleSimilarity > 0.8
      })

      if (!isDuplicate) {
        seen.add(result.url)
        unique.push(result)
      }
    }

    return unique
  }

  /**
   * Calculates title similarity for duplicate detection
   */
  private calculateTitleSimilarity(title1: string, title2: string): number {
    const words1 = title1.split(/\s+/)
    const words2 = title2.split(/\s+/)
    
    const commonWords = words1.filter(word => 
      words2.includes(word) && word.length > 3
    ).length
    
    const totalWords = Math.max(words1.length, words2.length)
    
    return totalWords > 0 ? commonWords / totalWords : 0
  }
}
