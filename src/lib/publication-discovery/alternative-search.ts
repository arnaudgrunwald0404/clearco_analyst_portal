import { RawSearchResult, SearchQuery } from './types'
import { calculateTitleSimilarity, removeDuplicateResults } from '../utils/similarity'

/**
 * Alternative search engines that don't require API keys
 */

export class DuckDuckGoSearchEngine {
  private baseUrl = 'https://duckduckgo.com'
  private lastRequestTime = 0
  private requestDelay = 2000 // 2 seconds between requests

  async search(query: string, maxResults: number = 10): Promise<RawSearchResult[]> {
    await this.enforceRateLimit()
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    try {
      // DuckDuckGo instant answer API (no key required)
      const instantUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
      
      const response = await fetch(instantUrl, {
        headers: {
          'User-Agent': 'AnalystPortal/1.0 (Educational Research Tool)'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.status}`)
      }

      const text = await response.text()
      
      // Check if response is empty or not valid JSON
      if (!text || text.trim() === '') {
        // DuckDuckGo often returns empty responses for specific queries
        return []
      }
      
      let data
      try {
        data = JSON.parse(text)
      } catch (parseError) {
        // Log only if verbose mode is enabled
        if (process.env.VERBOSE_SEARCH === 'true') {
          console.log('DuckDuckGo returned invalid JSON:', text.substring(0, 100))
        }
        return []
      }
      
      return this.transformDuckDuckGoResults(data, query)
          } catch (error) {
        clearTimeout(timeoutId)
        
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('DuckDuckGo search timeout')
        } else {
          console.log('DuckDuckGo search error (non-critical):', error instanceof Error ? error.message : String(error))
        }
        return []
      }
  }

  private async enforceRateLimit(): Promise<void> {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime
    if (timeSinceLastRequest < this.requestDelay) {
      const waitTime = this.requestDelay - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    this.lastRequestTime = Date.now()
  }

  private transformDuckDuckGoResults(data: any, query: string): RawSearchResult[] {
    const results: RawSearchResult[] = []

    // Process abstract if available
    if (data.Abstract && data.AbstractURL) {
      results.push({
        title: data.Heading || `Search result for: ${query}`,
        url: data.AbstractURL,
        snippet: data.Abstract,
        publishedDate: undefined,
        source: 'DuckDuckGo',
        domain: new URL(data.AbstractURL).hostname,
        searchEngine: 'duckduckgo' as const
      })
    }

    // Process related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
        if (topic.FirstURL && topic.Text) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text,
            url: topic.FirstURL,
            snippet: topic.Text,
            publishedDate: undefined,
            source: 'DuckDuckGo Related',
            domain: new URL(topic.FirstURL).hostname,
            searchEngine: 'duckduckgo' as const
          })
        }
      })
    }

    return results
  }
}

export class DirectWebSearchEngine {
  private knownSources = [
    'gartner.com',
    'forrester.com',
    'idc.com',
    'nelsonhall.com',
    'linkedin.com'
  ]

  async search(query: string, maxResults: number = 10): Promise<RawSearchResult[]> {
    const results: RawSearchResult[] = []
    
    // Search each known source
    for (const domain of this.knownSources.slice(0, 3)) { // Limit to prevent too many requests
      try {
        const domainResults = await this.searchDomain(domain, query)
        results.push(...domainResults)
        
        // Add delay between domain searches
        await new Promise(resolve => setTimeout(resolve, 3000))
      } catch (error) {
        console.error(`Error searching ${domain}:`, error instanceof Error ? error.message : String(error))
        continue
      }
    }

    return results.slice(0, maxResults)
  }

  private async searchDomain(domain: string, query: string): Promise<RawSearchResult[]> {
    // Use DuckDuckGo to search specific domains
    const ddg = new DuckDuckGoSearchEngine()
    const siteQuery = `site:${domain} ${query}`
    return await ddg.search(siteQuery, 3)
  }
}

export class RSS_FeedSearchEngine {
  private feeds = [
    'https://www.gartner.com/en/newsroom/rss',
    'https://www.forrester.com/rss/research',
    'https://www.idc.com/about/rss'
  ]

  async search(query: string, maxResults: number = 10): Promise<RawSearchResult[]> {
    const results: RawSearchResult[] = []
    const searchTerms = query.toLowerCase().split(' ')

    for (const feedUrl of this.feeds) {
      try {
        const feedResults = await this.searchFeed(feedUrl, searchTerms)
        results.push(...feedResults)
      } catch (error) {
        console.error(`Error searching feed ${feedUrl}:`, error)
        continue
      }
    }

    return results.slice(0, maxResults)
  }

  private async searchFeed(feedUrl: string, searchTerms: string[]): Promise<RawSearchResult[]> {
    try {
      // Note: In a real implementation, you'd use an RSS parser
      // For now, we'll return placeholder results
      console.log(`Would search RSS feed: ${feedUrl} for terms: ${searchTerms.join(', ')}`)
      return []
    } catch (error) {
      console.error(`RSS feed error: ${feedUrl}`, error)
      return []
    }
  }
}

export class LinkedInPublicSearchEngine {
  async search(query: string, maxResults: number = 5): Promise<RawSearchResult[]> {
    // Use DuckDuckGo to search LinkedIn specifically
    const ddg = new DuckDuckGoSearchEngine()
    const linkedinQuery = `site:linkedin.com/pulse ${query} OR site:linkedin.com/posts ${query}`
    const results = await ddg.search(linkedinQuery, maxResults)
    
    return results.map(result => ({
      ...result,
      source: 'LinkedIn Public',
      searchEngine: 'linkedin-public' as const
    }))
  }
}

export class AlternativeComprehensiveSearchEngine {
  private engines: Array<{
    engine: any,
    name: string,
    weight: number
  }>

  constructor() {
    this.engines = [
      { engine: new DuckDuckGoSearchEngine(), name: 'DuckDuckGo', weight: 0.4 },
      { engine: new DirectWebSearchEngine(), name: 'Direct Web', weight: 0.3 },
      { engine: new LinkedInPublicSearchEngine(), name: 'LinkedIn', weight: 0.2 },
      { engine: new RSS_FeedSearchEngine(), name: 'RSS Feeds', weight: 0.1 }
    ]
  }

  async searchAll(query: string, maxResults: number = 20): Promise<RawSearchResult[]> {
    const allResults: RawSearchResult[] = []
    
    // Only log if we're not in a production environment or if verbose logging is enabled
    const verbose = process.env.NODE_ENV !== 'production' || process.env.VERBOSE_SEARCH === 'true'
    
    if (verbose) {
      console.log(`🔍 Searching with alternative engines for: "${query}"`)
    }

    for (const { engine, name, weight } of this.engines) {
      try {
        if (verbose) {
          console.log(`   🔎 Searching ${name}...`)
        }
        const engineResults = Math.ceil(maxResults * weight)
        const results = await engine.search(query, engineResults)
        
        if (verbose || results.length > 0) {
          console.log(`   📄 ${name}: Found ${results.length} results`)
        }
        allResults.push(...results)
        
        // Add delay between different search engines
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        if (verbose) {
          console.error(`Error with ${name}:`, error)
        }
        continue
      }
    }

    // Remove duplicates and limit results
    const uniqueResults = removeDuplicateResults(allResults)
    
    if (verbose || uniqueResults.length > 0) {
      console.log(`   ✅ Total unique results: ${uniqueResults.length}`)
    }
    
    return uniqueResults.slice(0, maxResults)
  }

  async searchAnalyst(searchQuery: SearchQuery): Promise<RawSearchResult[]> {
    const allResults: RawSearchResult[] = []
    
    // Generate search queries optimized for alternative engines
    const queries = this.generateAlternativeQueries(searchQuery)
    
    console.log(`🔍 Starting analyst search for: ${searchQuery.analystName}`)
    console.log(`   📋 Generated ${queries.length} search queries`)

    for (const query of queries) {
      try {
        console.log(`   🔎 Query: "${query}"`)
        const results = await this.searchAll(query, 5)
        allResults.push(...results)
        
        // Add delay between queries
        await new Promise(resolve => setTimeout(resolve, 3000))
      } catch (error) {
        console.error(`Error searching for query "${query}":`, error)
        continue
      }
    }

    const uniqueResults = removeDuplicateResults(allResults)
    console.log(`✅ Final results for ${searchQuery.analystName}: ${uniqueResults.length} publications`)
    
    return uniqueResults
  }

  private generateAlternativeQueries(searchQuery: SearchQuery): string[] {
    const { analystName, company } = searchQuery
    const currentYear = new Date().getFullYear()
    const queries: string[] = []

    // High-priority searches that work well with DuckDuckGo
    queries.push(
      `"${analystName}" research ${currentYear}`,
      `"${analystName}" ${company} analysis`,
      `"${analystName}" report ${currentYear}`,
      `"${analystName}" study findings`
    )

    // Domain-specific searches
    const domains = ['gartner.com', 'forrester.com', 'linkedin.com']
    domains.forEach(domain => {
      queries.push(`"${analystName}" site:${domain}`)
    })

    // Topic-specific searches
    if (searchQuery.searchTerms?.length > 0) {
      searchQuery.searchTerms.slice(0, 2).forEach(term => {
        queries.push(`"${analystName}" "${term}"`)
      })
    }

    return queries.slice(0, 8) // Limit to prevent too many requests
  }


}
